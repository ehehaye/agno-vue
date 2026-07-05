import { ref, watch } from '@vue/composition-api';
import { isTeamEvent } from '@/types';
import { SSEParser } from '@/utils/sse-parser';
import { useConfig } from '@/hooks/agno/useConfig';
import { uuid } from '@/utils/index';
import events, { RuntimeEvents } from '@/hooks/agno/events';

const messages = ref([]);
const currentRun = ref(null);
const isStreaming = ref(false);
const error = ref(null);

export function useAgentRun() {
  const { serverUrl, connectionStatus, selectedEntity, currentSessionId, setCurrentSessionId } =
    useConfig();

  const parser = new SSEParser();
  const memberRuns = new Map();

  function onSessionIdUpdate(runEvent) {
    const session = {
      agent_id: runEvent.agent_id,
      created_at: new Date(runEvent.created_at * 1000).toISOString(),
      session_id: runEvent.session_id,
      session_name: messages.value[0]?.content || '',
      session_type: selectedEntity.value?.type,
    };
    if (session.session_id !== currentSessionId.value) {
      setCurrentSessionId(session.session_id);
      events.emit(RuntimeEvents.SESSION_CREATED, session);
    }
  }

  function updateMemberRunsInCurrentRun() {
    if (!currentRun.value) return;
    currentRun.value = {
      ...currentRun.value,
      member_runs: Array.from(memberRuns.values()),
    };
  }

  function handleMemberAgentEvent(event, parentRunId) {
    switch (event.event) {
      case 'RunStarted': {
        const runEvent = event;
        const memberRun = {
          run_id: runEvent.run_id,
          agent_id: runEvent.agent_id,
          agent_name: runEvent.agent_name,
          reasoning_content: '',
          content: '',
          tool_calls: [],
          status: 'streaming',
          parent_run_id: parentRunId,
        };
        memberRuns.set(runEvent.run_id, memberRun);
        updateMemberRunsInCurrentRun();
        break;
      }

      case 'RunContent': {
        const contentEvent = event;
        const memberRun = memberRuns.get(contentEvent.run_id);
        if (memberRun) {
          memberRun.reasoning_content += contentEvent.reasoning_content || '';
          memberRun.content += contentEvent.content || '';
          updateMemberRunsInCurrentRun();
        }
        break;
      }

      case 'ToolCallStarted': {
        const toolEvent = event;
        const memberRun = memberRuns.get(toolEvent.run_id);
        if (memberRun) {
          memberRun.tool_calls.push({
            tool: toolEvent.tool,
            status: 'running',
          });
          updateMemberRunsInCurrentRun();
        }
        break;
      }

      case 'ToolCallCompleted': {
        const toolEvent = event;
        const memberRun = memberRuns.get(toolEvent.run_id);
        if (memberRun) {
          memberRun.tool_calls = memberRun.tool_calls.map((tc) =>
            tc.tool.tool_call_id === toolEvent.tool.tool_call_id
              ? {
                  tool: toolEvent.tool,
                  status: toolEvent.tool.tool_call_error
                    ? 'error'
                    : 'completed',
                }
              : tc
          );
          updateMemberRunsInCurrentRun();
        }
        break;
      }

      case 'RunCompleted': {
        const completedEvent = event;
        const memberRun = memberRuns.get(completedEvent.run_id);
        if (memberRun) {
          memberRun.content = completedEvent.content;
          memberRun.reasoning_content = completedEvent.reasoning_content;
          memberRun.status = 'completed';
          memberRun.metrics = {
            time_to_first_token: completedEvent.metrics?.time_to_first_token,
            duration: completedEvent.metrics?.duration,
          };
          updateMemberRunsInCurrentRun();
        }
        break;
      }
    }
  }

  function handleTeamEvent(event) {
    switch (event.event) {
      case 'TeamRunStarted': {
        const runEvent = event;
        onSessionIdUpdate(runEvent);
        const newRun = {
          run_id: runEvent.run_id,
          session_id: runEvent.session_id,
          entity_type: 'team',
          entity_id: runEvent.team_id,
          entity_name: runEvent.team_name,
          reasoning_content: '',
          content: '',
          tool_calls: [],
          member_runs: [],
          status: 'streaming',
          metrics: {
            model: runEvent.model,
            provider: runEvent.model_provider,
          },
        };
        currentRun.value = newRun;
        memberRuns.clear();
        break;
      }

      case 'TeamRunContent': {
        const contentEvent = event;
        if (!currentRun.value) break;
        currentRun.value = {
          ...currentRun.value,
          reasoning_content:
            currentRun.value.reasoning_content +
            (contentEvent.reasoning_content || ''),
          content: currentRun.value.content + (contentEvent.content || ''),
        };
        break;
      }

      case 'TeamToolCallStarted': {
        const toolEvent = event;
        if (!currentRun.value) break;
        currentRun.value = {
          ...currentRun.value,
          tool_calls: [
            ...currentRun.value.tool_calls,
            { tool: toolEvent.tool, status: 'running' },
          ],
        };
        break;
      }

      case 'TeamToolCallCompleted': {
        const toolEvent = event;
        if (!currentRun.value) break;
        currentRun.value = {
          ...currentRun.value,
          tool_calls: currentRun.value.tool_calls.map((tc) =>
            tc.tool.tool_call_id === toolEvent.tool.tool_call_id
              ? {
                  tool: toolEvent.tool,
                  status: toolEvent.tool.tool_call_error
                    ? 'error'
                    : 'completed',
                }
              : tc
          ),
        };
        break;
      }

      case 'TeamRunCompleted': {
        const completedEvent = event;
        const prevRun = currentRun.value;
        if (prevRun) {
          const finalRun = {
            ...prevRun,
            content: completedEvent.content,
            reasoning_content: completedEvent.reasoning_content,
            status: 'completed',
            metrics: {
              ...prevRun.metrics,
              time_to_first_token: completedEvent.metrics.time_to_first_token,
              duration: completedEvent.metrics.duration,
            },
          };
          const assistantMessage = {
            id: uuid(),
            role: 'assistant',
            content: completedEvent.content,
            timestamp: Date.now(),
            streamMessage: finalRun,
          };
          messages.value = [...messages.value, assistantMessage];
          currentRun.value = null;
        }
        break;
      }
    }
  }

  function handleAgentRunEvent(event) {
    const agentEvent = event;
    const parentRunId = agentEvent.parent_run_id;

    if (parentRunId && currentRun.value?.run_id === parentRunId) {
      handleMemberAgentEvent(agentEvent, parentRunId);
      return;
    }

    switch (event.event) {
      case 'RunStarted': {
        const runEvent = event;
        onSessionIdUpdate(runEvent);
        const newRun = {
          run_id: runEvent.run_id,
          session_id: runEvent.session_id,
          entity_type: 'agent',
          entity_id: runEvent.agent_id,
          entity_name: runEvent.agent_name,
          reasoning_content: '',
          content: '',
          tool_calls: [],
          member_runs: [],
          status: 'streaming',
          metrics: {
            model: runEvent.model,
            provider: runEvent.model_provider,
          },
        };
        currentRun.value = newRun;
        break;
      }

      case 'RunContent': {
        const contentEvent = event;
        if (!currentRun.value) break;
        currentRun.value = {
          ...currentRun.value,
          reasoning_content:
            currentRun.value.reasoning_content +
            (contentEvent.reasoning_content || ''),
          content: currentRun.value.content + (contentEvent.content || ''),
        };
        break;
      }

      case 'ToolCallStarted': {
        const toolEvent = event;
        if (!currentRun.value) break;
        currentRun.value = {
          ...currentRun.value,
          tool_calls: [
            ...currentRun.value.tool_calls,
            { tool: toolEvent.tool, status: 'running' },
          ],
        };
        break;
      }

      case 'ToolCallCompleted': {
        const toolEvent = event;
        if (!currentRun.value) break;
        currentRun.value = {
          ...currentRun.value,
          tool_calls: currentRun.value.tool_calls.map((tc) =>
            tc.tool.tool_call_id === toolEvent.tool.tool_call_id
              ? {
                  tool: toolEvent.tool,
                  status: toolEvent.tool.tool_call_error
                    ? 'error'
                    : 'completed',
                }
              : tc
          ),
        };
        break;
      }

      case 'RunCompleted': {
        const completedEvent = event;
        const prevRun = currentRun.value;
        if (prevRun) {
          const finalRun = {
            ...prevRun,
            content: completedEvent.content,
            reasoning_content: completedEvent.reasoning_content,
            status: 'completed',
            metrics: {
              ...prevRun.metrics,
              time_to_first_token: completedEvent.metrics.time_to_first_token,
              duration: completedEvent.metrics.duration,
            },
          };
          const assistantMessage = {
            id: uuid(),
            role: 'assistant',
            content: completedEvent.content,
            timestamp: Date.now(),
            streamMessage: finalRun,
          };
          messages.value = [...messages.value, assistantMessage];
          currentRun.value = null;
        }
        break;
      }
    }
  }

  function handleAgentEvent(event) {
    // TODO: workflow
    if (isTeamEvent(event)) {
      handleTeamEvent(event);
    } else {
      handleAgentRunEvent(event);
    }
  }

  async function sendMessage(content) {
    if (isStreaming.value) return;

    if (!selectedEntity.value) {
      error.value = 'Please select an agent or team from the sidebar';
      return;
    }

    error.value = null;
    const userMessage = {
      id: uuid(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    messages.value = [...messages.value, userMessage];
    isStreaming.value = true;
    parser.reset();
    memberRuns.clear();

    try {
      // TODO: background
      const formData = new URLSearchParams();
      formData.append('message', content);
      formData.append('stream', 'true');
      if (currentSessionId.value) {
        formData.append('session_id', currentSessionId.value);
      }

      const endpoint =
        selectedEntity.value.type === 'team' ? 'teams' : 'agents';
      const response = await fetch(
        `${serverUrl.value}/${endpoint}/${selectedEntity.value.id}/runs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        parser.parse(chunk, handleAgentEvent);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = errorMessage;
      if (currentRun.value) {
        currentRun.value = { ...currentRun.value, status: 'error' };
      }
    } finally {
      isStreaming.value = false;
    }
  }

  function clearMessages() {
    // TODO: AbortController
    messages.value = [];
    currentRun.value = null;
    error.value = null;
    memberRuns.clear();
  }

  watch(currentSessionId, (next) => {
    if (!next) {
      clearMessages();
    }
  });

  watch([connectionStatus, selectedEntity], () => {
    clearMessages();
  });

  // TODO: resume
  // TODO: move to useSessionManager
  async function loadSession(targetSessionId) {
    if (!serverUrl.value) {
      error.value = 'Server URL not configured';
      return;
    }

    isStreaming.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${serverUrl.value}/sessions/${targetSessionId}/runs`
      );

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }

      const runs = await response.json();

      const topLevelRuns = runs.filter((r) => !r.parent_run_id);
      const childRuns = runs.filter((r) => r.parent_run_id);

      const memberRunsByParent = new Map();
      childRuns.forEach((run) => {
        const parentId = run.parent_run_id;
        if (!memberRunsByParent.has(parentId)) {
          memberRunsByParent.set(parentId, []);
        }
        memberRunsByParent.get(parentId).push(run);
      });

      topLevelRuns.sort((a, b) => {
        const aTime = a.messages?.[0]?.created_at || 0;
        const bTime = b.messages?.[0]?.created_at || 0;
        return aTime - bTime;
      });

      const loadedMessages = [];

      topLevelRuns.forEach((run) => {
        const hasMemberRuns = memberRunsByParent.has(run.run_id);
        const entityType = hasMemberRuns ? 'team' : 'agent';

        const assistantMessage = run.messages?.find(
          (m) =>
            m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0
        );

        let toolCalls = [];
        if (run.tools && run.tools.length > 0) {
          toolCalls = run.tools.map((tool) => ({
            tool: {
              tool_call_id: tool.tool_call_id,
              tool_name: tool.tool_name,
              tool_args: tool.tool_args,
              tool_call_error: tool.tool_call_error,
              result: tool.result,
              metrics: tool.metrics,
              child_run_id: tool.child_run_id,
              stop_after_tool_call: tool.stop_after_tool_call,
              created_at: tool.created_at,
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
            },
            status: tool.tool_call_error ? 'error' : 'completed',
          }));
        } else if (assistantMessage?.tool_calls) {
          toolCalls = assistantMessage.tool_calls.map((tc) => ({
            tool: {
              tool_call_id: tc.id,
              tool_name: tc.function.name,
              tool_args: JSON.parse(tc.function.arguments),
              tool_call_error: false,
              result: null,
              metrics: null,
              child_run_id: null,
              stop_after_tool_call: false,
              created_at: assistantMessage.created_at,
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
            },
            status: 'completed',
          }));
        }

        const memberRunsForThisRun = [];
        if (hasMemberRuns) {
          const children = memberRunsByParent.get(run.run_id) || [];
          children.forEach((childRun) => {
            const memberToolCalls = [];
            if (childRun.tools && childRun.tools.length > 0) {
              childRun.tools.forEach((tool) => {
                memberToolCalls.push({
                  tool: {
                    tool_call_id: tool.tool_call_id,
                    tool_name: tool.tool_name,
                    tool_args: tool.tool_args,
                    tool_call_error: tool.tool_call_error,
                    result: tool.result,
                    metrics: tool.metrics,
                    child_run_id: tool.child_run_id,
                    stop_after_tool_call: tool.stop_after_tool_call,
                    created_at: tool.created_at,
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
                  },
                  status: tool.tool_call_error ? 'error' : 'completed',
                });
              });
            }

            memberRunsForThisRun.push({
              run_id: childRun.run_id,
              agent_id: childRun.agent_id,
              agent_name: childRun.agent_id,
              reasoning_content: childRun.reasoning_content || '',
              content: childRun.content || '',
              tool_calls: memberToolCalls,
              status: 'completed',
              parent_run_id: run.run_id,
              metrics: {
                time_to_first_token: childRun.metrics?.time_to_first_token,
                duration: childRun.metrics?.duration,
                model: childRun.metrics?.details?.model?.[0]?.id,
                provider: childRun.metrics?.details?.model?.[0]?.provider,
              },
            });
          });
        }

        if (run.run_input) {
          const msgTime = run.messages?.[0]?.created_at || Date.now() / 1000;
          loadedMessages.push({
            id: uuid(),
            role: 'user',
            content: run.run_input,
            timestamp: msgTime * 1000,
          });
        }

        if (run.content || run.reasoning_content) {
          const msgTime =
            run.messages?.[run.messages.length - 1]?.created_at ||
            Date.now() / 1000;
          loadedMessages.push({
            id: uuid(),
            role: 'assistant',
            content: run.content || '',
            timestamp: msgTime * 1000,
            streamMessage: {
              run_id: run.run_id,
              session_id: targetSessionId,
              entity_type: entityType,
              entity_id: run.agent_id,
              entity_name: run.agent_id,
              reasoning_content: run.reasoning_content || '',
              content: run.content || '',
              tool_calls: toolCalls,
              member_runs: memberRunsForThisRun,
              status: 'completed',
              metrics: {
                time_to_first_token: run.metrics?.time_to_first_token,
                duration: run.metrics?.duration,
                model: run.metrics?.details?.model?.[0]?.id,
                provider: run.metrics?.details?.model?.[0]?.provider,
              },
            },
          });
        }
      });

      messages.value = loadedMessages;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load session';
      error.value = errorMessage;
    } finally {
      isStreaming.value = false;
    }
  }

  return {
    messages,
    currentRun,
    isStreaming,
    error,
    sendMessage,
    loadSession,
    clearMessages,
  };
}
