import { onUnmounted, ref } from '@vue/composition-api';
import { client } from '@/utils/client';

/**
 * Hook for session management
 */
export function useAgnoSession() {
  const sessions = ref([]);
  const currentSessionId = ref(client.getConfig().sessionId);
  const isLoading = ref(false);
  const error = ref();

  const runWithLoading = async (callback) => {
    isLoading.value = true;
    error.value = undefined;

    try {
      return await callback();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const handleSessionLoaded = (sessionId) => {
    currentSessionId.value = sessionId;
  };

  const handleSessionCreated = (session) => {
    sessions.value = [session, ...sessions.value];
    currentSessionId.value = session.session_id;
  };

  const handleStateChange = () => {
    const config = client.getConfig();
    currentSessionId.value = config.sessionId;
    sessions.value = client.getState().sessions;
  };

  client.on('session:loaded', handleSessionLoaded);
  client.on('session:created', handleSessionCreated);
  client.on('state:change', handleStateChange);

  sessions.value = client.getState().sessions;
  currentSessionId.value = client.getConfig().sessionId;

  onUnmounted(() => {
    client.off('session:loaded', handleSessionLoaded);
    client.off('session:created', handleSessionCreated);
    client.off('state:change', handleStateChange);
  });

  /**
   * Load a specific session
   */
  const loadSession = async (sessionId, options) =>
    runWithLoading(async () => {
      const messages = await client.loadSession(sessionId, options);
      currentSessionId.value = sessionId;
      return messages;
    });

  /**
   * Fetch all sessions
   */
  const fetchSessions = async (options) =>
    runWithLoading(async () => {
      const fetchedSessions = await client.fetchSessions(options);
      sessions.value = fetchedSessions;
      return fetchedSessions;
    });

  /**
   * Get a session by ID
   */
  const getSessionById = async (sessionId, options) =>
    runWithLoading(() => client.getSessionById(sessionId, options));

  /**
   * Get a run by ID
   */
  const getRunById = async (sessionId, runId, options) =>
    runWithLoading(() => client.getRunById(sessionId, runId, options));

  /**
   * Start a new local session
   */
  const newSession = async () =>
    runWithLoading(async () => {
      // TODO
      client.clearMessages();
      currentSessionId.value = client.getConfig().sessionId;
    });

  /**
   * Create a new session
   */
  const createSession = async (request, options) =>
    runWithLoading(() => client.createSession(request, options));

  /**
   * Update a session
   */
  const updateSession = async (sessionId, request, options) =>
    runWithLoading(() => client.updateSession(sessionId, request, options));

  /**
   * Rename a session
   */
  const renameSession = async (sessionId, newName, options) =>
    runWithLoading(() => client.renameSession(sessionId, newName, options));

  /**
   * Delete a session
   */
  const deleteSession = async (sessionId, options) =>
    runWithLoading(() => client.deleteSession(sessionId, options));

  /**
   * Delete multiple sessions
   */
  const deleteMultipleSessions = async (sessionIds, options) =>
    runWithLoading(() => client.deleteMultipleSessions(sessionIds, options));

  return {
    sessions,
    currentSessionId,
    loadSession,
    fetchSessions,
    getSessionById,
    getRunById,
    newSession,
    createSession,
    updateSession,
    renameSession,
    deleteSession,
    deleteMultipleSessions,
    isLoading,
    error,
  };
}
