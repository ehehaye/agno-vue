import { computed, onUnmounted, ref } from '@vue/composition-api';
import { client } from '@/utils/client';

/**
 * Main hook for chat interactions
 * Provides messages, state, and methods to interact with the agent
 */
export function useAgnoChat() {
  const messages = ref(client.getMessages());
  const state = ref(client.getState());

  const handleMessageUpdate = (updatedMessages) => {
    messages.value = updatedMessages;
  };

  const handleMessageComplete = (updatedMessages) => {
    messages.value = updatedMessages;
  };

  const handleMessageRefreshed = (updatedMessages) => {
    messages.value = updatedMessages;
  };

  const handleStateChange = (newState) => {
    state.value = newState;
  };

  // Handle UI render event from frontend tool execution
  const handleUIRender = (event = {}) => {
    const { tools = [] } = event;

    // Update each tool call with its UI component
    for (const tool of tools) {
      if (tool.ui_component) {
        client.hydrateToolCallUI(tool.tool_call_id, tool.ui_component);
      }
    }
  };

  // Handle run cancelled event
  const handleRunCancelled = () => {
    // State is already updated via state:change event.
  };

  client.on('message:update', handleMessageUpdate);
  client.on('message:complete', handleMessageComplete);
  client.on('message:refreshed', handleMessageRefreshed);
  client.on('state:change', handleStateChange);
  client.on('ui:render', handleUIRender);
  client.on('run:cancelled', handleRunCancelled);

  messages.value = client.getMessages();
  state.value = client.getState();

  onUnmounted(() => {
    client.off('message:update', handleMessageUpdate);
    client.off('message:complete', handleMessageComplete);
    client.off('message:refreshed', handleMessageRefreshed);
    client.off('state:change', handleStateChange);
    client.off('ui:render', handleUIRender);
    client.off('run:cancelled', handleRunCancelled);
  });

  /**
   * Send a message to the agent/team
   */
  const sendMessage = async (message, options) => {
    await client.sendMessage(message, options);
  };

  /**
   * Clear all messages
   */
  const clearMessages = () => {
    client.clearMessages();
    messages.value = [];
  };

  /**
   * Cancel the current run
   */
  const cancelRun = async () => {
    await client.cancelRun();
  };

  return {
    messages,
    sendMessage,
    clearMessages,
    cancelRun,
    isStreaming: computed(() => state.value.isStreaming),
    isRefreshing: computed(() => state.value.isRefreshing),
    isPaused: computed(() => state.value.isPaused),
    isCancelling: computed(() => state.value.isCancelling),
    currentRunId: computed(() => state.value.currentRunId),
    error: computed(() => state.value.errorMessage),
    state,
  };
}
