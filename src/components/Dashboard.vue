<template>
  <Layout>
    <template #header>
      <h1>Ango-Vue</h1> 
    </template>
    
    <template #aside>
      <Sidebar />
    </template>

    <template #main>
      <div class="dashboard">
        <AIChat />
      </div>
    </template>
  </Layout>
</template>

<script>
import Layout from '@/components/Layout/index.vue';
import AIChat from '@/components/AIChat/index.vue';
import Sidebar from '@/components/Sidebar/index.vue';

export default {
  name: 'Dashboard',
  components: {
    Layout,
    AIChat,
    Sidebar,
  },
};
</script>

<style lang="less" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
