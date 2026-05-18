# Agno Vue ElementUI

基于 Vue 2 + Element-UI 构建的 Agno 前端 UI 界面，提供流畅的 AI 智能体交互体验。

## 功能特性

- **模型对话**: 与 AI 智能体进行自然语言对话
- **流式输出**: 实时流式显示 AI 响应内容
- **会话管理**: 创建、切换和管理多个对话会话
- **Agent 切换**: 在不同智能体之间快速切换
- **代码高亮**: 支持代码块的语法高亮显示
- **Markdown 渲染**: 完整支持 Markdown 格式输出

## 技术栈

- **Vue 2**: 渐进式 JavaScript 框架
- **Element-UI**: 基于 Vue 2 的桌面端组件库
- **Axios**: HTTP 请求库
- **Markdown 渲染**: Markdown 解析和渲染

## 参考资料

- [Agno 官方文档](https://docs.agno.com/)
- [Agno Agent UI](https://github.com/agno-agi/agent-ui)
- [Agno Client](https://github.com/rodrigocoliveira/agno-client)

## 快速开始

### 安装依赖

```bash
pnpm i
```

### 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 启动（具体端口以实际配置为准）。

### 构建生产版本

```bash
pnpm dev
```

构建产物将输出到 `dist/` 目录。

## 主要功能说明

### 模型对话

支持与 Agno 后端服务进行对话，发送用户消息并接收 AI 响应。

### 流式输出

使用 Server-Sent Events (SSE) 或 WebSocket 实现响应内容的实时流式传输，提升用户体验。

### 会话管理

- 创建新会话
- 切换历史会话
- 删除会话
- 会话列表展示

### Agent 切换

支持配置和切换不同的 AI 智能体，每个智能体可拥有不同的能力和知识。

## 开发指南

## 注意事项

- 确保后端 Agno 服务已启动并可访问
