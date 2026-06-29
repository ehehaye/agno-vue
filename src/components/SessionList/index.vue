<template>
  <div class="sessions-section">
    <div class="section-header">
      <h3 class="section-title">Chat History</h3>
      <el-button
        type="primary"
        size="small"
        circle
        class="add-btn"
        icon="el-icon-plus"
        :disabled="$agno.disabledSwitchContext"
        title="New Chat"
        @click="$agno.newSession()"
      />
    </div>
    <div class="sessions-list">
      <div
        v-for="(session) in $agno.sessions"
        :key="session.session_id"
        class="session-item"
        :class="{ active: session.session_id === $agno.sessionId }"
        @click="$agno.loadSession(session.session_id)"
      >
        <div class="session-content">
          <div class="session-title">{{ formatName(session.session_name) }}</div>
          <div class="session-time">{{ formatTime(session.created_at) }}</div>
        </div>
        <el-button
          class="delete-btn"
          size="small"
          icon="el-icon-delete"
          @click.stop="handleDelete(session.session_id)"
        />
      </div>
      <div
        v-if="!$agno.sessions.length"
        class="empty-state"
      >
        <p>No chat history available.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { confirm } from '@/utils/index';

export default {
  name: 'SessionList',
  methods: {
    formatName(name) {
      // Name is a JSON string during session creation
      if (name.includes('input_content')) {
        try {
          return JSON.parse(name).input_content
        } catch {
          return name
        }
      }
      return name
    },
    formatTime(time) {
      return new Date(time).toLocaleString();
    },
    async handleDelete(sessionId) {
      await confirm('Are you sure you want to delete this session?');
      await this.$agno.deleteSession(sessionId);
    }
  },
};
</script>

<style lang="less" scoped>
@import '/src/assets/styles/variables.less';

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