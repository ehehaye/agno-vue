<template>
  <AppLayout>
    <template #header>
      <h1>Agno-Vue</h1>
    </template>

    <template #aside>
      <div
        v-if="done"
        class="chat-sidebar"
      >
        <SessionSidebar />
        <ConfigPanel />
      </div>
    </template>

    <template #main>
      <div class="dashboard">
        <div
          v-if="error"
          class="init-error"
        >
          <h2>{{ $t('app.initFailed') }}</h2>
          <p>{{ error }}</p>
          <button
            :disabled="isInitializing"
            @click="initializeApp"
          >
            {{ $t('app.retry') }}
          </button>
        </div>
        <div
          v-else-if="isInitializing"
          class="init-loading"
        >
          {{ $t('app.initializing') }}
        </div>
        <ChatInterface v-else />
      </div>
    </template>
  </AppLayout>
</template>

<script>
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import { useAgnoActions } from '@/hooks/useAgnoActions';
import AppLayout from '@/components/layouts/AppLayout.vue';
import ChatInterface from '@/components/chat/ChatInterface.vue';
import SessionSidebar from '@/components/sessions/SessionSidebar.vue';
import ConfigPanel from '@/components/config/ConfigPanel.vue';

export default defineComponent({
  name: 'App',
  components: {
    AppLayout,
    ChatInterface,
    SessionSidebar,
    ConfigPanel,
  },
  setup() {
    const done = ref(false);
    const { error, initialize, isInitializing } = useAgnoActions();

    const initializeApp = async () => {
      done.value = false;
      try {
        await initialize();
        done.value = true;
      } catch {
        done.value = false;
      }
    };

    onMounted(async () => {
      await initializeApp();
    });

    return {
      done,
      error,
      initializeApp,
      isInitializing,
    };
  },
});
</script>

<style lang="less" scoped>
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
  height: calc(100vh - @header-height);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-right: 1px solid @border-color;
}
</style>
