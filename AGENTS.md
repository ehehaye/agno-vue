# AGENTS.md

Agno Vue — Vue 2 chat UI for an Agno agent/team backend, with SSE streaming and progressive Markdown rendering.

## Project

- Stack: Vue 2.6.14 + `@vue/composition-api`, Vite 8 (`vite-plugin-vue2`), Less, vue-i18n 8 (zh/en).
- Entry point: `src/main.js` → `src/App.vue` (`<router-view>`); routing lives in `src/router/index.js` (hash mode).
- Route guard: every non-Setup route requires a persisted `serverUrl` and a successful `/agents` + `/teams` verification (`ensureConnected`), otherwise it redirects to `SetupView`. `ConfigPanel` links to `/#/setup` for changing the server.
- Talks to an Agno server (default `location.origin + '/agno'`, proxied by Vite to `http://localhost:7777` in dev).
- Unit tests use Node's built-in test runner (`tests/*.test.js`; alias resolution is registered by `tests/register-alias.mjs`). Verification = `pnpm lint:check` + `pnpm test` + `pnpm build`.

## Commands

```bash
pnpm i          # install (pnpm, lockfile is pnpm-lock.yaml)
pnpm dev        # Vite dev server on :5173, opens browser
pnpm build      # vite build -> dist/ (gitignored)
pnpm preview    # serve the built dist/
pnpm lint       # eslint . --fix  (NOTE: mutates files)
pnpm lint:check # eslint without --fix (CI-friendly)
pnpm test       # node:test unit tests
npx eslint src                              # read-only lint check
```

## Architecture

- `src/hooks/agno/useConfig.js` — singleton state: `serverUrl` (persisted, empty until Setup configures it), `agents`/`teams`/`workflows` (fetched from `/agents`, `/teams`, `/workflows`), `selectedEntity`, `currentSessionId`, `connectionStatus`, `isVerified`; `connect()`/`ensureConnected()` perform the guarded connectivity check.
- `src/views/` — `ChatView` (AppLayout + sidebar + ChatInterface) and `SetupView` (server URL form); both are lazily loaded by the router.
- `src/hooks/agno/useAgentRun.js` — the core: POSTs `/agents|teams|workflows/{id}/runs` (form-urlencoded, `stream=true`), feeds chunks through `SSEParser`, keeps shared `currentRun`/`messages` state, and handles cancellation/errors. Pure agent/team transitions live in `runState.js`, workflow step transitions in `workflowState.js`, and `/sessions/{id}/runs` history reconstruction in `historyMapper.js`. Workflow step-level HITL pauses are resumed through `POST /workflows/{id}/runs/{run_id}/continue` with resolved `step_requirements`.
- `src/hooks/agno/useSessionManager.js` — session list/paging via `/sessions`; listens on the module-level `events` bus (`RuntimeEvents.SESSION_CREATED`).
- `src/utils/sse-parser.js` — buffered `SSEParser` (chunk-boundary safe) + `parseSSELine`/`parseSSEStream`.
- `src/constants/` — `Role`, `RunEvent`, `RunStatus`, `StepStatus`, `ToolCallStatus`, `ConnStatus`, merged into frozen `$c`, exposed globally as `this.$c` (`src/plugins/constants.js`).
- `src/components/chat/` — `ChatInterface` (composes `messages` + synthetic streaming message, TOC), `ChatMessage`, `messages/AssistantMessage.vue` with blocks in `messages/blocks/` (ToolCall / Reasoning / MemberRun / WorkflowStep / WorkflowPause / Duration).
- `src/components/md/MarkdownRenderer.vue` — `marked` + `remend` (heals partial streaming markdown) + `DOMPurify` + `htmlparser2` → vNode tree rendered by `NodeRenderer` (text nodes via `TextNodeRenderer`, which appends incrementally to preserve selection), so streaming re-renders diff incrementally. Custom tags (`<thinking>`) are provided as `CUSTOM_COMPONENTS`/`CUSTOM_TAGS` from `src/components/chat/hydration/`.

## Conventions

- Hooks keep their `ref`s at module scope → shared singleton state across components; call the hook, don't re-create state. Watchers and event listeners are registered once at module scope for the same reason; do not add per-call subscriptions inside the hook factory.
- API shape: `RunEvent` values are CamelCase strings from the Agno stream (`RunContent`, `TeamToolCallStarted`, `StepPaused`, …). Team events are detected by the `Team` prefix (`src/types/index.js`), not by identity. Workflow streams multiplex step metadata (`step_id`, `step_name`, `step_index`, `parent_step_id`) onto agent/team events, so route nested content by `step_id` (falling back to name + index after a pause/continue).
- Update runs immutably (`currentRun.value = { ...prev, ... }`, `messages.value = [...messages.value, msg]`).
- Two component styles coexist: `<script setup>` (enabled by `unplugin-vue2-script-setup`) for newer components, and `export default defineComponent({ ... })` from `@vue/composition-api` for older/stateful ones. Match the surrounding file.
- ESLint: **no semicolons**, 2-space indent, single quotes, object-curly-spacing `always`, sorted import members. Config is ESLint 10 flat config (`eslint.config.js`). `.prettierrc` also uses `semi: false` — ESLint is authoritative.
- Styles: Less + Tailwind CSS 4. `variables.less` and `mixins.less` are auto-injected into every Less block by `vite.config.js`, so use `@spacing-md`, `@border-color`, etc. without importing. Tailwind runs through `@tailwindcss/vite`; tokens live in `@theme` in `src/assets/styles/tailwind.css` and mirror `variables.less` (keep both in sync). Tailwind utilities use the **`tw:` prefix** (e.g. `tw:flex`, `tw:hover:underline`); custom spacing tokens are `tight/compact/base/loose/wide`. Prefer `<style lang="less" scoped>` for component-specific styles and `tw:` utilities for new layout/spacing work.
- Use `@/` alias for `src` imports; import icons/components through their folder `index.js` barrels.
- User-facing strings go through `$t()` with keys in `src/lang/{en,zh}.js`.

## Notes

-
