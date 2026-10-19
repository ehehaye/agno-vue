import { ref, watch } from '@vue/composition-api'
import { useConfig } from './useConfig'
import events, { RuntimeEvents } from './events'
import { $c } from '@/constants'

const sessions = ref([])
const page = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const isLoading = ref(false)
const error = ref(null)
const selectedSessionIds = ref(new Set())
let sessionsRequestToken = 0
let sessionsController = null

const {
  serverUrl,
  connectionStatus,
  selectedEntity,
  currentSessionId,
  setCurrentSessionId,
} = useConfig()

function resetState() {
  sessionsRequestToken += 1
  sessionsController?.abort()
  sessionsController = null
  sessions.value = []
  page.value = 1
  totalPages.value = 1
  totalCount.value = 0
}

async function fetchSessions(pageNum = 1) {
  if (connectionStatus.value !== $c.ConnStatus.Connected || !selectedEntity.value) {
    return
  }

  sessionsRequestToken += 1
  const token = sessionsRequestToken
  sessionsController?.abort()
  const controller = new AbortController()
  sessionsController = controller

  isLoading.value = true
  error.value = null

  try {
    const params = new URLSearchParams({
      type: selectedEntity.value.type,
      component_id: selectedEntity.value.id,
      page: String(pageNum),
      limit: '20',
    })

    const response = await fetch(
      `${serverUrl.value}/sessions?${params.toString()}`,
      { signal: controller.signal }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${selectedEntity.value.type} sessions: ${response.status}`
      )
    }

    const data = await response.json()

    if (token !== sessionsRequestToken) {
      return
    }

    const sessionsWithType = (data.data || [])
      .map((session) => ({
        ...session,
        session_type: selectedEntity.value.type,
      }))
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )

    sessions.value = sessionsWithType
    page.value = pageNum
    totalPages.value = Math.max(1, data.meta?.total_pages || 1)
    totalCount.value = data.meta?.total_count || sessionsWithType.length
  } catch (err) {
    if (token !== sessionsRequestToken || err?.name === 'AbortError') {
      return
    }
    error.value = err instanceof Error ? err.message : 'Failed to fetch sessions'
  } finally {
    if (token === sessionsRequestToken) {
      isLoading.value = false
      if (sessionsController === controller) {
        sessionsController = null
      }
    }
  }
}

async function refreshSessions() {
  await fetchSessions(page.value)
}

async function deleteSelectedSessions() {
  if (
    selectedSessionIds.value.size === 0 ||
    connectionStatus.value !== $c.ConnStatus.Connected
  ) {
    return false
  }

  isLoading.value = true
  error.value = null

  try {
    const selectedSessions = sessions.value.filter((session) =>
      selectedSessionIds.value.has(session.session_id)
    )
    const sessionIds = selectedSessions.map((session) => session.session_id)
    const sessionTypes = selectedSessions.map((session) => session.session_type)

    const response = await fetch(`${serverUrl.value}/sessions`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_ids: sessionIds,
        session_types: sessionTypes,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete sessions: ${response.status}`)
    }

    selectedSessionIds.value = new Set()
    if (sessionIds.includes(currentSessionId.value)) {
      setCurrentSessionId(null)
    }
    const nextPage =
      sessionIds.length >= sessions.value.length && page.value > 1
        ? page.value - 1
        : page.value
    await fetchSessions(nextPage)
    return true
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to delete sessions'
    return false
  } finally {
    isLoading.value = false
  }
}

function toggleSessionSelection(sessionId) {
  const next = new Set(selectedSessionIds.value)
  if (next.has(sessionId)) {
    next.delete(sessionId)
  } else {
    next.add(sessionId)
  }
  selectedSessionIds.value = next
}

function selectAllSessions() {
  selectedSessionIds.value = new Set(
    sessions.value.map((session) => session.session_id)
  )
}

function clearSelection() {
  selectedSessionIds.value = new Set()
}

events.on(RuntimeEvents.SESSION_CREATED, (session) => {
  sessions.value = [session, ...sessions.value]
  setCurrentSessionId(session.session_id)
  // TODO: handle pages
})

watch(
  [connectionStatus, selectedEntity],
  () => {
    if (connectionStatus.value === $c.ConnStatus.Connected) {
      fetchSessions(1)
    } else {
      resetState()
    }
  },
  { immediate: true }
)

export function useSessionManager() {
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
