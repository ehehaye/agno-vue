# AGENTS.md

Agno Vue — Vue 2 chat UI for an Agno agent/team backend, with SSE streaming and progressive Markdown rendering.

## Project

- Stack: Vue 2.6.14 + `@vue/composition-api`, Vite 8 (`vite-plugin-vue2`), Less, vue-i18n 8 (zh/en).
- Entry point: `src/main.js` → `src/App.vue` (mounts, calls `connect()` on mount).
- Talks to an Agno server (default `location.origin + '/agno'`, proxied by Vite to `http://localhost:7777` in dev).
- No test suite exists. Verification = `pnpm lint` + `pnpm build`.

## Commands

```bash
pnpm i          # install (pnpm, lockfile is pnpm-lock.yaml)
pnpm dev        # Vite dev server on :5173, opens browser
pnpm build      # vite build -> dist/ (gitignored)
pnpm preview    # serve the built dist/
pnpm lint       # eslint . --ext .vue,.js,... --fix  (NOTE: mutates files)
npx eslint src --ext .vue,.js               # read-only lint check
```

## Architecture

- `src/hooks/agno/useConfig.js` — singleton state: `serverUrl`, `agents`/`teams` (fetched from `/agents`, `/teams`), `selectedEntity`, `currentSessionId`, `connectionStatus`.
- `src/hooks/agno/useAgentRun.js` — the core: POSTs `/agents|teams/{id}/runs` (form-urlencoded, `stream=true`), feeds chunks through `SSEParser`, accumulates `currentRun` (content, reasoning, tool_calls, member_runs), pushes a finished assistant message on `RunCompleted`, and `loadSession()` rebuilds history from `/sessions/{id}/runs`.
- `src/hooks/agno/useSessionManager.js` — session list/paging via `/sessions`; listens on the `events` bus (`RuntimeEvents.SESSION_CREATED`).
- `src/utils/sse-parser.js` — buffered `SSEParser` (chunk-boundary safe) + `parseSSELine`/`parseSSEStream`.
- `src/constants/` — `Role`, `RunEvent`, `RunStatus`, `ToolCallStatus`, `ConnStatus`, merged into frozen `$c`, exposed globally as `this.$c` (`src/plugins/constants.js`).
- `src/components/chat/` — `ChatInterface` (composes `messages` + synthetic streaming message, TOC), `ChatMessage`, `messages/AssistantMessage.vue` with blocks in `messages/blocks/` (ToolCall / Reasoning / MemberRun / Duration).
- `src/components/md/MarkdownRenderer.vue` — `marked` + `remend` (heals partial streaming markdown) + `DOMPurify` + `htmlparser2` → vNode tree rendered by `NodeRenderer` (text nodes via `TextNodeRenderer`, which appends incrementally to preserve selection), so streaming re-renders diff incrementally. Custom tags (`<thinking>`) are provided as `CUSTOM_COMPONENTS`/`CUSTOM_TAGS` from `src/components/chat/hydration/`.

## Conventions

- Hooks keep their `ref`s at module scope → shared singleton state across components; call the hook, don't re-create state.
- API shape: `RunEvent` values are CamelCase strings from the Agno stream (`RunContent`, `TeamToolCallStarted`, …). Team events are detected by the `Team` prefix (`src/types/index.js`), not by identity.
- Update runs immutably (`currentRun.value = { ...prev, ... }`, `messages.value = [...messages.value, msg]`).
- Two component styles coexist: `<script setup>` (enabled by `unplugin-vue2-script-setup`) for newer components, and `export default defineComponent({ ... })` from `@vue/composition-api` for older/stateful ones. Match the surrounding file.
- ESLint: **no semicolons**, 2-space indent, single quotes, object-curly-spacing `always`, sorted import members. `.prettierrc` says `semi: true` but ESLint is authoritative — write no semicolons.
- Styles: Less + Tailwind. `variables.less` and `mixins.less` are auto-injected into every Less block by `vite.config.js`, so use `@spacing-md`, `@border-color`, etc. without importing. Tailwind is wired through `postcss.config.cjs` + `tailwind.config.cjs`; its design tokens mirror `variables.less` (keep both in sync). Prefer `<style lang="less" scoped>` for component-specific styles and Tailwind utilities for new layout/spacing work.
- Use `@/` alias for `src` imports; import icons/components through their folder `index.js` barrels.
- User-facing strings go through `$t()` with keys in `src/lang/{en,zh}.js`.

## Notes

-
