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

    <div v-if="connectionStatus === $c.ConnStatus.Connecting">
      <h2>Connection Connecting</h2>
    </div>

    <div v-if="error">
      <div class="init-error">
        <h2>Connection Error</h2>
        <p>{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted } from '@vue/composition-api'
import AppLayout from '@/components/layouts/AppLayout.vue'
import ChatInterface from '@/components/chat/ChatInterface.vue'
import SessionSidebar from '@/components/sessions/SessionSidebar.vue'
import ConfigPanel from '@/components/config/ConfigPanel.vue'
import { useConfig } from '@/hooks/agno/useConfig'

export default defineComponent({
  name: 'App',
  components: {
    AppLayout,
    ChatInterface,
    SessionSidebar,
    ConfigPanel,
  },
  setup() {
    const { error, connectionStatus, connect } = useConfig()

    onMounted(async () => {
      await connect()
    })

    return {
      error,
      connectionStatus,
    }
  },
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

  .init-loading,
  .init-error {
    margin: auto;
    max-width: 520px;
    padding: @spacing-xl;
    text-align: center;
    color: @text-color;
    background: fade(@surface-color, 88%);
    border: 1px solid fade(@border-color, 72%);
    border-radius: @border-radius-xl;
    box-shadow: @shadow-md;
    backdrop-filter: blur(18px);
  }

  .init-loading {
    position: relative;

    &::before {
      content: '';
      display: block;
      width: 36px;
      height: 36px;
      margin: 0 auto @spacing-md;
      border: 3px solid fade(@primary-color, 18%);
      border-top-color: @primary-color;
      border-radius: 50%;
      animation: spin 0.86s linear infinite;
    }
  }

  .init-error {
    h2 {
      margin-bottom: @spacing-md;
      color: @error-color;
    }

    p {
      margin-bottom: @spacing-lg;
      color: @text-secondary;
      word-break: break-word;
    }
  }
}

.chat-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(180deg, fade(@surface-color, 72%) 0%, fade(@surface-muted, 80%) 100%);
  border-right: 1px solid fade(@border-color, 66%);
}

</style>
