# 公开市场发布资料

本插件采用 DeepSeek Harness 的标准 bundle 形态：npm 包 + `dsh.bundle.patch` + `dsh.client`。

## 当前发布状态（2026-11-11）

| 项目 | 状态 | 地址 |
| --- | --- | --- |
| npm 包 `0.1.2` | 已发布，`latest` 指向 `0.1.2` | https://www.npmjs.com/package/dsh-composer-prompt-optimizer |
| GitHub 仓库 | 公开，已加 `dsh-plugin` topic | https://github.com/keshaoqin/dsh-composer-prompt-optimizer |
| GitHub Release / tarball | 已发布 `v0.1.2`（`v0.1.0` 首发、`v0.1.1` 错误提示） | https://github.com/keshaoqin/dsh-composer-prompt-optimizer/releases/tag/v0.1.2 |
| GitHub Actions CI | 已通过 | 语法检查 + 12 项测试 + `npm pack --dry-run` |
| awesome-dsh-plugin 索引 | 待提交 PR | 见下方「社区索引」 |

安装命令（发布后）：

```bash
dsh plugin --profile desktop add dsh-composer-prompt-optimizer
```

> 注：npm 上还有一个 `0.0.0-stage` 占位版本，是首次使用 stage-only token 时由 npm 自动生成的。它不影响 `latest`（`latest` = `0.1.2`），但 `npm unpublish` 需要账号的一次性密码（OTP）；带 Bypass 2FA 的 token 按 npm 安全策略不能执行 unpublish。可保留不动。`0.1.2` 起优化严格使用输入框当前会话模型，用户默认会安装到该版本。

## 1. npm 发布记录

发布使用的账号：`muxiaoke`。作者、仓库、主页已写入 `package.json`：

```json
{
  "author": "muxiaoke",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/keshaoqin/dsh-composer-prompt-optimizer.git"
  },
  "homepage": "https://github.com/keshaoqin/dsh-composer-prompt-optimizer",
  "bugs": {
    "url": "https://github.com/keshaoqin/dsh-composer-prompt-optimizer/issues"
  }
}
```

发布命令（供后续版本复用）：

```bash
cd dsh-composer-prompt-optimizer
npm pack --dry-run
npm publish --access public
```

`package.json` 已声明 `publishConfig.access = public`。账号开启 2FA 时，需使用带 **Bypass 2FA** 且权限为 **Read and write**（不是 stage only）的 Granular Access Token。下面只是命令模板，`<YOUR_TOKEN>` 是占位符；真实 token 只保存在本机 `~/.npm-publish-token`（权限 600），**绝不写进仓库或任何文档**：

```bash
printf '%s' '<YOUR_TOKEN>' > ~/.npm-publish-token
chmod 600 ~/.npm-publish-token

# 用临时 npm 配置发布，不修改 ~/.npmrc
printf '//registry.npmjs.org/:_authToken=%s\n' "$(cat ~/.npm-publish-token)" > /tmp/npmrc
chmod 600 /tmp/npmrc
NPM_CONFIG_USERCONFIG=/tmp/npmrc npm publish --access public
rm -f /tmp/npmrc
```

## 2. 社区索引（awesome-dsh-plugin）

该索引的 README 由脚本生成，**不要手改 README**；投稿只需新增一个文件：

`data/plugins/keshaoqin__dsh-composer-prompt-optimizer.yml`

内容已准备好：[marketplace-entry.yml](marketplace-entry.yml)：

```yaml
url: https://github.com/keshaoqin/dsh-composer-prompt-optimizer
name: keshaoqin/dsh-composer-prompt-optimizer
category: ui
description:
  en: Adds a resident Optimize prompt / Revert button to the DSH composer, rewriting the draft with the current model while preserving intent and language.
  zh: 在 DSH 输入框常驻「优化提示词 / 回退原文」按钮，用当前模型改写草稿并保持原意与语言。
```

提交步骤：

1. Fork `LingHXiao/awesome-dsh-plugin`；
2. 新建分支，把上面这一个 YAML 文件放到 `data/plugins/`；
3. 提交 PR（一个 PR 最多 3 条，这里只有 1 条）；
4. 维护者人工审核后会合并，README 自动生成。

### 硬性限制：仓库需创建满 1 天

仓库创建于 `2026-11-11T03:41:17Z`（北京时间 11:41）。索引的 CI 会自动拒绝创建不足 1 天的仓库，因此：

> **最早可提交 PR 的时间：2026-11-12 11:41（Asia/Shanghai）之后。**

其他已满足的要求：

- `package.json` 声明 `dsh.bundle.patch` + `cordis.patch.yml` ✅
- 真实可运行代码（非占位/纯 README 仓库）✅
- 已发布到 npm（预构建安装，免 `allowBuilds`）✅
- 仓库已添加 `dsh-plugin` topic ✅
- 描述只陈述功能、无营销词、以句号结尾 ✅
- 未依赖任何第三方插件副本 ✅

贡献指南：https://github.com/LingHXiao/awesome-dsh-plugin/blob/main/contributing.md

## 3. 市场展示素材

- 标题：提示词优化 / Prompt Optimizer
- 分类：UI 增强（`ui`）
- 截图：
  - `docs/screenshot-composer.png`
  - `docs/screenshot-optimized.png`
- 最低 DSH 版本：`>= 0.2.0-rc.2`
- 平台：Web（桌面端 / Web GUI）

## 4. 安全声明（提交 PR 时附上）

- 不收集数据、不上传用户内容。
- 仅通过本地 Harness 路由 `/prompt-optimizer/api/*` 与 Harness 的 `ctx.llm.stream()` 调用用户已配置的模型服务。
- 不读文件、不执行命令、不注册模型工具、不写入会话日志。

## 5. 发布后验证

```bash
npm view dsh-composer-prompt-optimizer version
dsh plugin --profile desktop add dsh-composer-prompt-optimizer@latest
```

在真实页面确认：

1. 插件页显示「提示词优化」和原创图标；
2. 输入框右侧出现「优化提示词」；
3. 中文 / 英文 / 混排草稿分别保持语言；
4. 优化后「回退原文」可用；
5. 手动编辑后回退快照失效；
6. 失败时原文保留且可重试。
