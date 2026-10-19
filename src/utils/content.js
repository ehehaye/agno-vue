/**
 * Content detection and formatting utilities for tool call output rendering.
 */

// Thresholds for content size handling
export const CONTENT_THRESHOLDS = {
  SHORT: 200,
}

// Code language detection patterns
const LANGUAGE_PATTERNS = {
  python: /^(def |import |from |class |if __name__|print\(|#\s)/m,
  javascript: /^(const |let |var |function |import |export |=>|async |await )/m,
  typescript: /^(interface |type |enum |namespace |import type|export type)/m,
  json: /^[\s]*[{[]/,
  bash: /^(#!\/|\$\(|&&|\|\||echo |cd |ls |grep )/,
  sql: /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i,
  html: /^[\s]*<(?:!DOCTYPE|html|head|body|div|span|p|a|script|style)/i,
  css: /^[\s]*(@import|@media|@keyframes|[.#]?[\w-]+\s*[{:])/m,
  yaml: /^[\s]*[\w-]+:\s/m,
  xml: /^[\s]*<\?xml|<[\w-]+[\s>]/,
}

// Markdown detection patterns
const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m,
  /\*\*.*?\*\*/,
  /\*.*?\*/,
  /`[^`]+`/,
  /```[\s\S]*?```/,
  /^\s*[-*+]\s/m,
  /^\s*\d+\.\s/m,
  /\[.*?\]\(.*?\)/,
  /^\s*>/m,
]

/**
 * Safely parse JSON string, returning null if invalid
 */
export function tryParseJson(content) {
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Check if a value is a plain object (not array, not null)
 */
export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if a value is an array
 */
export function isArray(value) {
  return Array.isArray(value)
}

/**
 * Detect the programming language of code content
 */
export function detectLanguage(content) {
  for (const [language, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(content)) {
      return language
    }
  }
  return undefined
}

/**
 * Check if content looks like markdown
 */
export function isMarkdown(content) {
  let matchCount = 0
  for (const pattern of MARKDOWN_PATTERNS) {
    if (pattern.test(content)) {
      matchCount++
      if (matchCount >= 2) return true
    }
  }
  return false
}

/**
 * Check if content looks like code (but not JSON)
 */
export function isCode(content, parsed) {
  if (parsed !== null) return false

  const codeIndicators = [
    /;\s*$/m,
    /{\s*$/m,
    /^\s*\/\//m,
    /^\s*\/\*/m,
    /^\s*#/m,
    /\bfunction\b/i,
    /\bclass\b/i,
    /\bimport\b/i,
    /\bexport\b/i,
    /\breturn\b/i,
    /\bif\s*\(/i,
    /\bfor\s*\(/i,
    /\bwhile\s*\(/i,
  ]

  let indicatorCount = 0
  for (const pattern of codeIndicators) {
    if (pattern.test(content)) {
      indicatorCount++
      if (indicatorCount >= 2) return true
    }
  }
  return false
}

/**
 * Count lines in content
 */
export function countLines(content) {
  if (!content) return 0
  return content.split('\n').length
}

/**
 * Analyze content and return metadata for rendering decisions
 */
export function analyzeContent(content) {
  const size = content.length
  const lineCount = countLines(content)
  const parsed = tryParseJson(content)

  let type
  let language

  if (parsed !== null) {
    if (isObject(parsed)) {
      type = 'json-object'
    } else if (isArray(parsed)) {
      type = 'json-array'
    } else {
      type = 'text'
    }
  } else if (isMarkdown(content)) {
    type = 'markdown'
  } else if (isCode(content, parsed)) {
    type = 'code'
    language = detectLanguage(content)
  } else {
    type = 'text'
  }

  const isTruncatable = size > CONTENT_THRESHOLDS.SHORT

  return {
    type,
    parsed,
    language,
    size,
    lineCount,
    isTruncatable,
  }
}

