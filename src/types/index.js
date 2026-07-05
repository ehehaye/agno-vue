export function isTeamEvent(event) {
  return event.event.startsWith('Team')
}

export function isAgentEvent(event) {
  return !event.event.startsWith('Team')
}

export function getEntityId(event) {
  return isTeamEvent(event) ? event.team_id : event.agent_id
}

export function getEntityName(event) {
  return isTeamEvent(event) ? event.team_name : event.agent_name
}
