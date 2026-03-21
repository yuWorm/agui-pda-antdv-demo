# AG-UI + pydantic-ai + antdv-next Agent 交互 Demo 设计文档

## 概述

基于 pydantic-ai、AG-UI 协议和 antdv-next 构建的 Agent 交互产品原型。支持 Chat 对话、Session 管理、历史记录、可插拔工具调用、全功能 Markdown 渲染，并提供三种展现方式：完整对话页面、浮动弹窗、侧边栏抽屉。

## 需求摘要

| 项目 | 决策 |
|------|------|
| 定位 | 产品原型，可能演化为正式产品 |
| LLM 模型 | 可配置多模型切换（OpenAI、国内模型等） |
| 工具系统 | 可插拔注册机制 + 演示工具（网络搜索、天气查询） |
| 数据存储 | SQLite + Repository 模式（可切换数据库） |
| Markdown | 全功能：代码高亮、Mermaid、LaTeX（markstream-vue） |
| 认证 | 用户名/密码登录，JWT，用户隔离 Session |
| 展现方式 | 完整对话页、浮动弹窗、侧边栏抽屉（共享渲染组件） |
| AG-UI 特性 | 流式对话、工具调用、Human-in-the-loop、共享状态 |
| 前端 AG-UI 对接 | Vue composable 适配 AG-UI TypeScript SDK |

## 技术栈

### 后端

- Python
- FastAPI
- pydantic-ai（Agent 框架 + AG-UI Adapter）
- SQLAlchemy（ORM + Repository 模式）
- SQLite（初始数据库）
- uv（包管理）
- Alembic（数据库迁移）
- bcrypt + PyJWT（认证）

### 前端

- Bun（JS 运行时 + 包管理器）
- Vue 3（Composition API）
- TypeScript
- Vite
- antdv-next（UI 组件库）
- Pinia（状态管理）
- AG-UI TypeScript SDK（协议解析）
- markstream-vue（流式 Markdown 渲染：Mermaid + KaTeX + Shiki）
- Axios（HTTP 客户端）

---

## 1. 系统整体架构

前后端分离，通过 AG-UI 协议通信。

### 通信方式

- 用户消息：前端 HTTP POST → 后端 AG-UI endpoint
- Agent 响应：后端 SSE 事件流 → 前端实时解析渲染

### 后端分层

- **API 层**：FastAPI 路由 + pydantic-ai AGUIAdapter
- **业务模块**：auth（认证）、chat（对话管理）、tools（工具管理）
- **Agent 层**：pydantic-ai Agent 实例 + 可插拔工具注册表
- **Core**：配置管理、中间件、依赖注入、模型提供商抽象
- **DB 层**：Repository 模式 + SQLAlchemy + SQLite

### 前端分层

- **Views / Features**：页面级组件（ChatPage、LoginPage、Assistant）
- **Components**：共享 UI 组件（ChatRenderer、MessageBubble、ToolCallCard、MarkdownViewer）
- **Composables**：AG-UI 适配（useAgui）、对话操作（useChat）、认证（useAuth）
- **Stores**：Pinia 状态管理（chatStore、authStore、settingsStore）
- **Services**：API 调用层（Axios 实例 + 拦截器）

### 核心数据流

1. 用户输入 → Vue composable（useAgui） → HTTP POST 到后端 AG-UI endpoint
2. 后端 AGUIAdapter 接收请求 → 调用 pydantic-ai Agent → 流式产生 AG-UI Events
3. Agent 执行中可能触发 Tool Call → 前端展示确认（HiL） → 用户确认 → 继续执行
4. SSE 事件流 → 前端解析 → 更新 Pinia Store → 驱动 UI 渲染

---

## 2. 后端架构详细设计

### 目录结构

```
backend/
├── pyproject.toml
├── alembic/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   └── middleware.py
│   ├── db/
│   │   ├── base.py
│   │   ├── repositories/
│   │   │   ├── base.py
│   │   │   ├── user.py
│   │   │   ├── session.py
│   │   │   └── message.py
│   │   └── models/
│   │       ├── user.py
│   │       ├── session.py
│   │       └── message.py
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   ├── chat/
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   └── tools/
│   │       ├── router.py
│   │       ├── service.py
│   │       └── schemas.py
│   └── agent/
│       ├── setup.py
│       ├── provider.py
│       ├── registry.py
│       └── tools/
│           ├── base.py
│           ├── weather.py
│           └── web_search.py
```

### 关键设计

#### 模型提供商抽象（agent/provider.py）

- `ModelProviderConfig` 包含 provider 名称、API key、base_url、model_name
- 支持配置文件或环境变量定义多个 provider
- 运行时可通过 API 切换当前 provider
- pydantic-ai 原生支持 OpenAI/Anthropic/Gemini；国内模型通过 OpenAI 兼容接口接入

#### 可插拔工具系统（agent/registry.py）

- `BaseTool` 统一接口：name、description、parameters_schema、execute()
- `ToolRegistry` 管理注册/注销，支持动态添加
- Agent 初始化时从 Registry 拉取工具，转换为 pydantic-ai @agent.tool 格式
- 每个工具声明是否需要 Human-in-the-loop 确认

#### Repository 模式（db/repositories/）

- `BaseRepository[T]` 泛型基类，提供 CRUD 通用方法
- 具体 Repository 继承基类，添加特定查询
- Service 层依赖 Repository 接口而非具体实现
- 切换数据库只需替换 Repository 实现 + engine 配置

#### AG-UI 集成（agent/setup.py）

- 使用 pydantic-ai 的 AGUIAdapter，通过 dispatch_request() 接入 FastAPI
- 挂载在 /api/agui 路由上
- 支持 RunAgentInput 中的 thread_id 关联 Session

#### 认证（modules/auth/）

- JWT：access_token + refresh_token
- 密码 bcrypt 哈希存储
- AG-UI endpoint 同样需要认证

---

## 3. 前端架构详细设计

### 目录结构

```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   └── settings.ts
│   ├── composables/
│   │   ├── useAgui.ts
│   │   ├── useChat.ts
│   │   ├── useAuth.ts
│   │   ├── useSessions.ts
│   │   └── useStream.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── chat.ts
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatRenderer.vue
│   │   │   ├── MessageList.vue
│   │   │   ├── MessageBubble.vue
│   │   │   ├── UserMessage.vue
│   │   │   ├── AssistantMessage.vue
│   │   │   ├── ToolCallCard.vue
│   │   │   ├── HilConfirm.vue
│   │   │   ├── MarkdownViewer.vue
│   │   │   └── ChatInput.vue
│   │   └── common/
│   │       ├── AppHeader.vue
│   │       ├── SessionList.vue
│   │       └── ModelSelector.vue
│   ├── features/
│   │   ├── chat/
│   │   │   └── ChatPage.vue
│   │   ├── auth/
│   │   │   ├── LoginPage.vue
│   │   │   └── RegisterPage.vue
│   │   └── assistant/
│   │       ├── FloatingButton.vue
│   │       ├── PopupChat.vue
│   │       └── DrawerChat.vue
│   ├── layouts/
│   │   ├── MainLayout.vue
│   │   └── AuthLayout.vue
│   └── types/
│       ├── chat.ts
│       ├── auth.ts
│       └── agui.ts
```

### 关键设计

#### ChatRenderer — 核心复用组件

三种展现方式共用同一个 ChatRenderer：

- **ChatPage.vue**：全屏布局，左侧 SessionList + 右侧 ChatRenderer
- **PopupChat.vue**：固定尺寸弹窗 + ChatRenderer
- **DrawerChat.vue**：antdv Drawer + ChatRenderer

ChatRenderer 接收 sessionId prop，内部通过 useChat(sessionId) 管理消息状态。

#### AG-UI 适配层（useAgui.ts）

```
AG-UI TS SDK（协议解析）
       ↓
useAgui.ts（Vue 适配层）
  - TEXT_MESSAGE_CONTENT → 追加到当前消息
  - TOOL_CALL_START → 创建 ToolCall 对象
  - STATE_SNAPSHOT → 更新共享状态
  - STEP_STARTED/FINISHED → 更新进度状态
       ↓
useChat.ts（业务逻辑）
  - 发送消息、停止生成、重试
  - 管理消息列表、流式状态
       ↓
Pinia Store（持久化状态）
  - sessions 列表、当前 sessionId
  - 跨组件状态共享
```

#### 流式消息渲染

- AssistantMessage.vue 接收持续更新的 content ref
- markstream-vue 实现 token 级别实时渲染（Mermaid + KaTeX + Shiki）
- 流结束后内容固化

#### 三种展现方式切换

- FloatingButton 全局挂载在 App.vue（登录后可见）
- 点击浮动按钮 → PopupChat（小窗）
- PopupChat 提供"展开"按钮 → DrawerChat（侧边栏）
- 导航到 /chat → ChatPage（完整页面）
- 三种模式共享同一 session，切换时对话不丢失
- FloatingButton 在 /chat 页面时隐藏

---

## 4. 数据模型设计

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 用户唯一标识 |
| username | VARCHAR(64) UNIQUE | 用户名 |
| hashed_password | VARCHAR(256) | bcrypt 哈希密码 |
| display_name | VARCHAR(128) | 显示名称 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### sessions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | Session 唯一标识（= AG-UI thread_id） |
| user_id | UUID (FK → users) | 所属用户 |
| title | VARCHAR(256) | 对话标题 |
| model_provider | VARCHAR(64) | 使用的模型提供商 |
| model_name | VARCHAR(128) | 使用的模型名称 |
| is_archived | BOOLEAN | 是否归档 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 最后活跃时间 |

### messages 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 消息唯一标识 |
| session_id | UUID (FK → sessions) | 所属对话 |
| role | ENUM('user','assistant','system','tool') | 消息角色 |
| content | TEXT | 消息内容（Markdown 原文） |
| tool_calls | JSON | 工具调用记录 |
| metadata | JSON | 扩展元数据（token 用量等） |
| created_at | TIMESTAMP | 创建时间 |
| ordering | INTEGER | 消息排序序号 |

### tool_definitions 表（可选）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 工具唯一标识 |
| name | VARCHAR(128) UNIQUE | 工具名称 |
| description | TEXT | 工具描述 |
| parameters_schema | JSON | 参数 JSON Schema |
| requires_confirmation | BOOLEAN | 是否需要 HiL 确认 |
| is_enabled | BOOLEAN | 是否启用 |
| created_at | TIMESTAMP | 创建时间 |

### 设计说明

- Session.id 直接作为 AG-UI 的 thread_id，无需额外映射
- tool_calls 使用 JSON 字段存储多个工具调用，避免额外关联表
- ordering 整数排序而非依赖 created_at，流式场景下更可靠
- AG-UI Shared State 为运行时概念，不持久化；如需回放可记录在 messages.metadata

---

## 5. AG-UI 协议集成与交互流程

### 事件映射

| AG-UI 事件 | 前端处理 | UI 效果 |
|------------|---------|---------|
| RUN_STARTED | 创建 assistant message 占位 | "思考中"加载动画 |
| TEXT_MESSAGE_START | 初始化内容 buffer | 气泡出现 |
| TEXT_MESSAGE_CONTENT | 追加 token | 实时渲染 |
| TEXT_MESSAGE_END | 固化消息 | 显示操作栏 |
| TOOL_CALL_START | 创建 ToolCall 对象 | ToolCallCard 出现 |
| TOOL_CALL_ARGS | 追加工具参数 | 参数实时更新 |
| TOOL_CALL_END | 标记完成 | 展示结果 |
| STATE_SNAPSHOT | 替换共享状态 | UI 更新 |
| STATE_DELTA | 合并增量状态 | 局部 UI 更新 |
| RUN_FINISHED | 结束 run | 恢复输入框 |
| RUN_ERROR | 错误处理 | 错误提示 + 重试 |

### Human-in-the-Loop 流程

1. 用户发送消息 → Agent 开始处理
2. Agent 需要调用标记为 requires_confirmation 的工具
3. 前端收到 TOOL_CALL_START → 展示 HilConfirm 组件（工具名、参数预览、允许/拒绝按钮）
4. 用户点击"允许" → AG-UI 协议回传确认
5. 后端执行工具 → 返回结果 → Agent 继续生成回复

### 共享状态使用场景

- 表单填充：Agent 根据对话帮用户填写表单
- 设置调整：Agent 建议并切换模型/主题
- 进度追踪：多步骤任务同步进度

前端实现：useAgui.ts 维护 `sharedState: Ref<Record<string, unknown>>`，STATE_SNAPSHOT 整体替换，STATE_DELTA 用 JSON merge patch 合并。

### 错误处理

| 场景 | 策略 |
|------|------|
| SSE 连接断开 | 自动重连（指数退避） |
| Agent 响应超时 | 60s 超时，允许取消或等待 |
| 工具执行失败 | ToolCallCard 显示错误，Agent 自行决策 |
| Token 过期 | 拦截器自动 refresh_token 刷新 |
| 模型 API 报错 | 透传错误，提示切换模型或重试 |

### 路由设计

| 路径 | 组件 | 布局 |
|------|------|------|
| /login | LoginPage | AuthLayout |
| /register | RegisterPage | AuthLayout |
| /chat | ChatPage（新对话） | MainLayout |
| /chat/:sessionId | ChatPage（已有对话） | MainLayout |

路由守卫：未登录重定向 /login，登录成功重定向 /chat。
