<template>
  <AppLayout>
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
