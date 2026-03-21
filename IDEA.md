### 介绍
这个项目，我想基于pydantic-ai，ag-ui协议和antdv-next实现一个agent交互的demo。
需要有chat对话页面，session 管理，历史记录，tool工具调用，markdown渲染(table, graph等等)
提供多种展现方式，比如chatgpu那种完整的对话页面和弹窗助手那种(对话页面，也就是渲染层之类的应该可以共用，抽象为单独的组件)

### 技术

#### 后端
- Python
- pydantic-ai
- fastapi
- uv


#### 前端
- bunjs 作为js运行时和包管理器
- vue3
- ts
- vite
- antdv

### 要求
- 代码结构清晰
- 代码要规范
- 该封装的要封装
- 该拆分的要拆分

### 参考文档
- antdv-next： https://www.antdv-next.com/components/overview-cn
- pydantic-ai：https://ai.pydantic.dev
- pydantic-ai agui: https://ai.pydantic.dev/examples/ag-ui/
- ag-ui: https://docs.ag-ui.com/sdk/
- ag-ui github: https://github.com/ag-ui-protocol/ag-ui