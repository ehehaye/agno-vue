<template>
  <Layout
    v-if="initialized"
    v-loading="$agno.isLoading"
    element-loading-background="rgba(250, 250, 250, 0.4)"
  >
    <template #header>
      <h1>Ango-Vue</h1>
    </template>

    <template #aside>
      <div class="chat-sidebar">
        <SessionList />
        <ModelConfig />
      </div>
    </template>

    <template #main>
      <div class="dashboard">
        <AIChat />
      </div>
    </template>
  </Layout>
</template>

<script>
import { $agno } from '@/agno/store';
import Layout from '@/components/Layout/index.vue';
import AIChat from '@/components/AIChat/index.vue';
import SessionList from '@/components/SessionList/index.vue';
import ModelConfig from '@/components/ModelConfig/index.vue';

export default {
  name: 'Dashboard',
  components: {
    Layout,
    AIChat,
    SessionList,
    ModelConfig,
  },
  data() {
    return {
      initialized: false,
    }
  },
  async created() {
    await $agno.initialize();
    this.initialized = true;
  },
};
</script>

<style lang="less" scoped>
@import '/src/assets/styles/variables.less';

.dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-sidebar {
  height: calc(100vh - @header-height);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-right: 1px solid @border-color;
}
</style>
