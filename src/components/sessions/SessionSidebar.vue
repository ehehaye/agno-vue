<template>
  <div class="sessions-section">
    <div class="section-header">
      <h3 class="section-title">{{ $t('sidebar.historySessions') }}</h3>
      <div class="header-actions">
        <button
          type="button"
          class="tool-btn"
          @click="toggleSelectionMode"
        >
          {{ selectionMode ? $t('sidebar.cancel') : $t('sidebar.select') }}
        </button>
        <button
          type="button"
          class="add-btn ai-button"
          :aria-label="$t('sidebar.newSession')"
          @click="startNewSession"
        >
          +
        </button>
      </div>
    </div>

    <div
      v-if="selectionMode"
      class="bulk-actions"
    >
      <button
        type="button"
        class="tool-btn"
        @click="selectAllSessions"
      >
        {{ $t('sidebar.selectAll') }}
      </button>
      <button
        type="button"
        class="tool-btn tool-btn--danger"
        :disabled="selectedSessionIds.size === 0"
        @click="handleBulkDelete"
      >
        {{ $t('sidebar.deleteSelected') }} ({{ selectedSessionIds.size }})
      </button>
    </div>

    <div
      v-if="sessionsError"
      class="flex items-center justify-between gap-sm px-md py-xs text-xs text-danger"
      role="alert"
    >
      <span class="min-w-0 truncate">{{ $t('sidebar.loadFailed') }}: {{ sessionsError }}</span>
      <button
        type="button"
        class="flex-shrink-0 underline"
        @click="refreshSessions"
      >
        {{ $t('sidebar.retry') }}
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
          :class="{
            active: session.session_id === currentSessionId,
            selected: selectionMode && selectedSessionIds.has(session.session_id),
          }"
          tabindex="0"
          @click="handleSessionClick(session.session_id)"
          @keydown.enter.prevent="handleSessionClick(session.session_id)"
          @keydown.space.prevent="handleSessionClick(session.session_id)"
        >
          <span
            v-if="selectionMode"
            class="select-indicator"
            :class="{ checked: selectedSessionIds.has(session.session_id) }"
          />
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
            v-if="!selectionMode"
            type="button"
            class="delete-btn ai-button"
            :aria-label="$t('sidebar.deleteSession')"
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

    <div
      v-if="totalPages > 1"
      class="session-pager"
    >
      <button
        type="button"
        class="pager-btn"
        :disabled="page <= 1 || isLoading"
        :aria-label="$t('sidebar.prev')"
        @click="fetchSessions(page - 1)"
      >
        &lsaquo;
      </button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button
        type="button"
        class="pager-btn"
        :disabled="page >= totalPages || isLoading"
        :aria-label="$t('sidebar.next')"
        @click="fetchSessions(page + 1)"
      >
        &rsaquo;
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from '@vue/composition-api'
import { useSessionManager } from '@/hooks/agno/useSessionManager.js'
import { useAgentRun } from '@/hooks/agno/useAgentRun.js'
import { useConfig } from '@/hooks/agno/useConfig'
import { usePerfTrack } from '@/hooks/usePerfTrack.js'
import { truncateByWidth } from '@/utils'
import i18n from '@/lang'

usePerfTrack()
const { currentSessionId, setCurrentSessionId } = useConfig()
const { loadSession } = useAgentRun()
const {
  sessions,
  page,
  totalPages,
  isLoading,
  selectedSessionIds,
  deleteSelectedSessions,
  toggleSessionSelection,
  selectAllSessions,
  clearSelection,
  refreshSessions,
  fetchSessions,
  error: sessionsError,
} = useSessionManager()
const sessionItemHeight = 64
const selectionMode = ref(false)

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

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  clearSelection()
}

const startNewSession = () => {
  selectionMode.value = false
  clearSelection()
  setCurrentSessionId(null)
}

const handleLoadSession = (id) => {
  if (id !== currentSessionId.value) {
    setCurrentSessionId(id)
    loadSession(id)
  }
}

const handleSessionClick = (id) => {
  if (selectionMode.value) {
    toggleSessionSelection(id)
    return
  }
  handleLoadSession(id)
}

const handleDelete = async (id) => {
  if (!window.confirm(i18n.t('sidebar.deleteConfirm'))) {
    return
  }

  selectedSessionIds.value = new Set([id])
  await deleteSelectedSessions()
}

const handleBulkDelete = async () => {
  if (selectedSessionIds.value.size === 0) {
    return
  }
  if (!window.confirm(i18n.t('sidebar.deleteConfirm'))) {
    return
  }
  const deleted = await deleteSelectedSessions()
  if (deleted) {
    selectionMode.value = false
    clearSelection()
  }
}
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: @spacing-sm;
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

  .tool-btn {
    padding: 2px @spacing-sm;
    border: none;
    border-radius: @border-radius-sm;
    background: transparent;
    color: @text-secondary;
    font-size: 12px;
    cursor: pointer;
    transition:
      color @transition-fast,
      background-color @transition-fast,
      opacity @transition-fast;

    &:hover:not(:disabled) {
      color: @primary-color;
      background: fade(@primary-color, 8%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--danger {
      color: @error-color;

      &:hover:not(:disabled) {
        color: @error-color;
        background: fade(@error-color, 10%);
      }
    }
  }

  .bulk-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: @spacing-sm;
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

      &.active,
      &.selected {
        background: fade(@primary-color, 8%);
        border-color: @primary-color;
      }

      &.active {
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

      .select-indicator {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        margin-right: @spacing-sm;
        border: 1px solid @border-color;
        border-radius: 50%;
        background: @surface-color;
        transition:
          background-color @transition-fast,
          border-color @transition-fast;

        &.checked {
          border-color: @primary-color;
          background: @primary-color;
          box-shadow: inset 0 0 0 3px @surface-color;
        }
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

  .session-pager {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: @spacing-md;
    padding-top: @spacing-sm;
    font-size: 12px;
    color: @text-secondary;

    .pager-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid @border-color;
      border-radius: @border-radius-sm;
      background: @surface-color;
      color: @text-secondary;
      cursor: pointer;

      &:hover:not(:disabled) {
        border-color: @primary-color;
        color: @primary-color;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }
}
</style>
