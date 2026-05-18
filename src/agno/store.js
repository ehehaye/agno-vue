import Vue from 'vue';
import { client } from '@/agno/client';

const AGENT_MODE = 'agent';
const TEAM_MODE = 'team';
const DEFAULT_PAGE = '1';
const DEFAULT_LIMIT = '9999';

export const $agno = new Vue({
  data() {
    return {
      config: {
        endpoint: '',
        mode: AGENT_MODE,
        agentId: '',
        teamId: '',
        dbId: '',
      },
      agents: [],
      teams: [],
      sessions: [],
      sessionId: '',
      messages: [],
      isStreaming: false,
      isLoading: false,
    };
  },
  methods: {
    setConfig(config = {}) {
      Object.assign(this.config, config);
      client.updateConfig({
        ...this.config,
      });
    },
    setMode(mode) {
      this.config.mode = mode;
      if (mode === AGENT_MODE) {
        const firstAgent = this.agents?.[0];
        this.config.agentId = firstAgent?.id || '';
        this.config.dbId = firstAgent?.db_id || '';
      } else if (mode === TEAM_MODE) {
        const firstTeam = this.teams?.[0];
        this.config.teamId = firstTeam?.id || '';
        this.config.dbId = firstTeam?.db_id || '';
      }
      client.updateConfig({
        ...this.config,
        mode,
      });
    },
    setSessionConfig() {
      try {
        const { sessions, isStreaming } = client.getState();
        const config = client.getConfig();
        this.sessionId = config.sessionId;
        this.sessions = sessions;
        this.isStreaming = isStreaming;
        this.messages = client.getMessages();
      } catch (error) {
        console.error('Error in setSessionConfig:', error);
        this.sessions = [];
        this.messages = [];
      }
    },
    async initialize() {
      this.isLoading = true;
      try {
        const { agents = [], teams = [] } = (await client.initialize()) || {};

        client.on('message:update', (messages) => {
          this.messages = messages;
        });

        client.on('message:complete', (messages) => {
          this.messages = messages;
        });

        client.on('stream:start', () => {
          this.isStreaming = true;
        });

        client.on('stream:end', () => {
          this.isStreaming = false;
        });

        client.on('state:change', () => {
          this.setSessionConfig();
        });

        const config = client.getConfig();
        this.config = { ...config };
        this.agents = agents;
        this.teams = teams;
        this.setSessionConfig();

        try {
          this.sessions = await client.fetchSessions({
            params: {
              page: DEFAULT_PAGE,
              limit: DEFAULT_LIMIT,
            },
          });
        } catch (error) {
          console.error('Error fetching sessions:', error);
          this.sessions = [];
        }
      } catch (error) {
        console.error('Error initialize client client:', error);
        this.agents = [];
        this.teams = [];
        this.sessions = [];
      } finally {
        this.isLoading = false;
      }
    },
    async sendMessage(message = '') {
      if (!message || typeof message !== 'string' || !message.trim()) {
        console.warn('sendMessage: invalid message provided');
        return;
      }
      try {
        await client.sendMessage(message.trim());
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    async cancelRun() {
      if (!this.isStreaming) {
        return;
      }
      try {
        await client.cancelRun();
      } catch (error) {
        console.error('Error canceling run:', error);
      }
    },
    async newSession() {
      if (this.isStreaming) {
        await this.cancelRun();
      }
      client.clearMessages();
      this.setSessionConfig();
    },
    async deleteSession(sessionId) {
      if (!sessionId) {
        console.warn('deleteSession: sessionId is required');
        return;
      }
      try {
        await client.deleteSession(sessionId);
        this.setSessionConfig();
      } catch (error) {
        console.error('Error deleting session:', error);
        throw error;
      }
    },
    async loadSession(sessionId) {
      if (!sessionId) {
        console.warn('loadSession: sessionId is required');
        return;
      }
      try {
        await client.loadSession(sessionId);
        this.setSessionConfig();
      } catch (error) {
        console.error('Error loading session:', error);
        throw error;
      }
    },
  },
});

Vue.prototype.$agno = $agno;
