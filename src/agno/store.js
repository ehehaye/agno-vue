import Vue from 'vue';
import { client } from '@/agno/client';
import { Config } from '@/agno/config';
import { Message } from 'element-ui';
import { debounce, retryWithInterval, confirm, pick } from '@/utils/index';

export const $agno = new Vue({
  data() {
    return {
      config: {
        endpoint: Config.endpoint,
        mode: Config.mode,
        agentId: Config.agentId,
        teamId: Config.teamId,
        workflowId: Config.workflowId,
        dbId: Config.dbId,
        background: Config.background,
        headers: Config.headers,
      },
      agents: [],
      teams: [],
      workflows: [],
      sessions: [],
      sessionId: '',
      messages: [],
      isLoading: false,
      isStreaming: false,
      isPaused: false,
      currentRunId: null,
    };
  },
  computed: {
    allowSwitchContext() {
      if (this.isStreaming) {
        // Running task without background cannot be disconnected
        if (!this.config.background) return false;
        // Running task with background does not initialize yet
        if (!this.sessionId) return false;
      }
      return true;
    },
    disabledSwitchContext() {
      return !this.allowSwitchContext;
    },
  },
  created() {
    this.loadSessions = debounce(this.loadSessions, 200);
  },
  beforeDestroy() {
    client.removeAllListeners();
  },
  methods: {
    setConfig(config = {}) {
      client.updateConfig({
        ...this.config,
        ...config,
      });
    },
    setMode(mode) {
      client.setMode(mode);
    },
    setSessionConfig() {
      const { sessions, isStreaming } = client.getState();
      const config = client.getConfig();
      this.sessionId = config.sessionId;
      this.sessions = sessions;
      this.isStreaming = isStreaming;
      this.messages = client.getMessages();
    },
    async initialize() {
      client.on('message:error', (error) => {
        console.error('Error in message:', error);
        Message.error(error);
      });

      client.on('session:created', ({ session_id }) => {
        this.setSessionConfig();
        this.sessionId = session_id;
      });

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

      // TODO: custom:events


      client.on('state:change', () => {
        const { agents, teams, workflows, isPaused, currentRunId } =
          client.getState();
        Object.assign(this, {
          agents,
          teams,
          workflows,
          isPaused,
          currentRunId,
        });
        this.setSessionConfig();
      });

      client.on('config:change', () => {
        const config = client.getConfig();
        this.config = pick(config, Object.keys(this.config));
        this.loadSessions();
      });

      try {
        this.isLoading = true;
        await client.initialize();
      } finally {
        this.isLoading = false;
      }
    },
    async sendMessage(message = '') {
      await client.sendMessage(message);
    },
    async cancelRun() {
      if (!this.isStreaming) {
        return;
      }

      if (this.currentRunId) {
        await client.cancelRun();
        return;
      }

      // Wait for run ID to be available
      if (!this.currentRunId) {
        try {
          await retryWithInterval(100, 30, () => !!this.currentRunId);
          await client.cancelRun();
        } catch (error) {
          // TODO
          console.error('Error waiting for run ID:', error);
        }
      }
    },
    async leaveCurrentSession() {
      if (!this.sessionId) return;
      if (!this.isStreaming) return;
      if (this.config.background) return;
      await confirm(
        'Current running task will be canceled. Are you sure you want to continue?'
      );
      await this.cancelRun();
    },
    async newSession() {
      await this.leaveCurrentSession();
      // TODO: abort
      client.clearMessages();
      this.setSessionConfig();
      // TODO: constant event name
      this.$emit('new-session');
    },
    async deleteSession(sessionId) {
      if (!sessionId) {
        console.warn('deleteSession: sessionId is required');
        return;
      }
      try {
        this.isLoading = true;
        await client.deleteSession(sessionId);
        this.setSessionConfig();
      } catch (error) {
        console.error('Error deleting session:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async loadSessions() {
      try {
        this.isLoading = true;
        await client.fetchSessions({
          params: {
            page: 1,
            limit: 9999,
          },
        });
        this.setSessionConfig();
      } finally {
        this.isLoading = false;
      }
    },
    async loadSession(sessionId) {
      if (!sessionId) {
        console.warn('loadSession: sessionId is required');
        return;
      }
      try {
        this.isLoading = true;
        await client.loadSession(sessionId);
        this.setSessionConfig();
      } catch (error) {
        console.error('Error loading session:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

$agno.client = client;
Vue.prototype.$agno = $agno;

if (import.meta.env.DEV) {
  window.$agno = $agno;
}
