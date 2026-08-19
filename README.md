# Agno Vue

An Agno front-end UI interface built with Vue 2, providing a smooth user experience for AI agent interactions. The project is designed to support seamless migration to Vue 3.

## Features

- **Smart Conversation**: Interact with AI agents using natural language
- **Streaming Response**: Real-time display of AI responses
- **Session Management**: Create, switch, and manage multiple conversation sessions
- **Agent Switching**: Quickly switch between different AI agents
- **Code Highlighting**: Syntax highlighting for code blocks
- **Progressive Markdown Rendering**: Full support for Markdown formatting

## References

- [Agno Official Documentation](https://docs.agno.com/)
- [Agno Agent UI](https://github.com/agno-agi/agent-ui)
- [Agno Client](https://github.com/rodrigocoliveira/agno-client)

## Quick Start

### Prerequisites

- Ensure the backend Agno service is running on port 7777. If using DeepSeek, you can try [agno-deepseek](https://github.com/ehehaye/agno-deepseek)

### Install Dependencies

```bash
pnpm i
```

### Start Development Server

```bash
pnpm dev
```

The application will start at `http://localhost:5173` (port may vary based on configuration).

### Build for Production

```bash
pnpm build
```

Build artifacts will be output to the `dist/` directory.

## Feature Description

### Smart Conversation

Supports conversations with the Agno backend service, sending user messages and receiving AI responses.

### Streaming Response

Real-time streaming of response content via Server-Sent Events (SSE) or WebSocket, significantly enhancing user experience.

### Session Management

- Create new sessions
- Switch between historical sessions
- Delete sessions
- Session list display

### Agent Switching

Supports configuration and switching between different AI agents, each with unique capabilities and knowledge.
