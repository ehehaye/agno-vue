<template>
  <div class="app">
    <AppLayout v-if="connectionStatus === $c.ConnStatus.Connected">
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

    <div
      v-if="connectionStatus === $c.ConnStatus.Connecting"
      class="flex h-full items-center justify-center"
    >
      <div class="flex flex-col items-center gap-md rounded-xl border border-line bg-surface px-xl py-xl text-center">
        <StreamingIndicator />
        <p class="text-sm text-ink-muted">{{ $t('app.initializing') }}</p>
      </div>
    </div>

    <div
      v-else-if="connectionStatus !== $c.ConnStatus.Connected && error"
      class="flex h-full items-center justify-center"
    >
      <div class="mx-md flex max-w-md flex-col items-center gap-md rounded-xl border border-line bg-surface px-xl py-xl text-center">
        <h2 class="text-lg font-semibold text-danger">{{ $t('app.initFailed') }}</h2>
        <p class="break-words text-sm text-ink-muted">{{ error }}</p>
        <button
          type="button"
          class="ai-button"
          @click="connect"
        >
          {{ $t('app.retry') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from '@vue/composition-api'
import AppLayout from '@/components/layouts/AppLayout.vue'
import ChatInterface from '@/components/chat/ChatInterface.vue'
import SessionSidebar from '@/components/sessions/SessionSidebar.vue'
import ConfigPanel from '@/components/config/ConfigPanel.vue'
import { StreamingIndicator } from '@/components/common'
import { useConfig } from '@/hooks/agno/useConfig'

const { error, connectionStatus, connect } = useConfig()

onMounted(async () => {
  await connect()
})
</script>

<style lang="less" scoped>
.app {
  height: 100%;
}

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
