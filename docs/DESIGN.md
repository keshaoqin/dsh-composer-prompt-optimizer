# 需求分析与设计：DSH 输入框提示词优化按钮

日期：2026-11-11
状态：v1 设计已落地为实现
证据目录：`outputs/`

> 说明：工作区中未找到名为 `outputs/数据` 的目录；实际可用的数据是 `outputs/` 下的 WorkBuddy 逆向报告、逐字提示词和 `prompt-enhancer` 技能资产。本设计以这份数据为准。

## 1. 证据与结论

### 1.1 WorkBuddy「增强提示词」逆向报告

`outputs/workbuddy-prompt-enhancement-reverse-engineering.md` 的核心结论：

- 功能不是本地规则拼接，而是把用户输入包进固定的改写模板，调用同一条 sidecar LLM 通道。
- `enhance-prompt` 子代理：无工具、`maxTurns=1`、跳过权限、单次纯文本补全。
- system prompt + user 模板两层；语言一致是最高优先级；只输出改写结果。
- 交互契约：最小触发长度 1、只替换文本块、清理零宽空格、保存 `before/after` 快照、支持取消、用户手动编辑后做分歧检测、失败保留原文。
- 本机 113 次真实运行；使用快模型（`glm-5.3-flash`、`deepseek-v4.1-flash`、`kimi-k3-1`、`hy3`、`hy4-preview`），不是旗舰模型。

### 1.2 WorkBuddy 逐字提示词

`outputs/workbuddy-verbatim-prompts.md` 提供了可直接对照的两层模板：

- 角色：Prompt Engineering Expert，面向写代码的 AI 助手。
- 分析流程：识别目标 → 找歧义/缺口 → 评估清晰度 → 检查缺失上下文。
- 改写原则：清晰具体、补必要上下文、明确参数与约束、规定输出格式、加相关示例、匹配语气、去冗余。
- 禁止项：不主动要指南/代码、不引入用户没提过的技术、讲 WHAT 不讲 HOW、不回答问题。
- 语言一致性最高优先级；只输出改写结果。
- 新版模板删掉 800 字符上限，改为「完整且简洁 + 禁止悬空结尾」。

### 1.3 `prompt-enhancer` 技能资产

`outputs/prompt-enhancer/` 已经把上述结论整理成可移植资产：

- `references/system-prompt.txt`：本插件直接采用的 system prompt。
- `references/agent-prompt.md`：注册元数据与调用契约。
- `references/integration.md`：HTTP/函数调用接入方式、平台映射、测试清单。
- `scripts/enhance_prompt.py`：无依赖参考客户端，包含输入/输出清洗契约。

本插件采用该技能的系统提示词，而不是复制 WorkBuddy 的全部新旧模板，原因是：

1. 它已经是针对「不要过度扩写、不要添加未要求内容」修补后的版本；
2. 它自包含、模型无关，便于公开市场分发；
3. 它的输出契约与本项目要实现的「直接替换 + 回退」一致。

## 2. 需求拆解

从用户原话「常驻在 DeepSeek harness 输入框中的提示词优化按钮，可以对提示词进行优化，同时也可以回退」以及证据，拆成以下验收点：

| # | 需求 | 验收标准 |
| --- | --- | --- |
| R1 | 常驻输入框 | 打开任意会话，输入框工具栏出现按钮；不需要打开面板或输入命令 |
| R2 | 一键优化 | 点击后读取当前草稿并调用模型；成功后草稿被替换 |
| R3 | 可回退 | 优化成功后按钮变为「回退原文」；点击恢复优化前文本 |
| R4 | 语言一致 | 中文、英文、混排输入分别得到同语言/同混排的输出 |
| R5 | 不改意图 | 只把「要什么」说得更明确，不回答提示词里的问题，不引入用户没提的技术 |
| R6 | 失败不阻塞 | 空输入、超时、模型错误、服务不可用均保留原文，并给出可重试状态 |
| R7 | 手动编辑保护 | 优化后用户继续编辑，按钮回到空闲，回退不会覆盖新输入 |
| R8 | 可取消 | 请求中点击按钮可中止，原文不变 |
| R9 | 可发布 | 有 npm 包结构、`dsh.bundle`、`dsh.client`、locale、icon、README、LICENSE、发布清单 |

## 3. 方案比较

### 方案 A：纯客户端调用外部 API

- 优点：实现简单，浏览器直接 `fetch` 第三方接口。
- 缺点：需要用户配置 API Key；密钥暴露在浏览器；与 Harness 的模型选择/计费/代理脱节；公开市场安装后不可用。
- 结论：不采用。

### 方案 B：Host 插件 + 本地 HTTP 路由 + `ctx.llm.stream()`

- 优点：复用 Harness 已配置的模型与凭据；客户端只做 UI；没有浏览器密钥；与 Harness 的 provider 路由一致；可通过 `webServer` 路由调试。
- 缺点：需要 Host/Client 两半；路由需要处理超时、取消和错误。
- 结论：**采用**。

### 方案 C：动态 Cordis 包 + `host.call`

- 优点：不需要 HTTP 路由，Client 与 Host 私有 RPC。
- 缺点：动态包是 session 级、进程内、重启消失；不适合作为可持久安装、可发布到市场的插件；且需要审批/运行流程。
- 结论：不采用。

## 4. 架构

```text
┌─────────────────────────────── DeepSeek Harness Web UI ───────────────────────────────┐
│  conversation.input.right slot                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ PromptOptimizerButton (client.js)                                                │  │
│  │  useInput -> draft / phase / draftRev                                             │  │
│  │  inputActions.setDraft(text)                                                      │  │
│  │  state: idle | loading | done(before, after) | error                              │  │
│  └───────────────────────────────┬──────────────────────────────────────────────────┘  │
│                                  │ POST /prompt-optimizer/api/enhance                  │
└──────────────────────────────────┼─────────────────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────── Host (index.js) ────────────────────────────────────────┐
│  ctx.webServer.register({ kind:'prefix', path:'/prompt-optimizer/api', handler })       │
│  handler: read JSON -> cleanInput -> resolveSelection -> ctx.llm.stream(...)            │
│           -> collect text-delta -> cleanOutput -> JSON { ok, text }                     │
│  timeout / abort / error mapping                                                       │
└──────────────────────────────────┬─────────────────────────────────────────────────────┘
                                   ▼
                     Harness `llm` service + registered provider
                     (current session model or agentDefaultModel)
```

### 4.1 客户端

- 注册点：`conversation.input.right`，`id: prompt-optimizer`，`order: 5`。
- 标准 props：`useInput`、`inputActions`、`useProjection`、`sessionId`。
- 读取：
  - `input.draft`：当前草稿文本
  - `input.phase`：当前输入阶段，非 `plain` 时禁用
  - `input.draftRev`：用于请求期间的分歧检测
  - `modelSelection` projection：当前会话模型（`next` 或 `lastUsed`）
- 写入：`inputActions.setDraft(text)`（宿主语义为整框替换、光标置尾）。
- 状态机：

```text
idle --click--> loading --success--> done(before, after)
  ^                |                    |
  |                |--cancel/error----->| idle / error
  |                |                    |
  +----revert------+<-------------------+
```

- 手动编辑：
  - `done` 时若 `input.draft !== after` → 回到 `idle`（快照丢弃）。
  - `loading` 时若 `input.draft !== baseDraft` → abort，回到 `idle`。
- 按钮文案：`优化提示词` / `取消优化` / `回退原文` / `重试`。
- 本地化：通过 `ctx.locale.register()` 注册 `promptOptimizer` 命名空间（zh/en）；所有可见文案走 `ctx.locale.bind()`，不在组件里硬编码。

### 4.2 Host

- 路由前缀：`/prompt-optimizer/api`。
- `GET /health`：返回插件版本、是否有 `llm`、当前解析到的模型。用于调试和安装后自检。
- `POST /enhance`：
  - 请求：`{ text, provider?, model?, reasoningEffort? }`
  - 响应成功：`{ ok:true, text, provider, model, elapsedMs }`
  - 响应失败：`{ ok:false, error:{ code, message } }`
- 模型解析优先级：请求指定的 provider/model → 插件 config → `ctx.agentDefaultModel.currentSelection()`。
- 模型调用：`ctx.llm.stream({ provider, model, system, messages:[{role:'user',content:[{type:'text',text}]}], temperature, maxTokens, signal })`。
- 不传 `tools`、不传历史、不传 session 日志；单轮补全。
- 输出清洗：去零宽/BOM → trim → 去成对包裹引号 → 去包裹代码围栏 → 空结果视为 `empty_result`。
- 错误码：`empty_input`、`input_too_long`、`bad_request`、`unavailable`、`no_model`、`timeout`、`model_error`、`empty_result`、`cancelled`、`unknown`。
- 超时：默认 60s，可配置；请求关闭时 abort 模型流。

### 4.3 提示词

`prompts/system-prompt.txt` 是 `outputs/prompt-enhancer/references/system-prompt.txt` 的原样拷贝，核心约束：

- 只改写，不执行任务；
- 语言一致性最高优先级；
- 不添加用户没提的技术、事实、要求；
- 不添加澄清步骤/确认请求/额外交付物；
- 输出纯文本，无解释、无围栏、无引号；
- 不得以未完成列表、悬空连词、冒号结尾。

用户消息就是草稿本身，不额外拼接 `{input}` 模板，避免重复语言规则和示例导致模型过度扩写。

## 5. 关键设计决策

| 决策 | 选择 | 理由 |
| --- | --- | --- |
| 替换方式 | 直接替换 + 回退快照 | 复刻 WorkBuddy 主交互，最少点击；原文始终可恢复 |
| 触发 | 显式按钮 | 不在每次输入时调用，避免打扰与费用 |
| 模型 | 当前会话模型，回退默认模型 | 与用户预期一致，避免另建模型配置 |
| 提示词 | 采用 `prompt-enhancer` 系统提示词 | 已针对「过度扩写」修补，且可移植 |
| 文本范围 | 只替换文本 | 附件不动；引用 chip 可能展平（已在 README 说明） |
| 错误 | 非阻塞 + 可重试 | 绝不影响发送；失败保留原文 |
| 发布 | npm 包 + `dsh.bundle` + `dsh.client` | 与 DSH 插件市场安装方式一致 |

## 6. 失败与边界

1. **空草稿**：按钮禁用；若通过代码触发，返回 `empty_input`。
2. **模型未配置**：返回 `no_model`，按钮显示重试与提示。
3. **超时**：Host 60s abort，返回 504 `timeout`；客户端显示「优化超时，请重试」。
4. **用户取消**：客户端 abort fetch；Host 检测 res close 后 abort 模型流；原文不变。
5. **用户手动编辑**：`loading` 或 `done` 状态都会检测并丢弃快照；不会覆盖新内容。
6. **多会话切换**：slot 是 session scope；组件卸载时 abort；不同会话状态不串。
7. **输入很长**：Host 限制 30,000 字符，避免一次请求过大；超限返回 `input_too_long`。
8. **非 plain 阶段**：输入框正在发送/锁定时禁用按钮。

## 7. 测试计划

### 7.1 单元测试

- `cleanInput`：去零宽、trim、空输入、超长输入。
- `cleanOutput`：去引号、去代码围栏、空结果抛错、正常文本不变。
- `normalizeConfig`：默认值、范围钳制。
- `resolveSelection`：请求覆盖、config 覆盖、默认值回退。

### 7.2 Host 集成

- 安装后 `GET /prompt-optimizer/api/health` 返回 `ok:true` 与模型信息。
- `POST /enhance` 中文/英文/混排各一次，验证语言与内容。
- 空 text 返回 `empty_input`；错误 model 返回 `model_error` 或 `no_model`。
- 客户端断开后 Host abort 流，不写入任何会话记录。

### 7.3 UI 验收

- 输入框右侧出现按钮（`conversation.input.right` occupant）。
- 输入「做个网站」点击优化 → 草稿变化 → 按钮「回退原文」。
- 点击回退 → 恢复原文。
- 优化后手动输入字符 → 按钮回到「优化提示词」。
- 请求中点击「取消优化」→ 原文不变。
- 空输入时按钮禁用。
- 中英文 locale 下按钮文案正确。
- 窄屏容器查询下只显示图标（仍可点击）。

## 8. 公开市场准备

- 包名：`dsh-composer-prompt-optimizer`（发布前用 `npm view` 检查）。
- `package.json`：`dsh.bundle.patch`、`dsh.client.platform=web`、`dsh.engines.dsh`、`publishConfig.access=public`。
- 资源：`locale/{en,zh}.json`、`icon.svg`、README（中/英）、LICENSE、CHANGELOG、PUBLISHING。
- 安装路径：`dsh plugin --profile desktop add dsh-composer-prompt-optimizer`。
- 市场条目：标题、描述、分类、截图、版本、最低 DSH 版本。
- 安全声明：不收集数据、不读文件、不执行命令、仅本地路由 + 模型服务。

## 9. 后续迭代

- 预览模式（优化前先对比，确认后替换）。
- 快捷键（如 `Cmd/Ctrl+Shift+E`）。
- 选区优化（只改写选中的一段）。
- 自定义提示词模板/风格（简洁、详细、结构化）。
- 多语言 UI 扩展到 ja/es/fr/de/ru/pt。
- 端到端截图与市场页面素材。
