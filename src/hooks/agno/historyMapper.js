import { $c } from '@/constants'
import { uuid } from '@/utils/index'
import { tryParseJson } from '@/utils/content-utils'

const EMPTY_TOOL_FIELDS = {
  requires_confirmation: null,
  confirmed: null,
  confirmation_note: null,
  requires_user_input: null,
  user_input_schema: null,
  user_feedback_schema: null,
  answered: null,
  external_execution_required: null,
  external_execution_silent: null,
  approval_type: null,
  approval_id: null,
}

function createTool(tool) {
  return {
    tool_call_id: tool.tool_call_id,
    tool_name: tool.tool_name,
    tool_args: tool.tool_args,
    tool_call_error: tool.tool_call_error,
    result: tool.result,
    metrics: tool.metrics,
    child_run_id: tool.child_run_id,
    stop_after_tool_call: tool.stop_after_tool_call,
    created_at: tool.created_at,
    ...EMPTY_TOOL_FIELDS,
  }
}

function mapRunTool(tool) {
  return {
    tool: createTool(tool),
    status: tool.tool_call_error
      ? $c.ToolCallStatus.Error
      : $c.ToolCallStatus.Completed,
  }
}

function mapAssistantToolCall(toolCall, createdAt) {
  return {
    tool: createTool({
      tool_call_id: toolCall.id,
      tool_name: toolCall.function?.name,
      tool_args:
        tryParseJson(toolCall.function?.arguments) ??
        toolCall.function?.arguments,
      tool_call_error: false,
      result: null,
      metrics: null,
      child_run_id: null,
      stop_after_tool_call: false,
      created_at: createdAt,
    }),
    status: $c.ToolCallStatus.Completed,
  }
}

function mapMemberRun(childRun, parentRunId) {
  return {
    run_id: childRun.run_id,
    agent_id: childRun.agent_id,
    agent_name: childRun.agent_name || childRun.agent_id,
    reasoning_content: childRun.reasoning_content || '',
    content: childRun.content || '',
    tool_calls: (childRun.tools || []).map(mapRunTool),
    status: $c.RunStatus.Completed,
    parent_run_id: parentRunId,
    metrics: {
      time_to_first_token: childRun.metrics?.time_to_first_token,
      duration: childRun.metrics?.duration,
      model: childRun.metrics?.details?.model?.[0]?.id,
      provider: childRun.metrics?.details?.model?.[0]?.provider,
    },
  }
}

function toTimestamp(seconds) {
  return typeof seconds === 'number' ? seconds * 1000 : Date.now()
}

export function mapSessionRunsToMessages(runs, sessionId) {
  if (!Array.isArray(runs)) {
    return []
  }

  const topLevelRuns = runs.filter((run) => !run.parent_run_id)
  const childRunsByParent = new Map()
  runs
    .filter((run) => run.parent_run_id)
    .forEach((run) => {
      const children = childRunsByParent.get(run.parent_run_id) || []
      children.push(run)
      childRunsByParent.set(run.parent_run_id, children)
    })

  const messages = []

  topLevelRuns.forEach((run) => {
    const children = childRunsByParent.get(run.run_id) || []
    const entityType = children.length > 0 ? 'team' : 'agent'

    const assistantMessage = run.messages?.find(
      (message) =>
        message.role === $c.Role.Assistant &&
        message.tool_calls &&
        message.tool_calls.length > 0
    )

    let toolCalls = []
    if (run.tools && run.tools.length > 0) {
      toolCalls = run.tools.map(mapRunTool)
    } else if (assistantMessage?.tool_calls) {
      toolCalls = assistantMessage.tool_calls.map((toolCall) =>
        mapAssistantToolCall(toolCall, assistantMessage.created_at)
      )
    }

    if (run.run_input) {
      messages.push({
        id: uuid(),
        role: $c.Role.User,
        content: run.run_input,
        timestamp: toTimestamp(run.messages?.[0]?.created_at),
      })
    }

    if (!run.content && !run.reasoning_content) {
      return
    }

    const lastMessage = run.messages?.[run.messages.length - 1]

    messages.push({
      id: uuid(),
      role: $c.Role.Assistant,
      content: run.content || '',
      timestamp: toTimestamp(lastMessage?.created_at),
      streamMessage: {
        run_id: run.run_id,
        session_id: sessionId,
        entity_type: entityType,
        entity_id: run.agent_id,
        entity_name: run.agent_name || run.agent_id,
        reasoning_content: run.reasoning_content || '',
        content: run.content || '',
        tool_calls: toolCalls,
        member_runs: children.map((childRun) =>
          mapMemberRun(childRun, run.run_id)
        ),
        status: $c.RunStatus.Completed,
        metrics: {
          time_to_first_token: run.metrics?.time_to_first_token,
          duration: run.metrics?.duration,
          model: run.metrics?.details?.model?.[0]?.id,
          provider: run.metrics?.details?.model?.[0]?.provider,
        },
      },
    })
  })

  return messages
}
