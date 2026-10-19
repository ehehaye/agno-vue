import { computed, ref } from '@vue/composition-api'
import { $c } from '@/constants'
import { readStorage, writeStorage } from '@/utils/storage'

const DEFAULT_SERVER_URL = `${window.location.protocol}//${window.location.host}/agno`

const serverUrl = ref(readStorage('serverUrl', DEFAULT_SERVER_URL))
const selectedEntity = ref(readStorage('entity', null))
const selectedEntityType = computed(() => selectedEntity.value?.type)
const currentSessionId = ref(null)
const connectionStatus = ref($c.ConnStatus.Disconnected)
const agents = ref([])
const teams = ref([])
const error = ref(null)
const refreshing = ref(false)

export function useConfig() {
  const setServerUrl = (url) => {
    const next = String(url || '').trim()
    if (!next) {
      return
    }
    serverUrl.value = next
    writeStorage('serverUrl', next)
  }

  const setCurrentSessionId = (id) => {
    currentSessionId.value = id
  }

  const disconnect = () => {
    connectionStatus.value = $c.ConnStatus.Disconnected
    agents.value = []
    teams.value = []
    error.value = null
    // Clear session ID on disconnect since we can't load it without connection
    setCurrentSessionId(null)
  }

  const connect = async () => {
    if (!serverUrl.value.trim()) {
      error.value = 'Please enter a server URL'
      return
    }

    connectionStatus.value = $c.ConnStatus.Connecting
    error.value = null
    agents.value = []
    teams.value = []

    try {
      // Fetch agents and teams in parallel
      const [agentsResponse, teamsResponse] = await Promise.all([
        fetch(`${serverUrl.value}/agents`),
        fetch(`${serverUrl.value}/teams`),
      ])

      if (!agentsResponse.ok) {
        throw new Error(`Failed to fetch agents: ${agentsResponse.status}`)
      }
      if (!teamsResponse.ok) {
        throw new Error(`Failed to fetch teams: ${teamsResponse.status}`)
      }

      const agentsData = await agentsResponse.json()
      const teamsData = await teamsResponse.json()

      agents.value = agentsData
      teams.value = teamsData
      writeStorage('serverUrl', serverUrl.value)

      const savedEntity = selectedEntity.value
      const savedList =
        savedEntity?.type === 'team' ? teams.value : agents.value
      const savedMatch = savedList.find((entity) => entity.id === savedEntity?.id)

      if (savedMatch) {
        selectEntity(savedEntity.type, savedMatch.id, savedMatch.name)
      } else if (agents.value.length > 0) {
        selectDefaultAgent()
      } else if (teams.value.length > 0) {
        selectDefaultTeam()
      }

      connectionStatus.value = $c.ConnStatus.Connected
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to server'
      error.value = errorMessage
      connectionStatus.value = $c.ConnStatus.Error
    }
  }

  const refresh = async () => {
    if (!serverUrl.value.trim() || connectionStatus.value !== $c.ConnStatus.Connected) {
      return
    }

    refreshing.value = true
    error.value = null

    try {
      const [agentsResponse, teamsResponse] = await Promise.all([
        fetch(`${serverUrl.value}/agents`),
        fetch(`${serverUrl.value}/teams`),
      ])

      if (!agentsResponse.ok) {
        throw new Error(`Failed to fetch agents: ${agentsResponse.status}`)
      }
      if (!teamsResponse.ok) {
        throw new Error(`Failed to fetch teams: ${teamsResponse.status}`)
      }

      const agentsData = await agentsResponse.json()
      const teamsData = await teamsResponse.json()

      agents.value = agentsData
      teams.value = teamsData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh'
      error.value = errorMessage
    } finally {
      refreshing.value = false
    }
  }

  const selectEntity = (type, id, name) => {
    const newEntity = { type, id, name }
    selectedEntity.value = newEntity
    writeStorage('entity', newEntity)
    // Clear session ID when switching entities (treat as New Chat)
    setCurrentSessionId(null)
  }

  const selectAgent = (id, name) => {
    selectEntity('agent', id, name)
  }

  const selectTeam = (id, name) => {
    selectEntity('team', id, name)
  }

  const selectDefaultAgent = () => {
    if (agents.value.length > 0) {
      selectAgent(agents.value[0].id, agents.value[0].name)
    }
  }

  const selectDefaultTeam = () => {
    if (teams.value.length > 0) {
      selectTeam(teams.value[0].id, teams.value[0].name)
    }
  }

  return {
    serverUrl,
    setServerUrl,
    connectionStatus,
    agents,
    teams,
    selectedEntity,
    selectedEntityType,
    currentSessionId,
    connect,
    disconnect,
    refresh,
    refreshing,
    selectEntity,
    selectAgent,
    selectTeam,
    selectDefaultAgent,
    selectDefaultTeam,
    setCurrentSessionId,
    error,
  }
}
