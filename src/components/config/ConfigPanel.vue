<template>
  <div class="config-panel-section">
    <div class="config-header">
      {{ $t('sidebar.modelConfig') }}
    </div>
    <div class="config-content">
      <div class="form-item">
        <label class="form-label">{{ $t('sidebar.mode') }}</label>
        <select
          :value="selectedEntityType"
          :disabled="busy"
          class="form-select ai-select"
          @change="handleEntityTypeChange"
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
          <option
            :disabled="!workflows.length"
            value="workflow"
          >
            WORKFLOW
          </option>
        </select>
      </div>

      <div class="form-item">
        <label class="form-label">{{ $t('sidebar.entity') }}</label>
        <select
          :value="selectedEntity?.id || ''"
          :disabled="busy"
          class="form-select ai-select"
          @change="handleEntityChange"
        >
          <option
            v-for="entity in entities"
            :key="entity.id"
            :value="entity.id"
          >
            {{ entity.id }}
          </option>
        </select>
      </div>

      <router-link
        to="/setup"
        class="config-link"
      >
        {{ $t('sidebar.serverSettings') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from '@vue/composition-api'
import { useAgentRun } from '@/hooks/agno/useAgentRun'
import { useConfig } from '@/hooks/agno/useConfig'
import { usePerfTrack } from '@/hooks/usePerfTrack'

usePerfTrack()
const { isStreaming, isLoadingSession } = useAgentRun()
const {
  agents, teams, workflows, selectedEntity, selectedEntityType,
  selectEntity, selectDefaultAgent, selectDefaultTeam, selectDefaultWorkflow,
} = useConfig()

const busy = computed(() => isStreaming.value || isLoadingSession.value)

const entities = computed(() => {
  if (selectedEntityType.value === 'team') {
    return teams.value
  }
  if (selectedEntityType.value === 'workflow') {
    return workflows.value
  }
  return agents.value
})

const handleEntityTypeChange = (event) => {
  const type = event.target.value
  if (type === 'agent') {
    selectDefaultAgent()
  } else if (type === 'team') {
    selectDefaultTeam()
  } else if (type === 'workflow') {
    selectDefaultWorkflow()
  }
}

const handleEntityChange = (event) => {
  const id = event.target.value
  const type = selectedEntityType.value
  const entity = entities.value.find((e) => e.id === id)
  selectEntity(type, id, entity?.name)
}
</script>

<style lang="less" scoped>
.config-panel-section {
  margin: 0 @spacing-md @spacing-md;
  border: 1px solid @border-color;
  border-radius: @border-radius-xl;
  background: @surface-color;
  overflow: hidden;

  .config-header {
    padding: @spacing-md;
    font-size: 14px;
    font-weight: 600;
    color: @text-color;
    background: @surface-muted;
    border-bottom: 1px solid @border-color;
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
      background-color: @surface-color;
    }
  }

  .config-link {
    display: block;
    margin-top: @spacing-md;
    padding-top: @spacing-sm;
    border-top: 1px solid @border-light;
    font-size: 12px;
    color: @text-secondary;
    text-align: center;
    transition: color @transition-fast;

    &:hover {
      color: @primary-color;
    }
  }
}
</style>
