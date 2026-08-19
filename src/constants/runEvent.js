export const RunEvent = {
  // Agent Events
  RunStarted: 'RunStarted', 
  RunContent: 'RunContent',
  RunCompleted: 'RunCompleted',
  RunError: 'RunError',
  RunOutput: 'RunOutput',
  UpdatingMemory: 'UpdatingMemory',
  ToolCallStarted: 'ToolCallStarted',
  ToolCallCompleted: 'ToolCallCompleted',
  MemoryUpdateStarted: 'MemoryUpdateStarted',
  MemoryUpdateCompleted: 'MemoryUpdateCompleted',
  ReasoningStarted: 'ReasoningStarted',
  ReasoningStep: 'ReasoningStep',
  ReasoningCompleted: 'ReasoningCompleted',
  RunCancelled: 'RunCancelled',
  RunPaused: 'RunPaused',
  RunContinued: 'RunContinued',
  // Team Events
  TeamRunStarted: 'TeamRunStarted',
  TeamRunContent: 'TeamRunContent',
  TeamRunCompleted: 'TeamRunCompleted',
  TeamRunError: 'TeamRunError',
  TeamRunCancelled: 'TeamRunCancelled',
  TeamToolCallStarted: 'TeamToolCallStarted',
  TeamToolCallCompleted: 'TeamToolCallCompleted',
  TeamReasoningStarted: 'TeamReasoningStarted',
  TeamReasoningStep: 'TeamReasoningStep',
  TeamReasoningCompleted: 'TeamReasoningCompleted',
  TeamMemoryUpdateStarted: 'TeamMemoryUpdateStarted',
  TeamMemoryUpdateCompleted: 'TeamMemoryUpdateCompleted',
}

export const RunStatus = {
  Streaming: 'streaming',
  Completed: 'completed',
  Error: 'error',
}
