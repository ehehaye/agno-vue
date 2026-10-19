import test from 'node:test'
import assert from 'node:assert/strict'
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
} from '../src/hooks/agno/runState.js'

test('creates an agent run from a RunStarted event', () => {
  const run = createRunFromEvent(
    {
      run_id: 'run-1',
      session_id: 'session-1',
      agent_id: 'agent-1',
      agent_name: 'Agent One',
      model: 'model',
      model_provider: 'provider',
    },
    'agent'
  )
  assert.equal(run.entity_type, 'agent')
  assert.equal(run.entity_id, 'agent-1')
  assert.equal(run.entity_name, 'Agent One')
  assert.equal(run.status, 'streaming')
})

test('creates a team run from a TeamRunStarted event', () => {
  const run = createRunFromEvent(
    {
      run_id: 'run-1',
      session_id: 'session-1',
      team_id: 'team-1',
      team_name: 'Team One',
    },
    'team'
  )
  assert.equal(run.entity_type, 'team')
  assert.equal(run.entity_id, 'team-1')
  assert.equal(run.entity_name, 'Team One')
})

test('appends content and reasoning immutably', () => {
  const run = createRunFromEvent({ run_id: 'run-1', agent_id: 'a' }, 'agent')
  const next = appendRunContent(run, {
    content: 'hello',
    reasoning_content: 'thinking',
  })
  assert.notEqual(next, run)
  assert.equal(next.content, 'hello')
  assert.equal(next.reasoning_content, 'thinking')
  assert.equal(run.content, '')
})

test('tracks tool call lifecycle', () => {
  const run = createRunFromEvent({ run_id: 'run-1', agent_id: 'a' }, 'agent')
  const tool = { tool_call_id: 'tc-1', tool_name: 'search' }
  const started = addToolCall(run, { tool })
  assert.equal(started.tool_calls[0].status, 'running')

  const completed = resolveToolCall(started, { tool, tool_call_error: false })
  assert.equal(completed.tool_calls[0].status, 'completed')

  const failed = resolveToolCall(started, {
    tool: { ...tool, tool_call_error: true },
  })
  assert.equal(failed.tool_calls[0].status, 'error')
})

test('completes a run with metrics and falls back to previous values', () => {
  const run = createRunFromEvent({ run_id: 'run-1', agent_id: 'a' }, 'agent')
  run.content = 'partial'

  const completed = completeRun(run, {
    content: 'final',
    metrics: {
      time_to_first_token: 0.2,
      duration: 1.5,
      input_tokens: 100,
      output_tokens: 20,
      total_tokens: 120,
    },
  })
  assert.equal(completed.content, 'final')
  assert.equal(completed.status, 'completed')
  assert.equal(completed.metrics.duration, 1.5)
  assert.equal(completed.metrics.total_tokens, 120)

  const withoutMetrics = completeRun(run, { content: 'final' })
  assert.equal(withoutMetrics.metrics.duration, undefined)
})

test('tracks member run lifecycle', () => {
  const member = createMemberRun(
    { run_id: 'member-1', agent_id: 'a', agent_name: 'Member' },
    'run-1'
  )
  assert.equal(member.parent_run_id, 'run-1')

  const withContent = appendMemberContent(member, { content: 'text' })
  assert.equal(withContent.content, 'text')

  const withTool = addMemberToolCall(withContent, {
    tool: { tool_call_id: 'tc-1' },
  })
  const resolved = resolveMemberToolCall(withTool, {
    tool: { tool_call_id: 'tc-1' },
    tool_call_error: false,
  })
  assert.equal(resolved.tool_calls[0].status, 'completed')

  const completed = completeMemberRun(resolved, {
    content: 'final',
    metrics: { duration: 1, input_tokens: 8, output_tokens: 2 },
  })
  assert.equal(completed.status, 'completed')
  assert.equal(completed.content, 'final')
  assert.equal(completed.metrics.input_tokens, 8)
})

test('normalizes run errors', () => {
  assert.equal(getEventError({ error: 'boom' }), 'boom')
  assert.equal(getEventError({ error: { message: 'boom' } }), 'boom')
  assert.equal(getEventError({ message: 'boom' }), 'boom')
  assert.equal(getEventError({}), 'Run failed')
})

test('detects whether a run has renderable output', () => {
  assert.equal(hasRunOutput({ content: '' }), false)
  assert.equal(hasRunOutput({ content: 'x' }), true)
  assert.equal(hasRunOutput({ tool_calls: [{}] }), true)
  assert.equal(hasRunOutput({ member_runs: [{}] }), true)
})
