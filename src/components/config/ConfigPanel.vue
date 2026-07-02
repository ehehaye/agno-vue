<template>
  <div class="config-panel-section">
    <div class="config-header">
      {{ $t('sidebar.modelConfig') }}
    </div>
    <div class="config-content">
      <div class="form-item">
        <label class="form-label">{{ $t('sidebar.mode') }}</label>
        <select
          v-model="config.mode"
          :disabled="isStreaming"
          class="form-select"
          @change="setMode($event.target.value)"
        >
          <option
            :disabled="!agents.length"
            value="agent"
          >
            AGENT
          </option>
          <option
            :disabled="!teams.length"
            value="team"
          >
            TEAM
          </option>
        </select>
      </div>

      <div class="form-item">
        <label class="form-label">{{ config.mode === 'agent' ? 'AGENT' : 'TEAM' }}</label>
        <template v-if="config.mode === 'agent'">
          <select
            v-model="config.agentId"
            :disabled="isStreaming"
            class="form-select"
            @change="setConfig()"
          >
            <option
              v-for="agent in agents"
              :key="agent.id"
              :value="agent.id"
            >
              {{ agent.id }}
            </option>
          </select>
        </template>

        <template v-if="config.mode === 'team'">
          <select
            v-model="config.teamId"
            :disabled="isStreaming"
            class="form-select"
            @change="setConfig()"
          >
            <option
              v-for="team in teams"
              :key="team.id"
              :value="team.id"
            >
              {{ team.id }}
            </option>
          </select>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import { useAgnoActions } from '@/hooks/useAgnoActions';

export default defineComponent({
  name: 'ConfigPanel',
  setup() {
    const { config, agents, teams, isStreaming, setConfig, setMode } = useAgnoActions();

    return {
      config,
      agents,
      teams,
      isStreaming,
      setConfig,
      setMode,
    };
  },
});
</script>

<style lang="less" scoped>
.config-panel-section {
  margin: 0 @spacing-md @spacing-md;
  border: 1px solid fade(@border-color, 72%);
  border-radius: @border-radius-xl;
  background: fade(@surface-color, 74%);
  box-shadow: @shadow-sm;
  overflow: hidden;

  .config-header {
    padding: @spacing-md;
    font-size: 14px;
    font-weight: 600;
    color: @text-color;
    background:
      linear-gradient(135deg, fade(@primary-hover, 12%), fade(@surface-color, 86%));
    border-bottom: 1px solid fade(@border-color, 64%);
  }

  .config-content {
    padding: @spacing-md;
  }

  .form-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: @spacing-md;
    gap: @spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-size: 14px;
      color: @text-secondary;
      margin-bottom: 0;
      margin-right: 0;
      width: 60px;
      font-weight: 600;
    }

    .form-select {
      width: 100%;
      min-width: 0;
      padding: 9px 10px;
      font-size: 14px;
      background-color: fade(@surface-color, 90%);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.82);
    }
  }
}

</style>
