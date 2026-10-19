import { ref, watch } from '@vue/composition-api'
import { $c } from '@/constants'
import events, { RuntimeEvents } from '@/hooks/agno/events'
import { mapSessionRunsToMessages } from '@/hooks/agno/historyMapper'
import {
  addMemberToolCall,
  addToolCall,
  appendMemberContent,
  appendRunContent,
  completeMemberRun,
  completeRun,
  createMemberRun,
  createRunFromEvent,
  getEventError,
  hasRunOutput,
  resolveMemberToolCall,
  resolveToolCall,
} from '@/hooks/agno/runState'
import { useConfig } from '@/hooks/agno/useConfig'
import {
  addWorkflowStepToolCall,
  appendWorkflowStepContent,
  applyWorkflowRunOutput,
  applyWorkflowStepOutput,
  buildStepRequirements,
  cancelWorkflowRun,
  completeWorkflowRun,
  completeWorkflowStep,
  createWorkflowRun,
  failWorkflowRun,
  failWorkflowStep,
  pauseWorkflowStep,
  resolveWorkflowStepToolCall,
  resumeWorkflowRun,
  setWorkflowStepExecutor,
  setWorkflowStepMetrics,
  startWorkflowStep,
} from '@/hooks/agno/workflowState'
import { isTeamEvent } from '@/utils/event'
import { uuid } from '@/utils/id'
import { SSEParser } from '@/utils/sse-parser'

const ENTITY_ENDPOINTS = {
  agent: 'agents',
  team: 'teams',
  workflow: 'workflows',
}

const messages = ref([])
const currentRun = ref(null)
const isStreaming = ref(false)
const isLoadingSession = ref(false)
const error = ref(null)

const parser = new SSEParser()
const memberRuns = new Map()
let activeController = null
let activeSessionController = null
let sessionLoadToken = 0

const {
  serverUrl,
  connectionStatus,
  selectedEntity,
  currentSessionId,
  setCurrentSessionId,
} = useConfig()

function getLastUserMessage() {
  return [...messages.value]
    .reverse()
    .find((message) => message.role === $c.Role.User)
}

function onSessionIdUpdate(runEvent) {
  const session = {
    agent_id: runEvent.agent_id,
    created_at: new Date(runEvent.created_at * 1000).toISOString(),
    session_id: runEvent.session_id,
    session_name: getLastUserMessage()?.content || '',
    session_type: selectedEntity.value?.type,
  }
  if (session.session_id !== currentSessionId.value) {
    setCurrentSessionId(session.session_id)
    events.emit(RuntimeEvents.SESSION_CREATED, session)
  }
}

function updateMemberRunsInCurrentRun() {
  if (!currentRun.value) {
    return
  }
  currentRun.value = {
    ...currentRun.value,
    member_runs: Array.from(memberRuns.values()),
  }
}

function finalizeCurrentRun(status, payload = {}) {
  const prevRun = currentRun.value
  if (!prevRun) {
    return null
  }

  const finalRun =
    status === $c.RunStatus.Completed
      ? completeRun(prevRun, payload)
      : {
        ...prevRun,
        status,
        ...(payload.error ? { error: payload.error } : {}),
      }

  if (hasRunOutput(finalRun)) {
    messages.value = [
      ...messages.value,
      {
        id: uuid(),
        role: $c.Role.Assistant,
        content: finalRun.content,
        timestamp: Date.now(),
        streamMessage: finalRun,
      },
    ]
  }

  currentRun.value = null
  return finalRun
}

function handleMemberAgentEvent(event, parentRunId) {
  switch (event.event) {
  case $c.RunEvent.RunStarted: {
    memberRuns.set(event.run_id, createMemberRun(event, parentRunId))
    updateMemberRunsInCurrentRun()
    break
  }

  case $c.RunEvent.RunContent: {
    const memberRun = memberRuns.get(event.run_id)
    if (memberRun) {
      memberRuns.set(event.run_id, appendMemberContent(memberRun, event))
      updateMemberRunsInCurrentRun()
    }
    break
  }

  case $c.RunEvent.ToolCallStarted: {
    const memberRun = memberRuns.get(event.run_id)
    if (memberRun) {
      memberRuns.set(event.run_id, addMemberToolCall(memberRun, event))
      updateMemberRunsInCurrentRun()
    }
    break
  }

  case $c.RunEvent.ToolCallCompleted: {
    const memberRun = memberRuns.get(event.run_id)
    if (memberRun) {
      memberRuns.set(event.run_id, resolveMemberToolCall(memberRun, event))
      updateMemberRunsInCurrentRun()
    }
    break
  }

  case $c.RunEvent.RunCompleted: {
    const memberRun = memberRuns.get(event.run_id)
    if (memberRun) {
      memberRuns.set(event.run_id, completeMemberRun(memberRun, event))
      updateMemberRunsInCurrentRun()
    }
    break
  }

  case $c.RunEvent.RunError:
  case $c.RunEvent.RunCancelled: {
    const memberRun = memberRuns.get(event.run_id)
    if (memberRun) {
      const isError = event.event === $c.RunEvent.RunError
      memberRuns.set(event.run_id, {
        ...memberRun,
        status: isError
          ? $c.RunStatus.Error
          : $c.RunStatus.Cancelled,
        ...(isError ? { error: getEventError(event) } : {}),
      })
      updateMemberRunsInCurrentRun()
    }
    break
  }
  }
}

function handleTeamEvent(event) {
  switch (event.event) {
  case $c.RunEvent.TeamRunStarted: {
    onSessionIdUpdate(event)
    currentRun.value = createRunFromEvent(event, 'team')
    memberRuns.clear()
    break
  }

  case $c.RunEvent.TeamRunContent: {
    currentRun.value = appendRunContent(currentRun.value, event)
    break
  }

  case $c.RunEvent.TeamToolCallStarted: {
    currentRun.value = addToolCall(currentRun.value, event)
    break
  }

  case $c.RunEvent.TeamToolCallCompleted: {
    currentRun.value = resolveToolCall(currentRun.value, event)
    break
  }

  case $c.RunEvent.TeamRunCompleted: {
    finalizeCurrentRun($c.RunStatus.Completed, event)
    break
  }

  case $c.RunEvent.TeamRunError: {
    const message = getEventError(event)
    error.value = message
    finalizeCurrentRun($c.RunStatus.Error, { error: message })
    break
  }

  case $c.RunEvent.TeamRunCancelled: {
    finalizeCurrentRun($c.RunStatus.Cancelled)
    break
  }
  }
}

function handleAgentRunEvent(event) {
  const parentRunId = event.parent_run_id

  if (parentRunId) {
    if (currentRun.value?.run_id === parentRunId) {
      handleMemberAgentEvent(event, parentRunId)
    }
    return
  }

  switch (event.event) {
  case $c.RunEvent.RunStarted: {
    onSessionIdUpdate(event)
    currentRun.value = createRunFromEvent(event, 'agent')
    break
  }

  case $c.RunEvent.RunContent: {
    currentRun.value = appendRunContent(currentRun.value, event)
    break
  }

  case $c.RunEvent.ToolCallStarted: {
    currentRun.value = addToolCall(currentRun.value, event)
    break
  }

  case $c.RunEvent.ToolCallCompleted: {
    currentRun.value = resolveToolCall(currentRun.value, event)
    break
  }

  case $c.RunEvent.RunCompleted: {
    finalizeCurrentRun($c.RunStatus.Completed, event)
    break
  }

  case $c.RunEvent.RunError: {
    const message = getEventError(event)
    error.value = message
    finalizeCurrentRun($c.RunStatus.Error, { error: message })
    break
  }

  case $c.RunEvent.RunCancelled: {
    finalizeCurrentRun($c.RunStatus.Cancelled)
    break
  }
  }
}

function handleWorkflowEvent(event) {
  switch (event.event) {
  case $c.RunEvent.WorkflowStarted: {
    onSessionIdUpdate(event)
    currentRun.value = createWorkflowRun(event)
    break
  }

  case $c.RunEvent.WorkflowCompleted: {
    currentRun.value = completeWorkflowRun(currentRun.value, event)
    finalizeCurrentRun($c.RunStatus.Completed, event)
    break
  }

  case $c.RunEvent.WorkflowError: {
    const message = getEventError(event)
    error.value = message
    currentRun.value = failWorkflowRun(currentRun.value, { ...event, error: message })
    finalizeCurrentRun($c.RunStatus.Error, { error: message })
    break
  }

  case $c.RunEvent.WorkflowCancelled: {
    currentRun.value = cancelWorkflowRun(currentRun.value, event)
    finalizeCurrentRun($c.RunStatus.Cancelled)
    break
  }

  case $c.RunEvent.WorkflowRunOutput: {
    currentRun.value = applyWorkflowRunOutput(currentRun.value, event)
    break
  }

  case $c.RunEvent.StepStarted: {
    currentRun.value = startWorkflowStep(currentRun.value, event)
    break
  }

  case $c.RunEvent.StepCompleted: {
    currentRun.value = completeWorkflowStep(currentRun.value, event)
    break
  }

  case $c.RunEvent.StepPaused:
  case $c.RunEvent.StepOutputReview:
  case $c.RunEvent.StepExecutorPaused: {
    currentRun.value = pauseWorkflowStep(currentRun.value, event)
    break
  }

  case $c.RunEvent.StepContinued:
  case $c.RunEvent.StepExecutorContinued: {
    currentRun.value = currentRun.value
      ? {
        ...currentRun.value,
        status: $c.RunStatus.Streaming,
        pausedRequirement: null,
        steps: currentRun.value.steps.map((step) =>
          step.id === event.step_id
            ? { ...step, status: $c.StepStatus.Running }
            : step
        ),
      }
      : currentRun.value
    break
  }

  case $c.RunEvent.StepError: {
    currentRun.value = failWorkflowStep(currentRun.value, event)
    break
  }

  case $c.RunEvent.StepOutput: {
    currentRun.value = applyWorkflowStepOutput(currentRun.value, event)
    break
  }

  case $c.RunEvent.ParallelExecutionStarted: {
    currentRun.value = startWorkflowStep(currentRun.value, event, 'Parallel')
    break
  }

  case $c.RunEvent.ConditionExecutionStarted: {
    currentRun.value = startWorkflowStep(currentRun.value, event, 'Condition')
    break
  }

  case $c.RunEvent.LoopExecutionStarted: {
    currentRun.value = startWorkflowStep(currentRun.value, event, 'Loop')
    break
  }

  case $c.RunEvent.RouterExecutionStarted: {
    currentRun.value = startWorkflowStep(currentRun.value, event, 'Router')
    break
  }

  case $c.RunEvent.StepsExecutionStarted: {
    currentRun.value = startWorkflowStep(currentRun.value, event, 'Steps')
    break
  }

  case $c.RunEvent.ParallelExecutionCompleted:
  case $c.RunEvent.ConditionExecutionCompleted:
  case $c.RunEvent.LoopExecutionCompleted:
  case $c.RunEvent.RouterExecutionCompleted:
  case $c.RunEvent.StepsExecutionCompleted: {
    currentRun.value = completeWorkflowStep(currentRun.value, event)
    break
  }

  case $c.RunEvent.RunStarted:
  case $c.RunEvent.TeamRunStarted: {
    if (event.step_id) {
      currentRun.value = setWorkflowStepExecutor(currentRun.value, event)
    }
    break
  }

  case $c.RunEvent.RunCompleted:
  case $c.RunEvent.TeamRunCompleted: {
    if (event.step_id) {
      currentRun.value = setWorkflowStepMetrics(currentRun.value, event)
    }
    break
  }

  case $c.RunEvent.RunContent:
  case $c.RunEvent.TeamRunContent: {
    currentRun.value = appendWorkflowStepContent(currentRun.value, event)
    break
  }

  case $c.RunEvent.ToolCallStarted:
  case $c.RunEvent.TeamToolCallStarted: {
    currentRun.value = addWorkflowStepToolCall(currentRun.value, event)
    break
  }

  case $c.RunEvent.ToolCallCompleted:
  case $c.RunEvent.TeamToolCallCompleted: {
    currentRun.value = resolveWorkflowStepToolCall(currentRun.value, event)
    break
  }

  case $c.RunEvent.RunError:
  case $c.RunEvent.TeamRunError: {
    currentRun.value = failWorkflowStep(currentRun.value, {
      ...event,
      error: getEventError(event),
    })
    break
  }
  }
}

function handleAgentEvent(event) {
  if (selectedEntity.value?.type === 'workflow') {
    handleWorkflowEvent(event)
  } else if (isTeamEvent(event)) {
    handleTeamEvent(event)
  } else {
    handleAgentRunEvent(event)
  }
}

async function readEventStream(response) {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    parser.parse(decoder.decode(value, { stream: true }), handleAgentEvent)
  }

  parser.flush(handleAgentEvent)
}

async function httpError(response, fallback) {
  try {
    const data = await response.clone().json()
    if (typeof data?.detail === 'string' && data.detail) {
      return new Error(data.detail)
    }
  } catch {
    // Response is not JSON; use the fallback message.
  }
  return new Error(fallback)
}

function finishStreaming(controller) {
  if (activeController !== controller) {
    return
  }

  if (currentRun.value?.status === $c.RunStatus.Streaming) {
    finalizeCurrentRun(
      controller.signal.aborted
        ? $c.RunStatus.Cancelled
        : $c.RunStatus.Error,
      controller.signal.aborted
        ? {}
        : { error: error.value || 'Stream ended unexpectedly' }
    )
  }

  activeController = null
  isStreaming.value = false
}

async function sendMessage(content) {
  if (isStreaming.value) {
    return
  }

  if (!selectedEntity.value) {
    error.value = 'Please select an agent, team or workflow from the sidebar'
    return
  }

  error.value = null
  messages.value = [
    ...messages.value,
    {
      id: uuid(),
      role: $c.Role.User,
      content,
      timestamp: Date.now(),
    },
  ]
  currentRun.value = null
  isStreaming.value = true
  parser.reset()
  memberRuns.clear()

  const controller = new AbortController()
  activeController = controller

  try {
    const formData = new URLSearchParams()
    formData.append('message', content)
    formData.append('stream', 'true')
    if (currentSessionId.value) {
      formData.append('session_id', currentSessionId.value)
    }

    const endpoint = ENTITY_ENDPOINTS[selectedEntity.value.type]
    const response = await fetch(
      `${serverUrl.value}/${endpoint}/${selectedEntity.value.id}/runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      }
    )

    if (!response.ok) {
      throw await httpError(response, `HTTP error! status: ${response.status}`)
    }

    await readEventStream(response)
  } catch (err) {
    if (activeController !== controller || err?.name === 'AbortError') {
      return
    }
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    finishStreaming(controller)
  }
}

async function continueRun(approved = true, targetRun = null, options = {}) {
  const run = targetRun || currentRun.value
  if (isStreaming.value || !run?.pausedRequirement || !run.run_id) {
    return
  }

  error.value = null
  messages.value = messages.value.filter(
    (message) => message.streamMessage?.run_id !== run.run_id
  )
  currentRun.value = resumeWorkflowRun(run)
  isStreaming.value = true
  parser.reset()

  const controller = new AbortController()
  activeController = controller

  try {
    const formData = new URLSearchParams()
    formData.append('session_id', run.session_id || '')
    formData.append('stream', 'true')
    formData.append(
      'step_requirements',
      JSON.stringify(
        buildStepRequirements(run.pausedRequirement, approved, options)
      )
    )

    const response = await fetch(
      `${serverUrl.value}/workflows/${run.entity_id}/runs/${run.run_id}/continue`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      }
    )

    if (!response.ok) {
      throw await httpError(response, `HTTP error! status: ${response.status}`)
    }

    await readEventStream(response)
  } catch (err) {
    if (activeController !== controller || err?.name === 'AbortError') {
      return
    }
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    finishStreaming(controller)
  }
}

function cancelRun() {
  activeController?.abort()
}

function cancelSessionLoad() {
  sessionLoadToken += 1
  if (activeSessionController) {
    activeSessionController.abort()
    activeSessionController = null
  }
}

function clearMessages() {
  cancelRun()
  cancelSessionLoad()
  messages.value = []
  currentRun.value = null
  error.value = null
  memberRuns.clear()
}

async function loadSession(targetSessionId) {
  if (!serverUrl.value) {
    error.value = 'Server URL not configured'
    return
  }

  cancelRun()
  cancelSessionLoad()
  const token = ++sessionLoadToken
  const controller = new AbortController()
  activeSessionController = controller

  isLoadingSession.value = true
  error.value = null
  messages.value = []
  currentRun.value = null
  parser.reset()
  memberRuns.clear()

  try {
    const response = await fetch(
      `${serverUrl.value}/sessions/${targetSessionId}/runs`,
      { signal: controller.signal }
    )

    if (!response.ok) {
      throw new Error(`Failed to load session: ${response.status}`)
    }

    const runs = await response.json()

    if (token !== sessionLoadToken) {
      return
    }

    messages.value = mapSessionRunsToMessages(runs, targetSessionId)
  } catch (err) {
    if (token !== sessionLoadToken || err?.name === 'AbortError') {
      return
    }
    error.value = err instanceof Error ? err.message : 'Failed to load session'
  } finally {
    if (token === sessionLoadToken) {
      isLoadingSession.value = false
      activeSessionController = null
    }
  }
}

watch(currentSessionId, (next) => {
  if (!next) {
    clearMessages()
  }
})

watch([connectionStatus, selectedEntity], () => {
  clearMessages()
})

export function useAgentRun() {
  return {
    messages,
    currentRun,
    isStreaming,
    isLoadingSession,
    error,
    sendMessage,
    continueRun,
    loadSession,
    clearMessages,
    cancelRun,
  }
}
