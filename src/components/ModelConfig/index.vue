<template>
  <div class="model-config-section">
    <el-collapse v-model="activeNames">
      <el-collapse-item
        title="Model Config"
        name="model-config"
      >
        <el-form
          :model="$agno.config"
          label-width="50px"
        >
          <el-form-item
            label="Mode"
          >
            <el-select
              v-model="$agno.config.mode"
              :disabled="isStreaming"
              @change="$agno.setMode($event)"
            >
              <el-option
                :disabled="!$agno.agents.length"
                label="AGENT"
                value="agent"
              />
              <el-option
                :disabled="!$agno.teams.length"
                label="TEAM"
                value="team"
              />
              <!-- Workflow is not supported yet -->
              <el-option
                :disabled="true"
                label="WORKFLOW"
                value="workflow"
              />
            </el-select>
          </el-form-item>

          <el-form-item
            label="Name"
          >
            <template v-if="$agno.config.mode === 'agent'">
              <el-select
                v-model="$agno.config.agentId"
                :disabled="isStreaming"
                @change="$agno.setConfig()"
              >
                <el-option
                  v-for="agent in $agno.agents"
                  :key="agent.id"
                  :label="agent.name || agent.id"
                  :value="agent.id"
                />
              </el-select>
            </template>
  
            <template v-if="$agno.config.mode === 'team'">
              <el-select
                v-model="$agno.config.teamId"
                :disabled="isStreaming"
                @change="$agno.setConfig()"
              >
                <el-option
                  v-for="team in $agno.teams"
                  :key="team.id"
                  :label="team.name || team.id"
                  :value="team.id"
                />
              </el-select>
            </template>

            <template v-if="$agno.config.mode === 'workflow'">
              <el-select
                v-model="$agno.config.workflowId"
                :disabled="isStreaming"
                @change="$agno.setConfig()"
              >
                <el-option
                  v-for="workflow in $agno.workflows"
                  :key="workflow.id"
                  :label="workflow.name || workflow.id"
                  :value="workflow.id"
                />
              </el-select>
            </template>
          </el-form-item>
        </el-form>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
export default {
  name: 'ModelConfig',
  data() {
    return {
      activeNames: ['model-config'],
    };
  },
  computed: {
    isStreaming() {
      return this.$agno.isStreaming;
    },
  },
};
</script>

<style lang="less" scoped>
@import '/src/assets/styles/variables.less';

.model-config-section {
  border-top: 1px solid @border-color;
  background-color: #f8f9fa;

  ::v-deep .el-collapse {
    border: none;

    .el-collapse-item__header {
      padding: @spacing-sm @spacing-md;
      font-size: 14px;
      font-weight: 600;
      color: @text-color;
      background-color: #f8f9fa;
      border-bottom: 1px solid @border-color;
    }

    .el-collapse-item__wrap {
      border-bottom: none;
      background-color: #f8f9fa;
    }

    .el-collapse-item__content {
      padding: @spacing-sm @spacing-md;
    }
  }
}
</style>