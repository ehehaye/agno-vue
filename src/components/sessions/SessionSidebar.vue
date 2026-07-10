<template>
  <div class="sessions-section">
    <div class="section-header">
      <h3 class="section-title">{{ $t('sidebar.historySessions') }}</h3>
      <button
        class="add-btn ai-button"
        @click="setCurrentSessionId(null)"
      >
        +
      </button>
    </div>
    <RecycleScroller
      v-if="displayedSessions.length"
      :items="displayedSessions"
      :item-size="sessionItemHeight"
      key-field="session_id"
      class="sessions-list"
    >
      <template #default="{ item: session }">
        <div
          class="session-item"
          :class="{ active: session.session_id === currentSessionId }"
          tabindex="0"
          @click="handleLoadSession(session.session_id)"
          @keydown.enter.prevent="handleLoadSession(session.session_id)"
          @keydown.space.prevent="handleLoadSession(session.session_id)"
        >
          <div class="session-content">
            <div
              class="session-title"
              :title="session.session_name"
            >
              {{ truncateByWidth(session.session_name, 200) }}
            </div>
            <div class="session-time">{{ formatTime(session.created_at) }}</div>
          </div>
          <button
            class="delete-btn ai-button"
            @click.stop="handleDelete(session.session_id)"
          >
            x
          </button>
        </div>
      </template>
    </RecycleScroller>
    <div
      v-else
      class="empty-state"
    >
      <p>{{ $t('sidebar.noSessions') }}</p>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api'
import { useSessionManager } from '@/hooks/agno/useSessionManager.js'
import { useAgentRun } from '@/hooks/agno/useAgentRun.js'
import { useConfig } from '@/hooks/agno/useConfig'
import { usePerfTrack } from '@/hooks/usePerfTrack.js'
import { truncateByWidth } from '@/utils'

export default defineComponent({
  name: 'SessionSidebar',
  setup(_, { root }) {
    usePerfTrack()
    const { currentSessionId, setCurrentSessionId } = useConfig()
    const { loadSession } = useAgentRun()
    const { sessions, selectedSessionIds, deleteSelectedSessions } = useSessionManager()
    const sessionItemHeight = 64

    const formatTime = (time) => new Date(time).toLocaleString()
    const formatSessionName = (name) => {
      if (typeof name !== 'string') {
        return name || ''
      }

      // Name is a JSON string during session creation
      if (name.includes('input_content')) {
        try {
          return JSON.parse(name).input_content
        } catch {
          return name
        }
      }
      return name
    }

    const displayedSessions = computed(() => sessions.value.map(session => ({
      ...session,
      session_name: formatSessionName(session.session_name),
    })))

    const handleLoadSession = (id) => {
      setCurrentSessionId(id)
      loadSession(id)
    }

    const handleDelete = async (id) => {
      if (!window.confirm(root.$t('sidebar.deleteConfirm'))) {
        return
      }

      // TODO: handle multiple selection
      selectedSessionIds.value = new Set([id])
      await deleteSelectedSessions()
    }

    return {
      displayedSessions,
      currentSessionId,
      sessionItemHeight,
      setCurrentSessionId,
      handleLoadSession,
      formatTime,
      formatSessionName,
      handleDelete,
      truncateByWidth,
    }
  },
})
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
    padding-top: 2px;
    min-height: 0;

    .session-item {
      position: relative;
      box-sizing: border-box;
      height: calc(100% - @spacing-xs);
      margin-bottom: @spacing-xs;
      padding: 10px 12px;
      border-radius: @border-radius-md;
      cursor: pointer;
      transition:
        transform @transition-fast,
        background-color @transition-base,
        border-color @transition-fast;
      border: 1px solid @border-color;
      background-color: @surface-color;
      display: flex;
      align-items: center;
      justify-content: space-between;
      outline: none;

      &:hover {
        background-color: @surface-hover;
        border-color: @primary-color;
      }

      &.active {
        background: fade(@primary-color, 8%);
        border-color: @primary-color;
        border-left-width: 3px;
        border-left-color: @primary-color;
      }

      &:focus-visible {
        border-color: @primary-color;
        outline: 2px solid rgba(63, 126, 232, 0.2);
        outline-offset: -1px;
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
        .ellipsis();
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
          color @transition-fast;
        padding: 0;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border-color: transparent;
        background: fade(@error-color, 10%);
        color: @error-color;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: @error-color;
          color: #fff;
        }

        &:active {
          transform: scale(0.94);
        }

        &:focus-visible {
          opacity: 1;
          transform: scale(1);
          outline: 2px solid fade(@error-color, 30%);
          outline-offset: 2px;
        }
      }
    }

    .empty-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: lighten(@text-color, 20%);
      font-size: 14px;
    }
  }
}
</style>
