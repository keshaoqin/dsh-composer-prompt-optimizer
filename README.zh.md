# 提示词优化（dsh-composer-prompt-optimizer）

在 DeepSeek Harness 的输入框里常驻一个「优化提示词」按钮：点击后，用当前会话模型把草稿改写成更清晰、更具体、但仍保持原意与原语言的提示词；写入后按钮变成「回退原文」，随时可以恢复。

本插件基于 `outputs/` 中 WorkBuddy 5.7.7「增强提示词」的逆向分析与 `prompt-enhancer` 提示词资产构建，但使用 DeepSeek Harness 自己的插槽、模型服务和本地 HTTP 桥，不依赖 WorkBuddy。

![输入框中的优化按钮](docs/screenshot-composer.png)

![优化后变为回退原文](docs/screenshot-optimized.png)

## 功能

- **常驻输入框**：注册在 `conversation.input.right`，位于发送按钮之前的工具栏区域。
- **一键优化**：读取当前草稿，调用 Harness 的 `ctx.llm.stream()`，单轮、无工具、低温度改写。
- **一键回退**：优化成功后保存 `before` 快照；点击「回退原文」恢复。
- **手动编辑保护**：优化后如果你继续改草稿，快照自动失效，不会覆盖你的新输入。
- **取消与失败兜底**：请求中可点击「取消优化」；超时、模型错误或服务不可用时保留原文并显示可重试状态。
- **语言一致**：中文进中文出、英文进英文出，混合语言保持自然混合；不会输出语言标签。
- **不执行任务**：只改写提示词，不回答提示词里的问题，也不替用户做任务。
- **仅替换文本**：附件（图片/文件）保留在输入框的附件区；优化的是文本草稿。

## 安装

### 从本地目录安装（当前开发版）

```bash
# 在工作区根目录执行；target 指向本目录的绝对路径
dsh plugin --profile desktop add /绝对路径/dsh-composer-prompt-optimizer
```

或在 Harness 的插件管理器里使用「安装本地 bundle」，选择本目录。安装后重启一次 Harness。

### 从 npm 安装（发布后）

```bash
dsh plugin --profile desktop add dsh-composer-prompt-optimizer
# 指定版本
dsh plugin --profile desktop add dsh-composer-prompt-optimizer@0.1.0
```

## 使用

1. 在输入框里写下草稿，例如「帮我写个周报」。
2. 点击输入框右侧的「优化提示词」。
3. 等待约几秒，草稿会被替换为优化后的版本；按钮变为「回退原文」。
4. 直接发送，或点击「回退原文」恢复。
5. 如果你在优化后手动修改了草稿，按钮会回到「优化提示词」，避免误覆盖。

按钮状态：

| 状态 | 显示 | 点击行为 |
| --- | --- | --- |
| 空闲 | 优化提示词 | 开始优化 |
| 请求中 | 取消优化（转圈） | 中止请求，恢复原文 |
| 已优化 | 回退原文 | 恢复优化前的草稿 |
| 失败 | 重试 | 重新发起优化 |

## 配置

在插件条目的 `config` 中可以调整（默认值如下）：

```yaml
- id: prompt-optimizer
  name: 'dsh-composer-prompt-optimizer'
  config:
    temperature: 0.3      # 0–2，低温度更贴近原意
    maxTokens: 1024       # 64–8192
    timeoutMs: 60000      # 1s–300s
    # provider: deepseek  # 可选：覆盖默认 provider
    # model: deepseek-chat# 可选：覆盖默认 model
```

默认不写 `provider` / `model` 时，优先使用当前会话的模型选择；如果取不到，再使用 Harness 的 `agentDefaultModel`。

## 兼容性

- 需要 DeepSeek Harness `>= 0.2.0-rc.2`。
- 仅注册 Web 客户端（`dsh.client.platform: web`），桌面端与 Web GUI 均可用；纯 CLI 不显示按钮。
- 依赖 Harness 的标准客户端插槽 `conversation.input.right` 和标准输入动作 `setDraft`；不读取或修改其他插件的 DOM。

## 隐私与安全

- 插件不收集、不上传任何数据。
- 网络行为只有两类：浏览器请求本机 Harness 路由 `/prompt-optimizer/api/*`；Host 通过 Harness 的 `ctx.llm.stream()` 调用你已配置的模型服务。
- 不读取文件、不执行命令、不注册工具、不写入会话日志。
- 路由只绑定 Harness 的本地 Web 服务；部署在非回环地址时，请自行评估该部署的访问控制。

## 目录结构

```
dsh-composer-prompt-optimizer/
  package.json              # dsh.bundle + dsh.client 声明
  cordis.patch.yml          # 插入 Host 行
  index.js                  # Host：HTTP 路由、模型调用、输出清洗
  client.js                 # 浏览器：输入框按钮、状态机
  prompts/system-prompt.txt # 提示词优化器 system prompt
  locale/{zh,en}.json       # 插件市场标题/描述
  icon.svg
  docs/DESIGN.md            # 需求分析与架构说明
  docs/MARKETPLACE.md       # 公开市场索引条目模板
  PUBLISHING.md             # 发布到 npm / 插件市场的步骤
```

## 开发校验

```bash
node --check index.js
node --check client.js
node --test test/*.test.mjs
```

## License

MIT
