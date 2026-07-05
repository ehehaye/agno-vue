import { ref, watch } from '@vue/composition-api'
import { useConfig } from './useConfig'
import events, { RuntimeEvents } from './events'

const sessions = ref([])
const page = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const isLoading = ref(false)
const error = ref(null)
const selectedSessionIds = ref(new Set())

export function useSessionManager() {
  const {
    serverUrl,
    connectionStatus,
    selectedEntity,
    currentSessionId,
    setCurrentSessionId,
  } = useConfig()

  events.on(RuntimeEvents.SESSION_CREATED, (session) => {
    sessions.value.unshift({
      ...session,
    })
    setCurrentSessionId(session.session_id)
    // TODO: handle pages
  })

  const resetState = () => {
    sessions.value = []
    page.value = 1
    totalPages.value = 1
    totalCount.value = 0
  }

  const fetchSessions = async (pageNum = 1) => {
    if (connectionStatus.value !== 'connected') {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      // Fetch sessions for each type
      const allSessions = []
      let maxTotalPages = 1
      let sumTotalCount = 0

      const params = new URLSearchParams({
        type: selectedEntity.value.type,
        component_id: selectedEntity.value.id,
        page: String(pageNum),
        limit: '20',
      })

      const response = await fetch(
        `${serverUrl.value}/sessions?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${selectedEntity.value.type} sessions: ${response.status}`
        )
      }

      const data = await response.json()

      // Add session_type to each session
      const sessionsWithType = data.data.map((s) => ({
        ...s,
        session_type: selectedEntity.value.type,
      }))
      allSessions.push(...sessionsWithType)

      maxTotalPages = Math.max(maxTotalPages, data.meta.total_pages)
      sumTotalCount += data.meta.total_count

      // Sort by updated_at descending (most recent first)
      allSessions.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )

      sessions.value = allSessions
      page.value = pageNum
      totalPages.value = maxTotalPages
      totalCount.value = sumTotalCount
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch sessions'
    } finally {
      isLoading.value = false
    }
  }

  const refreshSessions = async () => {
    await fetchSessions(page.value)
  }

  const deleteSelectedSessions = async () => {
    if (selectedSessionIds.value.size === 0) {
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const selectedSessions = sessions.value.filter((s) =>
        selectedSessionIds.value.has(s.session_id)
      )
      const session_ids = selectedSessions.map((s) => s.session_id)
      const session_types = selectedSessions.map((s) => s.session_type)

      const response = await fetch(`${serverUrl.value}/sessions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_ids,
          session_types,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete sessions: ${response.status}`)
      }

      // Clear selection and refresh list
      selectedSessionIds.value = new Set()
      if (session_ids.includes(currentSessionId.value)) {
        setCurrentSessionId(null)
      }
      await fetchSessions(page.value)
      return true
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete sessions'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const toggleSessionSelection = (sessionId) => {
    const next = new Set(selectedSessionIds.value)
    if (next.has(sessionId)) {
      next.delete(sessionId)
    } else {
      next.add(sessionId)
    }
    selectedSessionIds.value = next
  }

  const selectAllSessions = () => {
    selectedSessionIds.value = new Set(sessions.value.map((s) => s.session_id))
  }

  const clearSelection = () => {
    selectedSessionIds.value = new Set()
  }

  // Fetch sessions when connection status or entity type changes
  watch(
    [connectionStatus, selectedEntity],
    () => {
      if (connectionStatus.value === 'connected') {
        fetchSessions(1)
      } else {
        resetState()
      }
    },
    { immediate: true }
  )

  return {
    sessions,
    page,
    totalPages,
    totalCount,
    isLoading,
    error,
    selectedSessionIds,
    fetchSessions,
    deleteSelectedSessions,
    toggleSessionSelection,
    selectAllSessions,
    clearSelection,
    refreshSessions,
  }
}
