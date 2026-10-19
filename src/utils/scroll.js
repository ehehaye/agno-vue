export function getDistanceToBottom(el) {
  return Math.max(el.scrollHeight - el.scrollTop - el.clientHeight, 0)
}
