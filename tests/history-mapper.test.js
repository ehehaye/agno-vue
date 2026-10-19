import test from 'node:test'
import assert from 'node:assert/strict'
import { mapSessionRunsToMessages } from '../src/hooks/agno/historyMapper.js'

const baseRun = {
  run_id: 'run-1',
  agent_id: 'agent-1',
  agent_name: 'Agent One',
  run_input: 'hello',
  content: 'world',
  reasoning_content: '',
  messages: [
    { role: 'user', created_at: 1000 },
    { role: 'assistant', created_at: 1001 },
  ],
  tools: [],
  metrics: { duration: 1.5, time_to_first_token: 0.2 },
}

test('maps a simple agent run to user and assistant messages', () => {
  const messages = mapSessionRunsToMessages([baseRun], 'session-1')
  assert.equal(messages.length, 2)
  assert.equal(messages[0].role, 'user')
  assert.equal(messages[0].content, 'hello')
  assert.equal(messages[1].role, 'assistant')
  assert.equal(messages[1].content, 'world')
  assert.equal(messages[1].streamMessage.entity_type, 'agent')
  assert.equal(messages[1].streamMessage.entity_name, 'Agent One')
  assert.equal(messages[1].streamMessage.status, 'completed')
})

test('maps nested runs as team member runs', () => {
  const runs = [
    baseRun,
    {
      run_id: 'member-1',
      parent_run_id: 'run-1',
      agent_id: 'member-agent',
      agent_name: 'Member Agent',
      content: 'member output',
      reasoning_content: '',
      tools: [],
      metrics: { duration: 0.5 },
    },
  ]
  const messages = mapSessionRunsToMessages(runs, 'session-1')
  const stream = messages[1].streamMessage
  assert.equal(stream.entity_type, 'team')
  assert.equal(stream.member_runs.length, 1)
  assert.equal(stream.member_runs[0].agent_name, 'Member Agent')
  assert.equal(stream.member_runs[0].content, 'member output')
})

test('maps run tools to tool call blocks', () => {
  const run = {
    ...baseRun,
    tools: [
      {
        tool_call_id: 'tc-1',
        tool_name: 'search',
        tool_args: { q: 'agno' },
        tool_call_error: false,
        result: 'ok',
      },
    ],
  }
  const messages = mapSessionRunsToMessages([run], 'session-1')
  const toolCall = messages[1].streamMessage.tool_calls[0]
  assert.equal(toolCall.status, 'completed')
  assert.equal(toolCall.tool.tool_name, 'search')
  assert.deepEqual(toolCall.tool.tool_args, { q: 'agno' })
})

test('falls back to assistant message tool calls', () => {
  const run = {
    ...baseRun,
    tools: [],
    messages: [
      { role: 'user', created_at: 1000 },
      {
        role: 'assistant',
        created_at: 1001,
        tool_calls: [
          {
            id: 'tc-2',
            function: { name: 'lookup', arguments: '{"q":"agno"}' },
          },
        ],
      },
    ],
  }
  const messages = mapSessionRunsToMessages([run], 'session-1')
  const toolCall = messages[1].streamMessage.tool_calls[0]
  assert.equal(toolCall.tool.tool_name, 'lookup')
  assert.deepEqual(toolCall.tool.tool_args, { q: 'agno' })
})

test('does not throw on malformed tool arguments', () => {
  const run = {
    ...baseRun,
    tools: [],
    messages: [
      { role: 'user', created_at: 1000 },
      {
        role: 'assistant',
        created_at: 1001,
        tool_calls: [
          { id: 'tc-3', function: { name: 'lookup', arguments: '{oops' } },
        ],
      },
    ],
  }
  const messages = mapSessionRunsToMessages([run], 'session-1')
  assert.equal(messages[1].streamMessage.tool_calls[0].tool.tool_args, '{oops')
})

test('skips assistant messages without content', () => {
  const run = { ...baseRun, content: '', reasoning_content: '' }
  const messages = mapSessionRunsToMessages([run], 'session-1')
  assert.equal(messages.length, 1)
  assert.equal(messages[0].role, 'user')
})

test('returns an empty list for invalid input', () => {
  assert.deepEqual(mapSessionRunsToMessages(null, 'session-1'), [])
  assert.deepEqual(mapSessionRunsToMessages(undefined, 'session-1'), [])
})
