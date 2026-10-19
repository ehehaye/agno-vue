import { $c } from '@/constants'

export function getEventError(event) {
  if (typeof event.error === 'string') {
    return event.error
  }
  if (event.error && typeof event.error.message === 'string') {
    return event.error.message
  }
  return event.message || 'Run failed'
}

export function hasRunOutput(run) {
  return Boolean(
    run.content ||
    run.reasoning_content ||
    run.tool_calls?.length ||
    run.member_runs?.length ||
    run.steps?.length
  )
}

export function createRunFromEvent(event, entityType) {
  const isTeam = entityType === 'team'
  return {
    run_id: event.run_id,
    session_id: event.session_id,
    entity_type: entityType,
    entity_id: isTeam ? event.team_id : event.agent_id,
    entity_name: isTeam ? event.team_name : event.agent_name,
    reasoning_content: '',
    content: '',
    tool_calls: [],
    member_runs: [],
    status: $c.RunStatus.Streaming,
    metrics: {
      model: event.model,
      provider: event.model_provider,
    },
  }
}

export function appendRunContent(run, event) {
  if (!run) {
    return run
  }
  return {
    ...run,
    reasoning_content: run.reasoning_content + (event.reasoning_content || ''),
    content: run.content + (event.content || ''),
  }
}

export function addToolCall(run, event) {
  if (!run) {
    return run
  }
  return {
    ...run,
    tool_calls: [
      ...run.tool_calls,
      { tool: event.tool, status: $c.ToolCallStatus.Running },
    ],
  }
}

export function resolveToolCall(run, event) {
  if (!run) {
    return run
  }
  return {
    ...run,
    tool_calls: run.tool_calls.map((toolCall) =>
      toolCall.tool.tool_call_id === event.tool.tool_call_id
        ? {
          tool: event.tool,
          status: event.tool.tool_call_error
            ? $c.ToolCallStatus.Error
            : $c.ToolCallStatus.Completed,
        }
        : toolCall
    ),
  }
}

export function completeRun(run, event) {
  if (!run) {
    return run
  }
  return {
    ...run,
    content: event.content ?? run.content,
    reasoning_content: event.reasoning_content ?? run.reasoning_content,
    status: $c.RunStatus.Completed,
    metrics: {
      ...run.metrics,
      time_to_first_token:
        event.metrics?.time_to_first_token ??
        run.metrics?.time_to_first_token,
      duration: event.metrics?.duration ?? run.metrics?.duration,
    },
  }
}

export function createMemberRun(event, parentRunId) {
  return {
    run_id: event.run_id,
    agent_id: event.agent_id,
    agent_name: event.agent_name,
    reasoning_content: '',
    content: '',
    tool_calls: [],
    status: $c.RunStatus.Streaming,
    parent_run_id: parentRunId,
  }
}

export function appendMemberContent(memberRun, event) {
  return {
    ...memberRun,
    reasoning_content:
      memberRun.reasoning_content + (event.reasoning_content || ''),
    content: memberRun.content + (event.content || ''),
  }
}

export function addMemberToolCall(memberRun, event) {
  return {
    ...memberRun,
    tool_calls: [
      ...memberRun.tool_calls,
      { tool: event.tool, status: $c.ToolCallStatus.Running },
    ],
  }
}

export function resolveMemberToolCall(memberRun, event) {
  return {
    ...memberRun,
    tool_calls: memberRun.tool_calls.map((toolCall) =>
      toolCall.tool.tool_call_id === event.tool.tool_call_id
        ? {
          tool: event.tool,
          status: event.tool.tool_call_error
            ? $c.ToolCallStatus.Error
            : $c.ToolCallStatus.Completed,
        }
        : toolCall
    ),
  }
}

export function completeMemberRun(memberRun, event) {
  return {
    ...memberRun,
    content: event.content ?? memberRun.content,
    reasoning_content:
      event.reasoning_content ?? memberRun.reasoning_content,
    status: $c.RunStatus.Completed,
    metrics: {
      time_to_first_token: event.metrics?.time_to_first_token,
      duration: event.metrics?.duration,
    },
  }
}
