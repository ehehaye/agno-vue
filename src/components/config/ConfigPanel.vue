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
          :disabled="isStreaming"
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
        </select>
      </div>

      <div class="form-item">
        <label class="form-label">{{ $t('sidebar.agent') }}</label>
        <select
          :value="selectedEntity?.id || ''"
          :disabled="isStreaming"
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
    </div>
  </div>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api'
import { useAgentRun } from '@/hooks/agno/useAgentRun'  
import { useConfig } from '@/hooks/agno/useConfig'
import { usePerfTrack } from '@/hooks/usePerfTrack'

export default defineComponent({
  name: 'ConfigPanel',
  setup() {
    usePerfTrack()
    const { isStreaming } = useAgentRun()
    const {
      agents, teams, selectedEntity, selectedEntityType,
      selectEntity, selectDefaultAgent, selectDefaultTeam,
    } = useConfig()

    const entities = computed(() =>
      selectedEntityType.value === 'team' ? teams.value : agents.value
    )

    const handleEntityTypeChange = (event) => {
      const type = event.target.value
      if (type === 'agent') {
        selectDefaultAgent()
      } else if (type === 'team') {
        selectDefaultTeam()
      }
    }

    const handleEntityChange = (event) => {
      const id = event.target.value
      const type = selectedEntityType.value
      const entity = entities.value.find((e) => e.id === id)
      selectEntity(type, id, entity?.name)
    }

    return {
      agents,
      teams,
      entities,
      isStreaming,
      selectedEntity,
      selectedEntityType,
      handleEntityTypeChange,
      handleEntityChange,
    }
  },
})
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
}
</style>
