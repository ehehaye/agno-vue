<template>
  <AppLayout>
    <template #aside>
      <div class="chat-sidebar">
        <SessionSidebar />
        <ConfigPanel />
      </div>
    </template>

    <template #main>
      <div class="dashboard">
        <ChatInterface />
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import ChatInterface from '@/components/chat/ChatInterface.vue'
import SessionSidebar from '@/components/sessions/SessionSidebar.vue'
import ConfigPanel from '@/components/config/ConfigPanel.vue'
</script>

<style lang="less" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: @surface-color;
}
</style>
