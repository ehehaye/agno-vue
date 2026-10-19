import { $c } from '@/constants'

function findStep(run, stepId) {
  return run.steps.find((step) => step.id === stepId)
}

// Continued runs can mint a new step_id for a step that was paused. Fall back to
// name + index so the resumed step updates the existing block instead of adding
// a duplicate one.
function resolveStepId(run, event) {
  if (event.step_id && findStep(run, event.step_id)) {
    return event.step_id
  }
  if (!event.step_name) {
    return event.step_id
  }
  const match = run.steps.find(
    (step) =>
      step.name === event.step_name &&
      (
        step.index == null ||
        event.step_index == null ||
        JSON.stringify(step.index) === JSON.stringify(event.step_index)
      )
  )
  return match ? match.id : event.step_id
}

function updateStep(run, stepId, patch) {
  return {
    ...run,
    steps: run.steps.map((step) =>
      step.id === stepId ? { ...step, ...patch } : step
    ),
  }
}

function stepDepth(run, parentStepId) {
  if (!parentStepId) {
    return 0
  }
  const parent = run.steps.find((step) => step.id === parentStepId)
  return parent ? parent.depth + 1 : 0
}

function createStep(event, run, patch = {}) {
  return {
    id: event.step_id,
    name: event.step_name || event.step_id,
    index: event.step_index,
    parent_step_id: event.parent_step_id || null,
    depth: stepDepth(run, event.parent_step_id),
    type: 'Step',
    status: $c.StepStatus.Running,
    content: '',
    reasoning_content: '',
    tool_calls: [],
    executor_name: event.agent_name || event.team_name || null,
    metrics: null,
    ...patch,
  }
}

export function createWorkflowRun(event) {
  return {
    run_id: event.run_id,
    session_id: event.session_id,
    entity_type: 'workflow',
    entity_id: event.workflow_id,
    entity_name: event.workflow_name || event.workflow_id,
    content: '',
    reasoning_content: '',
    tool_calls: [],
    member_runs: [],
    steps: [],
    status: $c.RunStatus.Streaming,
    pausedRequirement: null,
    metrics: {},
  }
}

export function startWorkflowStep(run, event, type = 'Step') {
  if (!run) {
    return run
  }
  const stepId = resolveStepId(run, event)
  if (!stepId) {
    return run
  }

  if (findStep(run, stepId)) {
    return updateStep(run, stepId, {
      status: $c.StepStatus.Running,
      content: '',
      reasoning_content: '',
      tool_calls: [],
      executor_name: event.agent_name || event.team_name,
    })
  }

  if (!event.step_id) {
    return run
  }

  return {
    ...run,
    steps: [...run.steps, createStep(event, run, { type })],
  }
}

export function appendWorkflowStepContent(run, event) {
  if (!run) {
    return run
  }
  const stepId = resolveStepId(run, event)
  if (!stepId) {
    return run
  }

  const step = findStep(run, stepId)
  const nextRun = step
    ? run
    : startWorkflowStep(run, { ...event, step_id: stepId })
  const current = findStep(nextRun, stepId)
  if (!current) {
    return run
  }
  return updateStep(nextRun, stepId, {
    content: current.content + (event.content || ''),
    reasoning_content:
      current.reasoning_content + (event.reasoning_content || ''),
  })
}

export function setWorkflowStepExecutor(run, event) {
  if (!run) {
    return run
  }
  const stepId = resolveStepId(run, event)
  if (!stepId || !findStep(run, stepId)) {
    return run
  }
  return updateStep(run, stepId, {
    executor_name:
      event.agent_name || event.team_name || findStep(run, stepId).executor_name,
  })
}

export function addWorkflowStepToolCall(run, event) {
  if (!run) {
    return run
  }
  const stepId = resolveStepId(run, event)
  const step = stepId ? findStep(run, stepId) : null
  if (!step) {
    return run
  }
  return updateStep(run, stepId, {
    tool_calls: [
      ...step.tool_calls,
      { tool: event.tool, status: $c.ToolCallStatus.Running },
    ],
  })
}

export function resolveWorkflowStepToolCall(run, event) {
  if (!run) {
    return run
  }
  const stepId = resolveStepId(run, event)
  const step = stepId ? findStep(run, stepId) : null
  if (!step) {
    return run
  }
  return updateStep(run, stepId, {
    tool_calls: step.tool_calls.map((toolCall) =>
      toolCall.tool.tool_call_id === event.tool.tool_call_id
        ? {
          tool: event.tool,
          status: event.tool.tool_call_error
            ? $c.ToolCallStatus.Error
            : $c.ToolCallStatus.Completed,
        }
        : toolCall
    ),
  })
}

export function completeWorkflowStep(run, event) {
  if (!run) {
    return run
  }
  const stepId = resolveStepId(run, event)
  const step = stepId ? findStep(run, stepId) : null
  if (!step) {
    return run
  }
  return updateStep(run, stepId, {
    status: $c.StepStatus.Completed,
    content: event.content ?? step.content,
    reasoning_content: event.reasoning_content ?? step.reasoning_content,
    metrics: event.metrics || step.metrics,
  })
}

export function applyWorkflowStepOutput(run, event) {
  const output = event.step_output
  if (!run || !output || !output.step_id) {
    return run
  }
  const eventInfo = {
    step_id: output.step_id,
    step_name: output.step_name,
    step_index: event.step_index,
  }
  const stepId = resolveStepId(run, eventInfo)
  const step = stepId ? findStep(run, stepId) : null
  const patch = {
    status: $c.StepStatus.Completed,
    content: output.content ?? step?.content ?? '',
    type: output.step_type || step?.type || 'Step',
    executor_name: output.executor_name || step?.executor_name || null,
    metrics: output.metrics || step?.metrics || null,
  }
  if (step) {
    return updateStep(run, stepId, patch)
  }
  return {
    ...run,
    steps: [
      ...run.steps,
      createStep(
        {
          step_id: output.step_id,
          step_name: output.step_name,
          step_index: event.step_index,
        },
        run,
        patch
      ),
    ],
  }
}

export function failWorkflowStep(run, event) {
  if (!run) {
    return run
  }
  const stepId = resolveStepId(run, event)
  const step = stepId ? findStep(run, stepId) : null
  if (!step) {
    return run
  }
  return updateStep(run, stepId, {
    status: $c.StepStatus.Error,
    error: event.error || 'Step failed',
  })
}

function pickRequirement(requirement) {
  return {
    step_id: requirement.step_id,
    step_name: requirement.step_name,
    step_index: requirement.step_index,
    step_type: requirement.step_type || 'Step',
    requires_confirmation: Boolean(requirement.requires_confirmation),
    confirmation_message: requirement.confirmation_message,
    requires_user_input: Boolean(requirement.requires_user_input),
    user_input_message: requirement.user_input_message,
    user_input_schema: requirement.user_input_schema,
    requires_route_selection: Boolean(requirement.requires_route_selection),
    available_choices: requirement.available_choices,
    allow_multiple_selections: Boolean(requirement.allow_multiple_selections),
    requires_output_review: Boolean(requirement.requires_output_review),
    output_review_message: requirement.output_review_message,
    requires_executor_input: Boolean(requirement.requires_executor_input),
    executor_name: requirement.executor_name,
    on_reject: requirement.on_reject || 'cancel',
  }
}

function pauseStep(run, stepId, requirement) {
  if (!stepId) {
    return run
  }
  const step = findStep(run, stepId)
  if (!step) {
    return {
      ...run,
      steps: [
        ...run.steps,
        createStep(
          {
            step_id: stepId,
            step_name: requirement.step_name,
            step_index: requirement.step_index,
          },
          run,
          { status: $c.StepStatus.Paused }
        ),
      ],
    }
  }
  return updateStep(run, stepId, { status: $c.StepStatus.Paused })
}

export function pauseWorkflowStep(run, event) {
  if (!run) {
    return run
  }
  const requirement = pickRequirement(event)
  const nextRun = pauseStep(run, resolveStepId(run, event), requirement)
  return {
    ...nextRun,
    status: $c.RunStatus.Paused,
    pausedRequirement: requirement,
  }
}

export function applyWorkflowRunOutput(run, output) {
  if (!run || String(output?.status || '').toLowerCase() !== $c.RunStatus.Paused) {
    return run
  }
  const requirements = output.step_requirements || []
  const active = requirements[requirements.length - 1]
  if (!active) {
    return { ...run, status: $c.RunStatus.Paused }
  }
  const requirement = pickRequirement(active)
  return {
    ...pauseStep(run, resolveStepId(run, active), requirement),
    status: $c.RunStatus.Paused,
    pausedRequirement: requirement,
    metrics: output.metrics || run.metrics,
  }
}

export function resumeWorkflowRun(run) {
  if (!run) {
    return run
  }
  return {
    ...run,
    status: $c.RunStatus.Streaming,
    pausedRequirement: null,
    steps: run.steps.map((step) =>
      step.status === $c.StepStatus.Paused
        ? { ...step, status: $c.StepStatus.Running }
        : step
    ),
  }
}

export function completeWorkflowRun(run, event) {
  if (!run) {
    return run
  }
  return {
    ...run,
    content: event.content ?? run.content,
    reasoning_content: event.reasoning_content ?? run.reasoning_content,
    status: $c.RunStatus.Completed,
    pausedRequirement: null,
    steps: run.steps.map((step) =>
      step.status === $c.StepStatus.Running ||
      step.status === $c.StepStatus.Paused
        ? { ...step, status: $c.StepStatus.Completed }
        : step
    ),
    metrics: {
      ...run.metrics,
      duration: event.metrics?.duration ?? run.metrics?.duration,
    },
  }
}

export function failWorkflowRun(run, event) {
  if (!run) {
    return run
  }
  return {
    ...run,
    status: $c.RunStatus.Error,
    error: event.error || 'Workflow failed',
    pausedRequirement: null,
  }
}

export function cancelWorkflowRun(run, event) {
  if (!run) {
    return run
  }
  return {
    ...run,
    status: $c.RunStatus.Cancelled,
    reason: event.reason,
    pausedRequirement: null,
    steps: run.steps.map((step) =>
      step.status === $c.StepStatus.Running
        ? { ...step, status: $c.StepStatus.Cancelled }
        : step
    ),
  }
}

export function buildStepRequirements(requirement, approved = true, extra = {}) {
  if (!requirement?.step_id) {
    return []
  }

  const payload = {
    step_id: requirement.step_id,
    step_name: requirement.step_name,
    step_index: requirement.step_index,
    step_type: requirement.step_type || 'Step',
    requires_confirmation: Boolean(requirement.requires_confirmation),
    confirmed: approved,
    on_reject: requirement.on_reject || 'cancel',
  }

  if (requirement.requires_user_input) {
    payload.requires_user_input = true
    payload.user_input = extra.userInput || {}
  }

  if (requirement.requires_route_selection) {
    payload.requires_route_selection = true
    payload.selected_choices = extra.selectedChoices || []
  }

  if (requirement.requires_output_review) {
    payload.requires_output_review = true
    payload.edited_output = extra.editedOutput
  }

  if (!approved && extra.feedback) {
    payload.rejection_feedback = extra.feedback
  }

  return [payload]
}
