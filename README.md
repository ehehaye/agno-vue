# Agno Vue

A Vue 2 chat frontend for [Agno](https://docs.agno.com/) servers. It connects to an Agno backend and provides one interface for **Agents**, **Teams**, and **Workflows**, with SSE streaming, progressive Markdown rendering, session history, and workflow human-in-the-loop approvals.

[中文文档](README-zh.md)

## Preview

Team tool calls with per-run token usage:

![Team tool calls and token usage](docs/screenshot.png)

Workflow human-in-the-loop approval:

![Workflow human-in-the-loop approval](docs/screenshot-hitl.png)

## Features

### Agents, Teams, and Workflows

- Switch between **Agent**, **Team**, and **Workflow** modes from the sidebar.
- Pick any agent, team, or workflow exposed by the server.
- The selection and server URL are persisted locally.

### Streaming

- Runs are started over `POST` and consumed as Server-Sent Events (SSE) from the response body.
- Content, reasoning, and tool calls are applied incrementally as events arrive.
- Each completed turn shows its duration and token usage (input, output, total, and cached tokens when reported by the server).
- A running response can be stopped from the composer (aborts the client request).

### Rich message rendering

- Reasoning blocks and `<thinking>` tags.
- Tool calls with arguments, results, and running/completed/error status.
- Team member runs, each with their own reasoning, tools, content, and duration.
- Markdown with syntax highlighting, tables, and sanitized HTML.
- Streaming-safe rendering: partial Markdown is healed before parsing, and text nodes are updated in place so selections and scroll position are preserved.

### Workflows

- Step tree with nested containers: sequential steps, **parallel**, **condition**, **loop**, **router**, and **steps** groups.
- Nested steps are indented by depth and show their executor name.
- Per-step reasoning, tool calls, output, status, and duration.
- Per-step token usage, plus an aggregated usage footer for the whole workflow turn.
- Human-in-the-loop pauses:
  - Approve and continue.
  - Reject with optional feedback; the button reflects `retry` or `skip` rejection semantics.
  - Confirmation-style pauses (`requires_confirmation` / output review) are supported. Other pause resolution types are reported as unsupported instead of failing silently.

### Sessions

- Paginated history list (20 per page) for the selected entity.
- Load a previous session and reconstruct agent, team, and workflow messages.
- Delete a single session or select several and delete them in one request.
- A newly created session is inserted at the top of page 1 without breaking pagination.

### Navigation and layout

- Chat outline (TOC) generated from user messages, with smooth scrolling and active-section tracking.
- Stick-to-bottom auto-scroll that follows streaming content but yields when the user scrolls up.
- Collapsible sidebar, responsive layout, keyboard-friendly composer.
- Chinese and English UI.

### Composer shortcuts

| Key | Action |
| --- | --- |
| `Enter` | Send |
| `Cmd+Enter` (macOS) / `Alt+Enter` | Insert a newline |
| IME composition | Never sends while composing |

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Vue 2.6.14 + `@vue/composition-api` |
| Build | Vite 8 + `vite-plugin-vue2` + `unplugin-vue2-script-setup` |
| Styling | Less + Tailwind CSS 4 (`tw:` prefix) |
| i18n | vue-i18n 8 |
| Markdown | `marked` + `remend` + `DOMPurify` + `htmlparser2` |
| Highlighting | `highlight.js` |
| Virtual list | `vue-virtual-scroller` |
| Tests | Node.js built-in `node:test` |

## Requirements

- Node.js **>= 20.19.0**
- pnpm
- A running Agno server (the examples below assume `http://localhost:7777`)

## Quick start

### 1. Start the backend

Run any Agno server that exposes `/agents`, `/teams`, `/workflows`, `/sessions`, and the run endpoints. If you use DeepSeek, [agno-deepseek](https://github.com/ehehaye/agno-deepseek) is a ready-made example with Agents, Teams, and Workflows.

### 2. Install dependencies

```bash
pnpm i
```

### 3. Start the dev server

```bash
pnpm dev
```

Vite starts on `http://localhost:5173` and proxies `/agno` to `http://localhost:7777` (stripping the prefix).

### 4. Connect to the server

On first launch the app redirects to `/#/setup`. The default value is:

```text
http://localhost:5173/agno
```

which uses the Vite proxy. You can also enter an absolute server URL such as `http://localhost:7777`; in that case the Agno server must allow cross-origin requests from the UI origin.

The app verifies connectivity by fetching `/agents`, `/teams`, and `/workflows` before entering the chat.

### 5. Build for production

```bash
pnpm build
```

The static bundle is written to `dist/`. Serve it from any static host. Routing uses hash mode, so no server-side rewrite is required.

In production, either:

- reverse-proxy `/agno` to the Agno server (same behavior as the Vite proxy), or
- configure an absolute `serverUrl` in the Setup page and enable CORS on the Agno server.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start Vite on port 5173 and open the browser |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Serve the built bundle locally |
| `pnpm test` | Run unit tests with Node's test runner |
| `pnpm lint` | ESLint with `--fix` (mutates files) |
| `pnpm lint:check` | ESLint without writing changes |

Recommended verification before opening a pull request:

```bash
pnpm lint:check
pnpm test
pnpm build
```

## Backend API

The frontend uses the following Agno endpoints.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/agents`, `/teams`, `/workflows` | Entity lists used to verify connectivity and fill the selectors |
| `POST` | `/{agents\|teams\|workflows}/{id}/runs` | Start a run. Form fields: `message`, `stream=true`, optional `session_id` |
| `POST` | `/workflows/{workflow_id}/runs/{run_id}/continue` | Resume a paused workflow. Form fields: `session_id`, `stream=true`, `step_requirements` (JSON) |
| `GET` | `/sessions?type=&component_id=&page=&limit=` | Paginated session list |
| `GET` | `/sessions/{session_id}/runs` | Run history used to rebuild a conversation |
| `DELETE` | `/sessions` | Delete sessions. JSON body: `{ "session_ids": [...], "session_types": [...] }` |

Run requests use `Content-Type: application/x-www-form-urlencoded`. Streaming responses are parsed by a buffered SSE parser that is safe across chunk boundaries.

### Workflow `step_requirements`

When a workflow pauses, the UI sends one entry per paused step:

```json
[
  {
    "step_id": "...",
    "step_name": "...",
    "step_index": 0,
    "step_type": "Step",
    "requires_confirmation": true,
    "confirmed": true,
    "on_reject": "retry",
    "rejection_feedback": "optional feedback"
  }
]
```

`confirmed` is `true` for approve and `false` for reject. `rejection_feedback` is only consumed by Agno when `on_reject` is `retry`.

## Configuration

Values are persisted in `localStorage` under the `agno-vue:` prefix:

| Key | Meaning |
| --- | --- |
| `serverUrl` | Agno server base URL |
| `entity` | Last selected `{ type, id, name }` |
| `locale` | `zh` or `en` |

Development proxy and aliases live in `vite.config.js`:

- `@` → `src/`
- `/agno` → `http://localhost:7777` (prefix stripped)
- Less variables and mixins are auto-injected into every style block.

UI strings live in `src/lang/en.js` and `src/lang/zh.js`.

## Project structure

```text
src/
├── components/
│   ├── ui/                  # Domain-agnostic primitives
│   │   ├── Collapse.vue
│   │   ├── Sender.vue
│   │   ├── StickToBottom.vue
│   │   ├── StreamingIndicator.vue
│   │   └── Toc.vue
│   ├── chat/                # Chat composition and message rendering
│   │   ├── ChatInterface.vue
│   │   ├── ChatMessage.vue
│   │   ├── Thinking.vue
│   │   ├── customComponents.js
│   │   └── messages/
│   │       ├── AssistantMessage.vue
│   │       ├── UserMessage.vue
│   │       └── blocks/      # ToolCall, Reasoning, MemberRun,
│   │                        # WorkflowStep(s), WorkflowPause, Duration
│   ├── markdown/            # Markdown rendering pipeline
│   ├── layout/              # AppLayout
│   ├── sessions/            # Session sidebar, list item, pager
│   ├── config/              # Mode/entity/server configuration
│   └── icons/
├── constants/               # Role, RunEvent, RunStatus, StepStatus, ...
├── hooks/
│   ├── agno/                # Backend-facing singleton hooks and state machines
│   └── useAutoFocus.js, useCompName.js, usePerfTrack.js
├── utils/                   # SSE parser, storage, formatting, scroll, ...
├── views/                   # ChatView, SetupView
├── lang/                    # en / zh messages
├── plugins/                 # Composition API, constants, i18n, virtual scroller
├── router/
├── assets/styles/
├── App.vue
└── main.js
```

## How it works

### Startup and routing

`src/main.js` installs the plugins, router, and i18n. The router guard checks that a `serverUrl` is stored and that `ensureConnected()` succeeds; otherwise it redirects to `SetupView`. `ChatView` composes `AppLayout`, `SessionSidebar`, `ConfigPanel`, and `ChatInterface`.

### Sending a run

`useAgentRun.sendMessage()`:

1. Appends the user message and creates an `AbortController`.
2. POSTs the run request and reads the response body as a stream.
3. Feeds decoded chunks into `SSEParser` and dispatches each event.

Agent and team events are handled by the pure transitions in `runState.js`; workflow events (including nested agent/team events carrying `step_id`) are handled by `workflowState.js`. All run updates are immutable.

### Workflow pauses

`StepPaused`, `StepOutputReview`, and `StepExecutorPaused` store a `pausedRequirement` on the run. `WorkflowPauseBlock` renders the approval card and calls `continueRun()`. After a continue, Agno may mint a new `step_id`, so step resolution falls back to `step_name` + `step_index`.

### History reconstruction

`historyMapper.js` converts `/sessions/{id}/runs` into the same message/run structures used during streaming, including member runs, tool calls, and flattened workflow steps.

### Markdown pipeline

`marked` parses (after `remend` heals partial streaming Markdown), `DOMPurify` sanitizes, and `htmlparser2` builds an AST rendered by `NodeRenderer`. `TextNodeRenderer` appends to the existing text node instead of replacing it, preserving the selection while content streams in. Custom elements such as `<thinking>` are provided through `customComponents.js`.

### Scrolling and TOC

`StickToBottom` owns the pin-to-bottom behavior and observes content/container resizes, so it follows content that grows after Markdown finishes rendering. It stops following when the user scrolls away and resumes when they return to the bottom. `Toc` is presentational; `ChatInterface` derives outline items from user messages and computes the active item from real DOM positions.

## Development

- See [AGENTS.md](AGENTS.md) for architecture details, conventions, and common pitfalls.
- Unit tests cover the SSE parser, run/workflow state transitions, history mapping, formatting, sessions, and scrolling helpers.
- The UI was manually verified against a local Agno backend, including Agents, Teams, Workflows, pauses/continue, history loading, TOC navigation, session paging/deletion, and language switching.

## Limitations

- Vue 2 reached end-of-life; this project intentionally stays on Vue 2 for now but keeps its state logic framework-agnostic to ease a future migration.
- Workflow approvals currently support confirmation and output-review pauses. User-input and external-execution resolutions are shown as unsupported.
- Cancelling a run aborts the client request; the backend may continue processing.
- There is no authentication layer. Put the app and server behind your own access control.
- SSE requires a proxy that does not buffer the response body.

## References

- [Agno documentation](https://docs.agno.com/)
- [Agno Agent UI](https://github.com/agno-agi/agent-ui)
- [Agno Client](https://github.com/rodrigocoliveira/agno-client)
- [agno-deepseek example backend](https://github.com/ehehaye/agno-deepseek)

## License

MIT
