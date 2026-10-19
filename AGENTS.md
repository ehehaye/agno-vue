# AGENTS.md

Agno Vue — a Vue 2 chat frontend for an Agno server. It supports **Agents**, **Teams**, and **Workflows**, consumes SSE streams, renders partial Markdown incrementally, reconstructs session history, and handles workflow human-in-the-loop pauses.

## Project

- Stack: Vue 2.6.14 + `@vue/composition-api`, Vite 8 (`vite-plugin-vue2`), Less, Tailwind CSS 4, vue-i18n 8 (zh/en), `vue-virtual-scroller`.
- Runtime: Node.js **>= 20.19.0**, pnpm (`pnpm-lock.yaml`).
- Entry point: `src/main.js` → `src/App.vue` (`<router-view>`); routing lives in `src/router/index.js` (hash mode).
- The UI talks to an Agno server. The default server URL is `window.location.origin + '/agno'`; in dev Vite proxies `/agno` to `http://localhost:7777` and strips the prefix.
- Read [README.md](README.md) for user-facing setup and [README-zh.md](README-zh.md) for the Chinese version. Keep all three documents in sync when behavior changes.

## Commands

```bash
pnpm i          # install dependencies
pnpm dev        # Vite dev server on :5173 (opens browser)
pnpm build      # production build -> dist/ (gitignored)
pnpm preview    # serve the built bundle
pnpm lint:check # ESLint without writing changes (CI-friendly)
pnpm lint       # ESLint with --fix (mutates files)
pnpm test       # node:test unit tests
```

Verification before finishing a change:

```bash
pnpm lint:check
pnpm test
pnpm build
```

For UI or streaming changes, also run `pnpm dev` against a local Agno server and exercise the affected flow in a browser.

## Bootstrap and routing

- `src/main.js` registers `@vue/composition-api`, `vue-virtual-scroller`, i18n, the router, and global styles.
- `src/plugins/constants.js` exposes the frozen `$c` constant bundle as `Vue.prototype.$c`; templates also use `$c`.
- The router guard (`src/router/index.js`) requires a stored `serverUrl` and a successful `ensureConnected()`. It redirects to `SetupView` (`/#/setup`) otherwise.
- `ensureConnected()` verifies connectivity by fetching `/agents`, `/teams`, and `/workflows` in parallel with an 8s timeout.
- `ChatView` composes `AppLayout`, `SessionSidebar`, `ConfigPanel`, and `ChatInterface`. `SetupView` edits the server URL and re-verifies it.

## Backend contract

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/agents`, `/teams`, `/workflows` | Returns arrays; used for connectivity and selectors |
| `POST` | `/{agents\|teams\|workflows}/{id}/runs` | Form-urlencoded: `message`, `stream=true`, optional `session_id` |
| `POST` | `/workflows/{workflow_id}/runs/{run_id}/continue` | Form-urlencoded: `session_id`, `stream=true`, `step_requirements` (JSON array) |
| `GET` | `/sessions?type=&component_id=&page=&limit=` | Session list; response `{ data, meta: { total_pages, total_count } }` |
| `GET` | `/sessions/{session_id}/runs` | History used by `historyMapper.js` |
| `DELETE` | `/sessions` | JSON `{ session_ids, session_types }` |

- Errors from non-2xx responses are read from `{ detail }` when present (`httpError()` in `useAgentRun.js`).
- Streaming is SSE over `fetch`; `SSEParser` is chunk-boundary safe and `readEventStream()` flushes the final buffered event.
- Cancellation is client-side only (`AbortController`); the backend may keep running.

## State modules

State is intentionally module-scoped so every component shares one instance. Never re-create refs inside a hook factory.

### `src/hooks/agno/useConfig.js`

Owns `serverUrl`, `selectedEntity`, `currentSessionId`, `connectionStatus`, `isVerified`, and the `agents` / `teams` / `workflows` lists.

- `connect()` fetches all three lists in parallel and selects the remembered entity when it still exists, otherwise the first available agent/team/workflow.
- `ensureConnected()` deduplicates concurrent connects through `connectPromise`.
- `selectEntity(type, id, name)` persists `{ type, id, name }` and clears `currentSessionId` (switching entity means a new chat).
- `entitiesFor(type)` and `selectDefaultEntity(type)` back `ConfigPanel`.
- Persisted values go through `src/utils/storage.js` under the `agno-vue:` prefix: `serverUrl`, `entity`, `locale`.

### `src/hooks/agno/useAgentRun.js`

The core streaming controller. Module state: `messages`, `currentRun`, `isStreaming`, `isLoadingSession`, `error`; locals: `memberRuns` map, `activeController`, session-load token.

- `sendMessage(content)` ignores calls while streaming, appends the user message, POSTs the run, and delegates events to `handleAgentEvent`.
- Event dispatch chooses by selected entity type: workflow → `workflowState.js` logic; otherwise `Team*` events → team handler, everything else → agent handler. Team events are detected by the `Team` prefix via `isTeamEvent()` in `src/utils/event.js`.
- Member agent events are routed by `parent_run_id`; workflow nested agent/team events are routed by `step_id`.
- `finalizeCurrentRun()` appends a finalized assistant message only when `hasRunOutput()` is true.
- `continueRun(approved, run, { feedback })` removes the paused streaming message, marks the run streaming again, and POSTs the continue request with resolved `step_requirements`.
- `loadSession(id)` is race-protected with a token; it clears current state before fetching `/sessions/{id}/runs`.
- `finishStreaming()` converts an unexpectedly ended stream into `Error` (or `Cancelled` after an abort) so the UI never stays stuck in `streaming`.

### Pure transitions

- `src/hooks/agno/runState.js` — agent/team run and member-run transitions (`createRunFromEvent`, `appendRunContent`, tool-call lifecycle, completion/errors).
- `src/hooks/agno/workflowState.js` — workflow run and step transitions, including container steps, nested depth, pauses, `StepOutput` merging, and `buildStepRequirements()`.
- `src/hooks/agno/historyMapper.js` — `/sessions/{id}/runs` → message/run structures, including member runs, tool calls, flattened workflow steps, and the active pause requirement.

Keep these modules pure: they take a run object and an event and return a new object. Add unit tests when changing them.

### `src/hooks/agno/useSessionManager.js`

Owns the paginated session list (`PAGE_SIZE = 20`), selection set, loading/error state.

- Fetches `/sessions` for the selected entity; aborts stale requests via a request token and controller.
- `deleteSessions(ids)` performs one DELETE request, cleans the selection, clears the current session if deleted, and adjusts the page when the last row on a page disappears.
- Listens on the module-level `events` bus (`RuntimeEvents.SESSION_CREATED` from `src/hooks/agno/events.js`). On creation it selects the session, increments `totalCount`, recomputes `totalPages`, and prepends/trims only when the user is on page 1.

## Workflow event model and HITL

Workflow streams reuse agent/team events and multiplex step metadata: `step_id`, `step_name`, `step_index`, `step_type`, `parent_step_id`, `nested_depth`.

- Container events (`ParallelExecution*`, `ConditionExecution*`, `LoopExecution*`, `RouterExecution*`, `StepsExecution*`) create/complete steps with a container `type`.
- `StepStarted` / `StepCompleted` / `StepError` / `StepOutput` drive step lifecycle and output.
- `StepPaused`, `StepOutputReview`, and `StepExecutorPaused` store `pausedRequirement` on the run.
- `StepContinued` / `StepExecutorContinued` clear the pause and mark the step running.
- Usage is reported on executor `RunCompleted` / `TeamRunCompleted` events and on `StepCompleted.step_response.metrics`. `setWorkflowStepMetrics()` applies it as soon as the executor finishes; `completeWorkflowRun()` aggregates leaf-step usage into the run.
- After a continue, Agno may mint a **new step id**. `resolveStepId()` matches by `step_id` first, then falls back to `step_name` + `step_index`. Preserve this fallback.
- The pause card (`WorkflowPauseBlock.vue`) supports confirmation and output-review pauses. It sends `confirmed: true|false`, `on_reject`, and optional `rejection_feedback`. `rejection_feedback` is only meaningful when `on_reject === 'retry'`.
- Unsupported resolution types render `workflow.unsupportedPause` instead of offering actions.

## Usage metrics

- `src/utils/usage.js` — `sumUsage(metricsList)`, `hasUsage(metrics)`, and `extractUsage(metrics)` (handles both flat metrics and workflow-style `{ steps: { name: { metrics } } }`).
- Agent/team runs: `completeRun()` and `completeMemberRun()` merge the whole `event.metrics` object, preserving `input_tokens`, `output_tokens`, `total_tokens`, `cache_read_tokens`, `reasoning_tokens`, `time_to_first_token`, `duration`, and `details`.
- Workflow runs: step metrics come from `StepCompleted.step_response.metrics` (or an executor `RunCompleted`); `completeWorkflowRun()` sums them so the turn footer has aggregate usage.
- History: `historyMapper.js` keeps agent/team metrics as-is and sums flattened workflow step metrics onto `metrics`.
- UI: `RunUsageBlock.vue` renders the completion time plus input/output/total/cached tokens; `RunContentBlocks.vue` uses it for top-level and member runs, `WorkflowStepBlock.vue` uses it per completed step.
- Token counts are formatted by `formatTokenCount()` in `src/utils/format.js`; extend `USAGE_FIELDS` in `usage.js` when Agno adds a token field.

## Markdown pipeline

`src/components/markdown/`:

- `MarkdownRenderer.vue` throttles parsing (~50ms), deduplicates identical HTML, freezes the parsed children, and replaces the AST as a whole.
- `markdown.js` owns the `Marked` instance, renderer configuration, `remend` healing, and `DOMPurify` sanitization with custom tags allowed.
- `NodeRenderer.vue` renders the AST.
- `TextNodeRenderer.vue` appends to the existing DOM text node instead of replacing it, preserving selection/caret during streaming. `createTextVNode.js` lives beside it.
- Custom elements (`<thinking>`) come from `src/components/chat/customComponents.js`; `AssistantMessage.vue` provides `CUSTOM_COMPONENTS` / `CUSTOM_TAGS` to the renderer.

Do not move streaming text rendering back to whole-node replacement; it breaks selection.

## Scrolling and TOC

- `src/components/ui/StickToBottom.vue` owns pin-to-bottom behavior:
  - `isPinned` derives from `getDistanceToBottom(el) <= threshold`.
  - A `ResizeObserver` watches both the content wrapper and the container, so growth after Markdown layout still triggers following.
  - `scheduleScrollToBottom()` snapshots `scrollTop` and skips the scroll if the user moved away, avoiding fighting manual scrolls.
  - A newly sent user message pins to the bottom; a loaded history session starts at the top.
  - Emits `scroll` with the container for the parent.
- `src/components/ui/Toc.vue` is presentational: props `items` (`{ id, label }`), `activeId`; emits `navigate`. It only keeps the active item visible inside its own list.
- `src/components/chat/ChatInterface.vue` builds `tocItems` from user messages, tracks `activeTocId` from real DOM positions (bottom → last item), and navigates with `scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- `src/utils/scroll.js` intentionally exposes only `getDistanceToBottom`.

## Directory map

```text
src/
├── components/
│   ├── ui/          # domain-agnostic: Collapse, Sender, StickToBottom,
│   │                # StreamingIndicator, Toc
│   ├── chat/        # ChatInterface, ChatMessage, Thinking,
│   │                # customComponents.js, messages/{Assistant,User,blocks}
│   ├── markdown/    # MarkdownRenderer, NodeRenderer, TextNodeRenderer,
│   │                # markdown.js, createTextVNode.js
│   ├── layout/      # AppLayout
│   ├── sessions/    # SessionSidebar, SessionListItem, SessionPager
│   ├── config/      # ConfigPanel
│   └── icons/       # SVG icons + barrel
├── constants/       # Role, RunEvent, RunStatus, StepStatus, ToolCallStatus, ConnStatus
├── hooks/
│   ├── agno/        # events, useConfig, useAgentRun, useSessionManager,
│   │                # runState, workflowState, historyMapper
│   ├── useAutoFocus.js
│   ├── useCompName.js
│   └── usePerfTrack.js
├── utils/           # content, event, format, id, logger, scroll, session,
│                    # sse-parser, storage, ua, usage
├── views/           # ChatView, SetupView
├── lang/            # en.js, zh.js, index.js (LOCALES + applyLocale)
├── plugins/         # composition-api, constants, i18n, virtual-scroller
├── router/
├── assets/styles/   # reset, variables, mixins, Tailwind theme
├── App.vue
└── main.js
```

## Conventions

- `<script setup>` is enabled by `unplugin-vue2-script-setup`; older/stateful components use `defineComponent` from `@vue/composition-api`. Match the surrounding file.
- Script-setup caveat: imported constants referenced directly in the template may not be exposed. Use computed booleans in the script, or the global `$c`. This previously caused a runtime “property is not defined” render failure.
- Hooks keep refs at module scope for shared singleton state. Register watchers/listeners once at module scope, not inside the hook factory.
- Update state immutably: `currentRun.value = { ...prev, ... }`, `messages.value = [...messages.value, message]`.
- Never let a run remain in `streaming` after its stream ends; always go through `finishStreaming()`.
- Add new run/step event names to `src/constants/runEvent.js` and handle them explicitly. Do not infer team events by identity — use the `Team` prefix.
- Use `@/` for `src` imports. Import icons and shared components through folder `index.js` barrels (`ui`, `icons`, `markdown`). Feature entry components may be imported directly.
- User-facing strings go through `$t()`; add keys to both `src/lang/en.js` and `src/lang/zh.js`.
- ESLint: **no semicolons**, 2-space indent, single quotes, object-curly-spacing `always`, sorted import members (`sort-imports`). Config is `eslint.config.js`. `.prettierrc` mirrors `semi: false`; ESLint is authoritative.
- Styles: Less + Tailwind CSS 4. `variables.less` and `mixins.less` are auto-injected into every Less block by `vite.config.js`; use `@spacing-md`, `@border-color`, etc. without importing. Tailwind tokens live in `@theme` in `src/assets/styles/tailwind.css` and mirror `variables.less` — keep both in sync. Utilities use the `tw:` prefix; custom spacing tokens are `tight/compact/base/loose/wide`. Prefer `<style lang="less" scoped>` for component styles and `tw:` for layout/spacing.
- Accessibility: keep `aria-label` / `aria-expanded` on icon-only controls, and preserve IME handling in `Sender.vue` (Enter sends, Cmd/Alt+Enter inserts a newline, composition never sends).

## Tests

- `tests/*.test.js` use Node's built-in `node:test` + `node:assert/strict`.
- `tests/register-alias.mjs` + `tests/alias-loader.mjs` resolve the `@/` alias for tests.
- Current coverage: SSE parsing, agent/team run state, workflow state (including step/run usage), history mapping, formatting (durations and token counts), usage aggregation, session name/time formatting, scroll helper.
- Prefer extracting pure logic into `runState.js`, `workflowState.js`, `historyMapper.js`, or `utils/` and testing it there rather than mounting components.
- There is no component-test harness or end-to-end suite; UI changes require a manual browser smoke test against the Agno backend.

## Common pitfalls

- **Stale paused step:** after continue, step ids change. Use `resolveStepId()`'s name+index fallback.
- **Script-setup template scope:** imported constants may be undefined in templates; expose computed values.
- **SSE chunk boundaries:** always go through `SSEParser`; do not split lines manually.
- **Stream lifecycle:** `finishStreaming()` is the only correct exit path; otherwise the composer can stay in the stop state.
- **History import paths:** `historyMapper.js` must keep producing the same shapes as live events (tool calls, member runs, workflow steps), or history and live UI will diverge.
- **Session paging:** new sessions belong at the top of page 1. Do not prepend to arbitrary pages or the page index will drift.
- **Markdown selection:** keep incremental text updates; replacing text nodes resets the caret during streaming.
- **Scroll ownership:** `StickToBottom` owns following behavior; `Toc` must stay presentational. Do not reintroduce height-ratio or manual-scroll-timer heuristics.
- **Proxy buffering:** SSE needs a non-buffering proxy; if streaming appears in one chunk, check the dev/prod proxy.

## Docs

When adding a mode, endpoint, user-facing feature, shortcut, or supported workflow resolution type, update:

- `README.md` (English, user-facing)
- `README-zh.md` (Chinese, user-facing)
- `AGENTS.md` (this file, implementation-facing)
