import { onUnmounted, ref } from '@vue/composition-api';
import { client } from '@/utils/client';

/**
 * Hook for common actions like initialization, fetching agents/teams
 */
export function useAgnoActions() {
  const isInitializing = ref(false);
  const error = ref();
  const config = ref(client.getConfig());
  const state = ref(client.getState());
  const agents = ref(state.value.agents || []);
  const teams = ref(state.value.teams || []);

  const handleStateChange = (newState) => {
    state.value = newState;
    agents.value = newState.agents || [];
    teams.value = newState.teams || [];
  };

  const handleConfigChange = (newConfig) => {
    config.value = { ...newConfig };
  };

  client.on('state:change', handleStateChange);
  client.on('config:change', handleConfigChange);

  onUnmounted(() => {
    client.off('state:change', handleStateChange);
    client.off('config:change', handleConfigChange);
  });

  /**
   * Initialize the client (check status and fetch agents/teams)
   */
  const initialize = async (options) => {
    isInitializing.value = true;
    error.value = undefined;
    try {
      const result = await client.initialize(options);
      state.value = client.getState();
      config.value = client.getConfig();
      agents.value = result.agents || [];
      teams.value = result.teams || [];
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      throw err;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * Check endpoint status
   */
  const checkStatus = async (options) => {
    error.value = undefined;
    try {
      return await client.checkStatus(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      return false;
    }
  };

  /**
   * Fetch agents
   */
  const fetchAgents = async (options) => {
    error.value = undefined;
    try {
      const fetchedAgents = await client.fetchAgents(options);
      agents.value = fetchedAgents;
      return fetchedAgents;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      throw err;
    }
  };

  /**
   * Fetch teams
   */
  const fetchTeams = async (options) => {
    error.value = undefined;
    try {
      const fetchedTeams = await client.fetchTeams(options);
      teams.value = fetchedTeams;
      return fetchedTeams;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      throw err;
    }
  };

  /**
   * Update client configuration
   */
  const updateConfig = (updates) => {
    client.updateConfig(updates);
    config.value = client.getConfig();
  };

  const setConfig = (updates = {}) => {
    updateConfig({
      ...config.value,
      ...updates,
    });
  };

  const setMode = (mode) => {
    const nextConfig = {
      ...config.value,
      mode,
    };

    if (mode === 'agent') {
      const firstAgent = agents.value?.[0];
      nextConfig.agentId = firstAgent?.id || '';
      nextConfig.dbId = firstAgent?.db_id || '';
    } else if (mode === 'team') {
      const firstTeam = teams.value?.[0];
      nextConfig.teamId = firstTeam?.id || '';
      nextConfig.dbId = firstTeam?.db_id || '';
    }

    updateConfig(nextConfig);
  };

  return {
    config,
    agents,
    teams,
    state,
    initialize,
    checkStatus,
    fetchAgents,
    fetchTeams,
    updateConfig,
    setConfig,
    setMode,
    isInitializing,
    error,
  };
}
