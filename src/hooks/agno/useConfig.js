import { computed, ref } from '@vue/composition-api'
import { $c } from '@/constants'
import { readStorage, writeStorage } from '@/utils/storage'

const DEFAULT_SERVER_URL = `${window.location.protocol}//${window.location.host}/agno`
const CONNECT_TIMEOUT = 8000

export const defaultServerUrl = DEFAULT_SERVER_URL

const serverUrl = ref(readStorage('serverUrl', ''))
const selectedEntity = ref(readStorage('entity', null))
const selectedEntityType = computed(() => selectedEntity.value?.type)
const currentSessionId = ref(null)
const connectionStatus = ref($c.ConnStatus.Disconnected)
const isVerified = ref(false)
const agents = ref([])
const teams = ref([])
const workflows = ref([])
const error = ref(null)
const refreshing = ref(false)
let connectPromise = null

function entityList(type) {
  if (type === 'team') {
    return teams.value
  }
  if (type === 'workflow') {
    return workflows.value
  }
  return agents.value
}

export function useConfig() {
  const setServerUrl = (url) => {
    const next = String(url || '').trim()
    if (!next) {
      return
    }
    const changed = next !== serverUrl.value
    serverUrl.value = next
    writeStorage('serverUrl', next)
    if (changed) {
      isVerified.value = false
      if (connectionStatus.value === $c.ConnStatus.Connected) {
        disconnect()
      }
    }
  }

  const setCurrentSessionId = (id) => {
    currentSessionId.value = id
  }

  const disconnect = () => {
    connectionStatus.value = $c.ConnStatus.Disconnected
    isVerified.value = false
    agents.value = []
    teams.value = []
    workflows.value = []
    error.value = null
    // Clear session ID on disconnect since we can't load it without connection
    setCurrentSessionId(null)
  }

  const connect = async () => {
    if (!serverUrl.value.trim()) {
      error.value = 'Please enter a server URL'
      connectionStatus.value = $c.ConnStatus.Disconnected
      isVerified.value = false
      return false
    }

    connectionStatus.value = $c.ConnStatus.Connecting
    error.value = null
    agents.value = []
    teams.value = []
    workflows.value = []

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT)

    try {
      // Fetch agents, teams and workflows in parallel
      const [agentsResponse, teamsResponse, workflowsResponse] = await Promise.all([
        fetch(`${serverUrl.value}/agents`, { signal: controller.signal }),
        fetch(`${serverUrl.value}/teams`, { signal: controller.signal }),
        fetch(`${serverUrl.value}/workflows`, { signal: controller.signal }),
      ])

      if (!agentsResponse.ok) {
        throw new Error(`Failed to fetch agents: ${agentsResponse.status}`)
      }
      if (!teamsResponse.ok) {
        throw new Error(`Failed to fetch teams: ${teamsResponse.status}`)
      }
      if (!workflowsResponse.ok) {
        throw new Error(`Failed to fetch workflows: ${workflowsResponse.status}`)
      }

      const agentsData = await agentsResponse.json()
      const teamsData = await teamsResponse.json()
      const workflowsData = await workflowsResponse.json()

      if (
        !Array.isArray(agentsData) ||
        !Array.isArray(teamsData) ||
        !Array.isArray(workflowsData)
      ) {
        throw new Error('Unexpected response from server')
      }

      agents.value = agentsData
      teams.value = teamsData
      workflows.value = workflowsData
      writeStorage('serverUrl', serverUrl.value)

      const savedEntity = selectedEntity.value
      const savedMatch = entityList(savedEntity?.type).find(
        (entity) => entity.id === savedEntity?.id
      )

      if (savedMatch) {
        selectEntity(savedEntity.type, savedMatch.id, savedMatch.name)
      } else if (agents.value.length > 0) {
        selectDefaultAgent()
      } else if (teams.value.length > 0) {
        selectDefaultTeam()
      } else if (workflows.value.length > 0) {
        selectDefaultWorkflow()
      } else {
        selectedEntity.value = null
      }

      isVerified.value = true
      connectionStatus.value = $c.ConnStatus.Connected
      return true
    } catch (err) {
      const errorMessage =
        err?.name === 'AbortError'
          ? 'Connection timed out'
          : err instanceof Error
            ? err.message
            : 'Failed to connect to server'
      error.value = errorMessage
      isVerified.value = false
      connectionStatus.value = $c.ConnStatus.Error
      return false
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const ensureConnected = async () => {
    if (isVerified.value && connectionStatus.value === $c.ConnStatus.Connected) {
      return true
    }
    if (!serverUrl.value.trim()) {
      return false
    }
    if (!connectPromise) {
      connectPromise = connect().finally(() => {
        connectPromise = null
      })
    }
    return connectPromise
  }

  const refresh = async () => {
    if (!serverUrl.value.trim() || connectionStatus.value !== $c.ConnStatus.Connected) {
      return
    }

    refreshing.value = true
    error.value = null

    try {
      const [agentsResponse, teamsResponse, workflowsResponse] = await Promise.all([
        fetch(`${serverUrl.value}/agents`),
        fetch(`${serverUrl.value}/teams`),
        fetch(`${serverUrl.value}/workflows`),
      ])

      if (!agentsResponse.ok) {
        throw new Error(`Failed to fetch agents: ${agentsResponse.status}`)
      }
      if (!teamsResponse.ok) {
        throw new Error(`Failed to fetch teams: ${teamsResponse.status}`)
      }
      if (!workflowsResponse.ok) {
        throw new Error(`Failed to fetch workflows: ${workflowsResponse.status}`)
      }

      const agentsData = await agentsResponse.json()
      const teamsData = await teamsResponse.json()
      const workflowsData = await workflowsResponse.json()

      agents.value = agentsData
      teams.value = teamsData
      workflows.value = workflowsData
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

  const selectWorkflow = (id, name) => {
    selectEntity('workflow', id, name)
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

  const selectDefaultWorkflow = () => {
    if (workflows.value.length > 0) {
      selectWorkflow(workflows.value[0].id, workflows.value[0].name)
    }
  }

  const selectDefaultEntity = (type) => {
    if (type === 'team') {
      selectDefaultTeam()
    } else if (type === 'workflow') {
      selectDefaultWorkflow()
    } else {
      selectDefaultAgent()
    }
  }

  const entitiesFor = (type) => entityList(type)

  return {
    serverUrl,
    defaultServerUrl,
    setServerUrl,
    connectionStatus,
    isVerified,
    ensureConnected,
    agents,
    teams,
    workflows,
    entitiesFor,
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
    selectWorkflow,
    selectDefaultAgent,
    selectDefaultTeam,
    selectDefaultWorkflow,
    selectDefaultEntity,
    setCurrentSessionId,
    error,
  }
}
