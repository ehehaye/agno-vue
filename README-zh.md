# Agno Vue

[English](./README.md)

基于 Vue 2 构建的 Agno 前端 UI 界面，为 AI 智能体交互提供流畅的用户体验。项目设计支持平滑迁移至 Vue 3 版本。

如果你正在使用 element-ui，我们提供了一个中文友好的 [element-ui 版本](https://github.com/ehehaye/agno-vue/tree/element-ui) 。

![预览](http://momos-image-upyun.test.upcdn.net/uPic/2026/05/18/jBDUXC.png)

## 功能特性

- **智能对话**: 与 AI 智能体进行自然语言交互
- **流式响应**: 实时展示 AI 回复内容
- **会话管理**: 创建、切换与管理多个对话会话
- **Agent 切换**: 在不同智能体之间快速切换
- **代码高亮**: 支持代码块语法高亮显示
- **Markdown 渲染**: 完整支持 Markdown 格式渲染

## 技术栈

- **Vue 2**: 渐进式 JavaScript 框架
- **Markdown 渲染**: Markdown 解析与渲染

## 参考资料

- [Agno 官方文档](https://docs.agno.com/)
- [Agno Agent UI](https://github.com/agno-agi/agent-ui)
- [Agno Client](https://github.com/rodrigocoliveira/agno-client)

## 快速开始

### 前置条件

- 确保后端 Agno 服务已启动在 7777 端口。若使用 DeepSeek，可尝试使用 [agno-deepseek](https://github.com/ehehaye/agno-deepseek)

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
pnpm build
```

构建产物将输出到 `dist/` 目录。

## 功能说明

### 智能对话

支持与 Agno 后端服务进行对话，发送用户消息并接收 AI 响应。

### 流式响应

通过 Server-Sent Events (SSE) 实现响应内容的实时流式传输，显著提升用户体验。

### 会话管理

- 创建新会话
- 切换历史会话
- 删除会话
- 会话列表展示

### Agent 切换

支持配置与切换不同的 AI 智能体，每个智能体具备不同的能力和知识。
