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
      class="tw:flex tw:items-center tw:justify-between tw:gap-compact tw:px-base tw:py-tight tw:text-xs tw:text-danger"
      role="alert"
    >
      <span class="tw:min-w-0 tw:truncate">{{ $t('sidebar.loadFailed') }}: {{ sessionsError }}</span>
      <button
        type="button"
        class="tw:shrink-0 tw:underline"
        @click="refreshSessions"
      >
        {{ $t('sidebar.retry') }}
      </button>
    </div>

    <div
      v-if="isLoading && displayedSessions.length === 0"
      class="loading-state"
    >
      <StreamingIndicator />
    </div>
    <RecycleScroller
      v-else-if="displayedSessions.length"
      :items="displayedSessions"
      :item-size="sessionItemHeight"
      key-field="session_id"
      class="sessions-list"
    >
      <template #default="{ item: session }">
        <SessionListItem
          :session="session"
          :active="session.session_id === currentSessionId"
          :selection-mode="selectionMode"
          :selected="selectedSessionIds.has(session.session_id)"
          @select="handleSessionClick"
          @delete="handleDelete"
        />
      </template>
    </RecycleScroller>
    <div
      v-else-if="!sessionsError"
      class="empty-state"
    >
      <p>{{ $t('sidebar.noSessions') }}</p>
    </div>

    <SessionPager
      :page="page"
      :total-pages="totalPages"
      :is-loading="isLoading"
      @change="fetchSessions"
    />
  </div>
</template>

<script setup>
import { computed, ref } from '@vue/composition-api'
import SessionListItem from '@/components/sessions/SessionListItem.vue'
import SessionPager from '@/components/sessions/SessionPager.vue'
import { StreamingIndicator } from '@/components/ui'
import { useAgentRun } from '@/hooks/agno/useAgentRun.js'
import { useConfig } from '@/hooks/agno/useConfig'
import { usePerfTrack } from '@/hooks/usePerfTrack.js'
import { useSessionManager } from '@/hooks/agno/useSessionManager.js'
import { formatSessionName, formatSessionTime } from '@/utils/session'
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
  deleteSession,
  toggleSessionSelection,
  selectAllSessions,
  clearSelection,
  refreshSessions,
  fetchSessions,
  error: sessionsError,
} = useSessionManager()
const sessionItemHeight = 64
const selectionMode = ref(false)

const displayedSessions = computed(() =>
  sessions.value.map((session) => ({
    ...session,
    display_name: formatSessionName(session.session_name),
    display_time: formatSessionTime(session.created_at),
  }))
)

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
  await deleteSession(id)
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
  }

  .loading-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
