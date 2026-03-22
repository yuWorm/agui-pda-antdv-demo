# AG-UI + Pydantic AI + Ant Design Vue Demo

基于 [AG-UI](https://docs.ag-ui.com/sdk/) 协议、[Pydantic AI](https://ai.pydantic.dev) 和 [Ant Design Vue Next](https://www.antdv-next.com/components/overview-cn) 构建的 AI Agent 交互演示项目。

## 功能特性

- **多轮对话** — 支持流式输出、Markdown 渲染（表格、代码块等）
- **会话管理** — 创建 / 切换 / 删除会话，自动生成会话标题，完整历史记录
- **工具调用** — Weather、Web Search 等工具，支持人机确认（Human-in-the-Loop）
- **多模型支持** — OpenAI / Anthropic / Google / Groq / OpenRouter，可在界面切换
- **思维链展示** — 展示模型推理过程（Thinking Block）
- **文件上传** — 支持图片、PDF、文本等文件作为对话附件
- **多种交互形式** — 完整对话页面、弹窗助手、抽屉式助手
- **用户认证** — 注册 / 登录，JWT (access + refresh token)
- **深色模式** — 跟随系统或手动切换明暗主题

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 · TypeScript · Vite · Pinia · Vue Router · Ant Design Vue Next |
| AI 客户端 | @ag-ui/client · markstream-vue |
| 后端 | Python 3.12+ · FastAPI · Uvicorn · Pydantic AI · AG-UI Adapter |
| 数据库 | SQLAlchemy 2 (async) · aiosqlite (SQLite) |
| 认证 | PyJWT · bcrypt |

## 项目结构

```
├── frontend/                 # Vue 3 前端
│   └── src/
│       ├── components/       # 通用 & 聊天组件
│       ├── composables/      # useAgui · useChat · useSessions · useAuth
│       ├── features/         # 页面级功能 (auth / chat / assistant)
│       ├── layouts/          # 主布局 · 认证布局
│       ├── router/           # 路由配置
│       ├── services/         # Axios API 封装
│       ├── stores/           # Pinia 状态管理
│       ├── styles/           # 全局样式 & 主题变量
│       └── types/            # TypeScript 类型定义
│
├── backend/                  # FastAPI 后端
│   └── app/
│       ├── agent/            # Pydantic AI Agent · AG-UI Adapter · 工具注册
│       ├── core/             # 配置 · 依赖注入 · 安全
│       ├── db/               # 模型 · 仓库层
│       └── modules/          # 业务模块 (auth / chat / tools / upload)
```

## 快速开始

### 环境要求

- Python >= 3.12，推荐使用 [uv](https://docs.astral.sh/uv/)
- Node.js >= 18 或 [Bun](https://bun.sh/)

### 1. 后端

```bash
cd backend

# 复制并编辑环境变量
cp .env.example .env
# 编辑 .env，填入 MODEL_PROVIDERS_JSON 中的 API Key

# 安装依赖并启动
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

`.env` 关键配置项：

```env
DEBUG=true
DATABASE_URL=sqlite+aiosqlite:///./data/agui_demo.db
JWT_SECRET_KEY=change-me-in-production
DEFAULT_MODEL_PROVIDER=openai
DEFAULT_MODEL_NAME=gpt-4o
MODEL_PROVIDERS_JSON={"openai": {"api_key": "sk-xxx", "base_url": null}}
```

`MODEL_PROVIDERS_JSON` 支持配置多个 Provider：

```json
{
  "openai": { "api_key": "sk-xxx", "base_url": null },
  "anthropic": { "api_key": "sk-ant-xxx", "base_url": null },
  "google": { "api_key": "AIza-xxx", "base_url": null }
}
```

### 2. 前端

```bash
cd frontend

# 使用 bun（推荐）
bun install
bun run dev

# 或使用 npm
npm install
npm run dev
```

前端开发服务器默认运行在 `http://localhost:5173`，`/api` 请求自动代理到后端 `http://localhost:8000`。

### 3. 访问

打开浏览器访问 `http://localhost:5173`，注册账号后即可开始对话。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| GET | `/api/auth/me` | 当前用户信息 |
| GET | `/api/chat/sessions` | 会话列表 |
| POST | `/api/chat/sessions` | 创建会话 |
| DELETE | `/api/chat/sessions/{id}` | 删除会话 |
| GET | `/api/chat/sessions/{id}/messages` | 消息历史 |
| POST | `/api/chat/sessions/{id}/messages` | 保存消息 |
| POST | `/api/chat/sessions/{id}/title` | 生成会话标题 |
| POST | `/api/agui` | AG-UI Agent 端点（SSE 流式） |
| POST | `/api/tools/execute` | 工具执行 |
| POST | `/api/upload` | 文件上传 |
| GET | `/health` | 健康检查 |

## 开发

```bash
# 后端测试
cd backend
uv run pytest

# 后端代码检查
uv run ruff check .

# 前端类型检查 & 构建
cd frontend
bun run build
```

## 参考文档

- [Ant Design Vue Next](https://www.antdv-next.com/components/overview-cn)
- [Pydantic AI](https://ai.pydantic.dev)
- [Pydantic AI — AG-UI 示例](https://ai.pydantic.dev/examples/ag-ui/)
- [AG-UI SDK](https://docs.ag-ui.com/sdk/)
- [AG-UI GitHub](https://github.com/ag-ui-protocol/ag-ui)

## License

MIT
