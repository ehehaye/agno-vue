<template>
  <Layout>
    <template #header>
      <h1>Agno-Vue</h1>
    </template>
    
    <template #aside>
      <Sidebar v-if="done" />
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
        <AIChat v-else />
      </div>
    </template>
  </Layout>
</template>

<script>
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import { useAgnoActions } from '@/hooks/useAgnoActions';
import Layout from '@/components/Layout/index.vue';
import AIChat from '@/components/AIChat/index.vue';
import Sidebar from '@/components/Sidebar/index.vue';

export default defineComponent({
  name: 'Dashboard',
  components: {
    Layout,
    AIChat,
    Sidebar,
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
</style>
