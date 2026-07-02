<template>
  <div class="sessions-section">
    <div class="section-header">
      <h3 class="section-title">{{ $t('sidebar.historySessions') }}</h3>
      <button
        class="add-btn"
        @click="newSession"
      >
        +
      </button>
    </div>
    <div class="sessions-list">
      <div
        v-for="(session) in sessions"
        :key="session.session_id"
        class="session-item hover-lift"
        :class="{ active: session.session_id === currentSessionId }"
        tabindex="0"
        @click="loadSession(session.session_id)"
        @keydown.enter.prevent="loadSession(session.session_id)"
        @keydown.space.prevent="loadSession(session.session_id)"
      >
        <div class="session-content">
          <div class="session-title">{{ session.session_name }}</div>
          <div class="session-time">{{ formatTime(session.created_at) }}</div>
        </div>
        <button
          class="delete-btn"
          @click.stop="handleDelete(session.session_id)"
        >
          x
        </button>
      </div>
      <div
        v-if="!sessions.length"
        class="empty-state"
      >
        <p>{{ $t('sidebar.noSessions') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, watch } from '@vue/composition-api';
import { useAgnoSession } from '@/hooks/useAgnoSession';
import { useAgnoActions } from '@/hooks/useAgnoActions';

export default defineComponent({
  name: 'SessionSidebar',
  setup(_, { root }) {
    const { config } = useAgnoActions();
    const { sessions, currentSessionId, fetchSessions, loadSession, newSession, deleteSession } = useAgnoSession();

    const formatTime = (time) => new Date(time).toLocaleString();
    const formatSessionName = (name) => {
      // Name is a JSON string during session creation
      if (name.includes('input_content')) {
        try {
          return JSON.parse(name).input_content
        } catch {
          return name
        }
      }
      return name
    };

    const handleDelete = async (sessionId) => {
      if (!window.confirm(root.$t('sidebar.deleteConfirm'))) {
        return;
      }

      await deleteSession(sessionId);
    };

    watch(
      config,
      fetchSessions,
      { immediate: true }
    );

    return {
      sessions,
      currentSessionId,
      loadSession,
      newSession,
      formatTime,
      formatSessionName,
      handleDelete,
    };
  },
});
</script>

<style lang="less" scoped>
.sessions-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: @spacing-md;
  padding-top: 12px;
  min-height: 0;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: @spacing-md;
    flex-shrink: 0;

    .section-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: @text-color;
    }

    .add-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .sessions-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-top: 2px;
    gap: @spacing-xs;
    overflow-y: auto;
    min-height: 0;

    .session-item {
      position: relative;
      padding: 10px 12px;
      border-radius: @border-radius-md;
      cursor: pointer;
      transition:
        transform @transition-fast,
        background-color @transition-base,
        border-color @transition-fast,
        box-shadow @transition-base;
      border: 1px solid fade(@border-color, 68%);
      background-color: fade(@surface-color, 58%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      outline: none;

      &:hover {
        background-color: @surface-hover;
        border-color: fade(@primary-color, 32%);
        box-shadow: 0 10px 24px rgba(63, 126, 232, 0.12);
      }

      &.active {
        background: linear-gradient(135deg, fade(@primary-color, 14%), fade(@primary-hover, 8%));
        border-color: fade(@primary-color, 58%);
        box-shadow: inset 3px 0 0 @primary-color, 0 8px 20px rgba(63, 126, 232, 0.12);
      }

      &:focus-visible {
        border-color: fade(@primary-color, 70%);
        box-shadow: @focus-shadow, 0 10px 24px rgba(63, 126, 232, 0.12);
      }

      &:hover .delete-btn,
      &:focus-within .delete-btn {
        opacity: 1;
        transform: scale(1);
      }

      .session-content {
        flex: 1;
        overflow: hidden;
        margin-right: @spacing-sm;
      }

      .session-title {
        font-size: 14px;
        font-weight: 500;
        color: @text-color;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .session-time {
        font-size: 12px;
        color: lighten(@text-color, 20%);
      }

      .delete-btn {
        opacity: 0;
        transform: scale(0.86);
        transition:
          opacity @transition-fast,
          transform @transition-fast,
          background-color @transition-fast,
          color @transition-fast,
          box-shadow @transition-base;
        padding: 0;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border-color: transparent;
        background: fade(@error-color, 10%);
        color: @error-color;
        box-shadow: none;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: @error-color;
          color: #fff;
          box-shadow: 0 8px 18px fade(@error-color, 28%);
        }

        &:active {
          transform: scale(0.94);
          box-shadow: none;
        }

        &:focus-visible {
          opacity: 1;
          transform: scale(1);
          box-shadow: 0 0 0 4px fade(@error-color, 18%);
        }
      }
    }

    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: lighten(@text-color, 20%);
      font-size: 14px;
    }
  }
}
</style>
