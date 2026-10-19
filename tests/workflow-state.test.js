import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addWorkflowStepToolCall,
  appendWorkflowStepContent,
  applyWorkflowRunOutput,
  buildStepRequirements,
  completeWorkflowRun,
  completeWorkflowStep,
  createWorkflowRun,
  pauseWorkflowStep,
  resolveWorkflowStepToolCall,
  startWorkflowStep,
} from '../src/hooks/agno/workflowState.js'

const startedEvent = {
  run_id: 'wf-run-1',
  session_id: 'session-1',
  workflow_id: 'research-pipeline',
  workflow_name: 'Research Pipeline',
}

test('creates a workflow run from WorkflowStarted', () => {
  const run = createWorkflowRun(startedEvent)
  assert.equal(run.entity_type, 'workflow')
  assert.equal(run.entity_id, 'research-pipeline')
  assert.equal(run.entity_name, 'Research Pipeline')
  assert.equal(run.status, 'streaming')
  assert.deepEqual(run.steps, [])
})

test('routes streamed content to the step from the event', () => {
  let run = createWorkflowRun(startedEvent)
  run = startWorkflowStep(run, {
    step_id: 's1',
    step_name: 'research',
    step_index: 0,
  })
  run = startWorkflowStep(run, {
    step_id: 's2',
    step_name: 'draft',
    step_index: [1, 0],
    parent_step_id: 'container',
  })

  run = appendWorkflowStepContent(run, {
    step_id: 's1',
    step_name: 'research',
    content: 'outline',
  })
  run = appendWorkflowStepContent(run, {
    step_id: 's2',
    step_name: 'draft',
    content: 'draft text',
  })

  const research = run.steps.find((step) => step.id === 's1')
  const draft = run.steps.find((step) => step.id === 's2')
  assert.equal(research.content, 'outline')
  assert.equal(draft.content, 'draft text')
})

test('nested steps inherit depth from their parent step', () => {
  let run = createWorkflowRun(startedEvent)
  run = startWorkflowStep(run, {
    step_id: 'p1',
    step_name: 'draft-and-review',
    step_index: 1,
  }, 'Parallel')
  run = startWorkflowStep(run, {
    step_id: 's1',
    step_name: 'draft',
    step_index: [1, 0],
    parent_step_id: 'p1',
  })

  assert.equal(run.steps.find((step) => step.id === 'p1').depth, 0)
  assert.equal(run.steps.find((step) => step.id === 's1').depth, 1)
})

test('tracks tool calls inside workflow steps', () => {
  let run = createWorkflowRun(startedEvent)
  run = startWorkflowStep(run, { step_id: 's1', step_name: 'research' })
  const tool = { tool_call_id: 'tc-1', tool_name: 'search' }

  run = addWorkflowStepToolCall(run, { step_id: 's1', tool })
  assert.equal(run.steps[0].tool_calls[0].status, 'running')

  run = resolveWorkflowStepToolCall(run, {
    step_id: 's1',
    tool: { ...tool, tool_call_error: false },
  })
  assert.equal(run.steps[0].tool_calls[0].status, 'completed')
})

test('completes a step with the final event content', () => {
  let run = createWorkflowRun(startedEvent)
  run = startWorkflowStep(run, { step_id: 's1', step_name: 'research' })
  run = completeWorkflowStep(run, {
    step_id: 's1',
    content: 'final outline',
  })
  assert.equal(run.steps[0].status, 'completed')
  assert.equal(run.steps[0].content, 'final outline')
})

test('marks the run paused and exposes the active requirement', () => {
  let run = createWorkflowRun(startedEvent)
  run = startWorkflowStep(run, { step_id: 's1', step_name: 'publish', step_index: 5 })
  run = pauseWorkflowStep(run, {
    step_id: 's1',
    step_name: 'publish',
    step_index: 5,
    requires_confirmation: true,
    confirmation_message: 'Publish?',
  })

  assert.equal(run.status, 'paused')
  assert.equal(run.steps[0].status, 'paused')
  assert.equal(run.pausedRequirement.confirmation_message, 'Publish?')
})

test('enriches the pause with the stored step requirements', () => {
  let run = createWorkflowRun(startedEvent)
  run = startWorkflowStep(run, { step_id: 's1', step_name: 'publish', step_index: 5 })
  run = applyWorkflowRunOutput(run, {
    status: 'PAUSED',
    step_requirements: [
      { step_id: 'old', step_name: 'research', confirmed: true },
      {
        step_id: 's1',
        step_name: 'publish',
        step_index: 5,
        step_type: 'Step',
        requires_confirmation: true,
        confirmation_message: 'Publish?',
        on_reject: 'cancel',
      },
    ],
  })

  assert.equal(run.status, 'paused')
  assert.equal(run.pausedRequirement.step_id, 's1')
  assert.equal(run.pausedRequirement.on_reject, 'cancel')
})

test('builds a resolved confirmation requirement for continue', () => {
  const requirements = buildStepRequirements(
    {
      step_id: 's1',
      step_name: 'publish',
      step_index: 5,
      step_type: 'Step',
      requires_confirmation: true,
      on_reject: 'cancel',
    },
    true
  )

  assert.deepEqual(requirements, [
    {
      step_id: 's1',
      step_name: 'publish',
      step_index: 5,
      step_type: 'Step',
      requires_confirmation: true,
      confirmed: true,
      on_reject: 'cancel',
    },
  ])
})

test('passes rejection feedback when rejecting a step', () => {
  const requirement = {
    step_id: 's1',
    step_name: 'publish',
    step_index: 5,
    step_type: 'Step',
    requires_confirmation: true,
    on_reject: 'retry',
  }

  const rejected = buildStepRequirements(requirement, false, {
    feedback: 'Add the cost section before publishing.',
  })
  assert.equal(rejected[0].confirmed, false)
  assert.equal(
    rejected[0].rejection_feedback,
    'Add the cost section before publishing.'
  )

  const approved = buildStepRequirements(requirement, true, {
    feedback: 'ignored on approve',
  })
  assert.equal(approved[0].confirmed, true)
  assert.equal(approved[0].rejection_feedback, undefined)
})

test('reuses the paused step when continue mints a new step id', () => {
  let run = createWorkflowRun(startedEvent)
  run = startWorkflowStep(run, { step_id: 'paused-id', step_name: 'publish', step_index: 5 })
  run = pauseWorkflowStep(run, {
    step_id: 'paused-id',
    step_name: 'publish',
    step_index: 5,
    requires_confirmation: true,
  })

  run = completeWorkflowStep(run, {
    step_id: 'continued-id',
    step_name: 'publish',
    step_index: 5,
    content: 'published',
  })

  assert.equal(run.steps.length, 1)
  assert.equal(run.steps[0].status, 'completed')
  assert.equal(run.steps[0].content, 'published')
})

test('completes the workflow and all running steps', () => {
  let run = createWorkflowRun(startedEvent)
  run = startWorkflowStep(run, { step_id: 's1', step_name: 'research' })
  run = completeWorkflowRun(run, { content: 'done' })

  assert.equal(run.status, 'completed')
  assert.equal(run.content, 'done')
  assert.equal(run.steps[0].status, 'completed')
})
