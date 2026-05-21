<template>
  <div class="model-config-section">
    <div class="config-header">
      {{ $t('sidebar.modelConfig') }}
    </div>
    <div class="config-content">
      <div class="form-item">
        <label class="form-label">{{ $t('sidebar.mode') }}</label>
        <select
          v-model="$agno.config.mode"
          :disabled="isStreaming"
          class="form-select"
          @change="$agno.setMode($event.target.value)"
        >
          <option
            :disabled="!$agno.agents.length"
            value="agent"
          >
            AGENT
          </option>
          <option
            :disabled="!$agno.teams.length"
            value="team"
          >
            TEAM
          </option>
        </select>
      </div>

      <div class="form-item">
        <label class="form-label">{{ $agno.config.mode === 'agent' ? 'AGENT' : 'TEAM' }}</label>
        <template v-if="$agno.config.mode === 'agent'">
          <select
            v-model="$agno.config.agentId"
            :disabled="isStreaming"
            class="form-select"
            @change="$agno.setConfig()"
          >
            <option
              v-for="agent in $agno.agents"
              :key="agent.id"
              :value="agent.id"
            >
              {{ agent.id }}
            </option>
          </select>
        </template>

        <template v-if="$agno.config.mode === 'team'">
          <select
            v-model="$agno.config.teamId"
            :disabled="isStreaming"
            class="form-select"
            @change="$agno.setConfig()"
          >
            <option
              v-for="team in $agno.teams"
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
export default {
  name: 'ModelConfig',
  computed: {
    isStreaming() {
      return this.$agno.isStreaming;
    },
  },
};
</script>

<style lang="less" scoped>
.model-config-section {
  border-top: 1px solid @border-color;
  background-color: #f8f9fa;

  .config-header {
    padding: @spacing-md;
    font-size: 14px;
    font-weight: 600;
    color: @text-color;
    background-color: #f8f9fa;
    border-bottom: 1px solid @border-color;
  }

  .config-content {
    padding: @spacing-sm @spacing-md;
  }

  .form-item {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    margin-bottom: @spacing-md;

    &:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-size: 14px;
      color: @text-color;
      margin-bottom: @spacing-sm;
      margin-right: @spacing-sm;
      width: 60px;
    }

    .form-select {
      width: 100%;
      padding: 8px;
      font-size: 14px;
      background-color: white;
    }
  }
}
</style>