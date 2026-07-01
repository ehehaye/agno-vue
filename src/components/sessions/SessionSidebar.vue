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
        class="session-item"
        :class="{ active: session.session_id === currentSessionId }"
        @click="loadSession(session.session_id)"
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
    gap: @spacing-xs;
    overflow-y: auto;
    min-height: 0;

    .session-item {
      padding: @spacing-sm @spacing-md;
      border-radius: @border-radius-md;
      cursor: pointer;
      transition: all 0.3s;
      border: 1px solid transparent;
      display: flex;
      align-items: center;
      justify-content: space-between;

      &:hover {
        background-color: #e6f7ff;
      }

      &.active {
        background-color: #e6f7ff;
        border-color: @primary-color;
      }

      &:hover .delete-btn {
        opacity: 1;
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
        transition: opacity 0.3s;
        padding: 0;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border-color: transparent;
        background-color: transparent;
        color: @error-color;
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
