import { existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SRC_ROOT = new URL('../src/', import.meta.url)

export async function resolve(specifier, context, nextResolve) {
  let base
  if (specifier.startsWith('@/')) {
    base = new URL(specifier.slice(2), SRC_ROOT)
  } else if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL
  ) {
    base = new URL(specifier, context.parentURL)
  } else {
    return nextResolve(specifier, context)
  }
  const candidates = [
    base.href,
    `${base.href}.js`,
    `${base.href.replace(/\/$/, '')}/index.js`,
  ]

  for (const candidate of candidates) {
    const filePath = fileURLToPath(candidate)
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      return nextResolve(candidate, context)
    }
  }

  return nextResolve(base.href, context)
}
