# 发布指引：npm 与 DSH 插件市场

本文件说明这个插件**实际**要发到哪两个地方、每一步需要什么、如何验证。

- 产出物：`dsh-composer-prompt-optimizer@0.2.0`
- GitHub：https://github.com/keshaoqin/dsh-composer-prompt-optimizer
- npm：https://www.npmjs.com/package/dsh-composer-prompt-optimizer
- 插件市场：https://github.com/LingHXiao/awesome-dsh-plugin

---

## 一、需要准备的信息与配置

| 项 | 值 | 说明 |
| --- | --- | --- |
| 包名 | `dsh-composer-prompt-optimizer` | 已被本仓库占用；不要改成 `dsh-prompt-optimizer`（已存在同名包） |
| 作者 | `muxiaoke` | 写在 `package.json` 的 `author` |
| 仓库 | `https://github.com/keshaoqin/dsh-composer-prompt-optimizer` | `repository` / `homepage` / `bugs` |
| 分类 | `ui` | 市场条目的 `category` |
| 最低 DSH 版本 | `>=0.2.0-rc.2` | `package.json` 的 `dsh.engines.dsh` |
| npm 账号 | `muxiaoke` | 需要发布权限 |
| npm Token | 本机 `~/.npm-publish-token`（600） | **Bypass 2FA + Read and write**，不能是 stage only |
| GitHub 账号 | `keshaoqin` | 需 `repo` 权限；提交市场 PR 需要 fork 权限 |

`package.json` 里已声明的关键字段：

```json
{
  "name": "dsh-composer-prompt-optimizer",
  "version": "0.2.0",
  "author": "muxiaoke",
  "license": "MIT",
  "publishConfig": { "access": "public" },
  "repository": { "type": "git", "url": "git+https://github.com/keshaoqin/dsh-composer-prompt-optimizer.git" },
  "homepage": "https://github.com/keshaoqin/dsh-composer-prompt-optimizer",
  "bugs": { "url": "https://github.com/keshaoqin/dsh-composer-prompt-optimizer/issues" },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web", "immediately": true, "inject": ["@deepseek-ai/dsh-client-ui-conversation"] },
    "engines": { "dsh": ">=0.2.0-rc.2" }
  }
}
```

---

## 二、发布到 GitHub

```bash
cd '/Users/ksq/Documents/项目/DSH 插件/prompt 优化/dsh-composer-prompt-optimizer'

node --check index.js && node --check client.js
node --test test/*.test.mjs          # 16 项通过
npm pack --dry-run                   # 确认打包清单

git add -A
git commit -m 'docs: rewrite README (zh/en) around real design and effect; v0.2.0'
git push origin main

git tag -a v0.2.0 -m 'v0.2.0 — documentation rewrite'
git push origin v0.2.0

# 发布 Release 并附上 tarball，市场条目会用它做预构建安装
T=$(npm pack --silent)
gh release create v0.2.0 --title 'v0.2.0 — Documentation rewrite' \
  --notes 'Rewrote the Chinese and English README around the real implementation: design, prompt construction, real before/after effect with latency, full error-code table, install/use, and the two publishing steps. No runtime change from 0.1.2.' \
  "$T"
rm -f "$T"
```

需要的配置：`gh auth status` 显示已登录 `keshaoqin`；本仓库已添加 `dsh-plugin` topic。

---

## 三、发布到 npm

```bash
cd '/Users/ksq/Documents/项目/DSH 插件/prompt 优化/dsh-composer-prompt-optimizer'

# 用临时 npm 配置读取本机 token，不污染 ~/.npmrc
printf '//registry.npmjs.org/:_authToken=%s\n' "$(cat ~/.npm-publish-token)" > /tmp/npmrc
chmod 600 /tmp/npmrc

NPM_CONFIG_USERCONFIG=/tmp/npmrc npm whoami                 # muxiaoke
NPM_CONFIG_USERCONFIG=/tmp/npmrc npm publish --access public

rm -f /tmp/npmrc
```

发布后 npm 有约 **1–3 分钟**处理延迟，用下面的命令确认：

```bash
curl -s 'https://registry.npmjs.org/dsh-composer-prompt-optimizer?t='$(date +%s) \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["dist-tags"], list(d["versions"]))'
```

**注意**：
- 带 Bypass 2FA 的 Granular token 不能执行 `unpublish`/`deprecate`（npm 安全策略），这些操作需要 OTP；
- 必须同一版本号不能重复发布，改内容要升版本。

---

## 四、发布到 DSH 插件市场（awesome-dsh-plugin）

### 4.1 市场收录规则（已逐条核对）

| 规则 | 本插件状态 |
| --- | --- |
| `package.json` 声明 `dsh.bundle`（可安装的必要条件） | ✅ |
| 仓库有真实可用代码，非占位/纯 README | ✅ 含 Host + Client + 提示词 + 测试 |
| 仓库创建满 **1 天** | ✅ 创建于 2026-11-11T03:41:17Z |
| 已发布 npm（或提供 tarball） | ✅ 两者都有 |
| 仓库添加 `dsh-plugin` topic | ✅ |
| 描述只陈述功能、不含营销词、以句号结尾 | ✅ |
| 一个 PR 最多 3 条 | ✅ 本 PR 只有 1 条 |
| 与已有条目不重复 | ✅ 现有两条均为「预览确认式 / 场景诊断式」，本插件是「就地替换 + 回退 + 可解释失败」，实现不同 |

### 4.2 条目文件（唯一需要提交的内容）

路径：`data/plugins/keshaoqin__dsh-composer-prompt-optimizer.yml`

内容（与 [marketplace-entry.yml](marketplace-entry.yml) 一致）：

```yaml
url: https://github.com/keshaoqin/dsh-composer-prompt-optimizer
name: keshaoqin/dsh-composer-prompt-optimizer
category: ui
tarball: https://github.com/keshaoqin/dsh-composer-prompt-optimizer/releases/download/v0.2.0/dsh-composer-prompt-optimizer-0.2.0.tgz
description:
  en: "A resident Optimize / Revert button in the DSH composer: one click rewrites the draft with the model selected in that composer, keeps the original restorable, and explains any failure with a cause, an error code and how to recover."
  zh: "DSH 输入框常驻「优化提示词 / 回退原文」按钮：用输入框当前选中的模型就地改写草稿，原文随时可回退，失败时说明原因、错误码与处理办法。"
```

> 描述中含「冒号 + 空格」时必须加引号，上面已用双引号。

### 4.3 提交 PR

```bash
# 1) fork 并克隆
gh repo fork LingHXiao/awesome-dsh-plugin --clone --remote
cd awesome-dsh-plugin

# 2) 基于 main 建分支
git checkout -b add/keshaoqin-dsh-composer-prompt-optimizer

# 3) 写入条目文件（内容见 4.2）
mkdir -p data/plugins
$EDITOR data/plugins/keshaoqin__dsh-composer-prompt-optimizer.yml

# 4) 本地自检（可选）
npm ci && node scripts/generate-readme.mjs   # 只做预览，不提交 README

# 5) 只提交这一个文件
git add data/plugins/keshaoqin__dsh-composer-prompt-optimizer.yml
git commit -m 'Add keshaoqin/dsh-composer-prompt-optimizer'
git push -u origin add/keshaoqin-dsh-composer-prompt-optimizer

# 6) 开 PR
gh pr create --repo LingHXiao/awesome-dsh-plugin \
  --title 'Add keshaoqin/dsh-composer-prompt-optimizer' \
  --body 'Adds dsh-composer-prompt-optimizer: a resident Optimize / Revert button in the DSH composer.

- Rewrites the draft with the model selected in that composer (never a plugin-owned model or key)
- Keeps the original restorable; invalidates the snapshot on manual edit
- Explains failures with a cause, error code, model and a recovery hint
- Native prompt in `prompts/system-prompt.txt` (language match, no invented scope, no answering the task)
- Published on npm: https://www.npmjs.com/package/dsh-composer-prompt-optimizer
- Prebuilt tarball attached to the v0.2.0 release

CI checks: dsh.bundle present, repo >1 day old, real code, dsh-plugin topic, description accurate.'
```

### 4.4 评审要点（提前准备）

维护者会读仓库并核对描述。本插件可核对的点：

1. `index.js` 确实只调用 `ctx.llm.stream()`，无自带密钥 → 描述中「使用输入框所选模型」属实；
2. `client.js` 的 `conversation.input.right` 注册与 `setDraft` 回退 → 「常驻输入框 + 可回退」属实；
3. `ERROR_HINTS` 与 `classifyFailure` → 「失败时说明原因、错误码与处理办法」属实；
4. `test/*.test.mjs` 16 项通过 → 有真实测试；
5. 分类 `ui`：这是输入框 UI 增强。

---

## 五、发布后验证

```bash
# npm
npm view dsh-composer-prompt-optimizer version dist-tags

# 安装试用
dsh plugin --profile desktop add dsh-composer-prompt-optimizer@0.2.0

# 插件健康检查（端口以你的 Harness 为准）
curl -s http://127.0.0.1:<port>/prompt-optimizer/api/health
```

真实页面应确认：

1. 插件页显示「提示词优化」与原创图标；
2. 输入框右侧出现「优化提示词」；
3. 中/英/混排草稿分别保持语言；
4. 优化后「回退原文」可用；手动编辑后回到「优化提示词」；
5. 模型限流时弹出可读错误气泡，且不遮挡输入框。

---

## 六、版本规则

- 文案、文档、样式 → patch（`0.2.x`）
- 新增交互（预览、快捷键、选区优化）→ minor（`0.3.0`）
- 改路由/配置/数据契约 → major（0.x 阶段可在 CHANGELOG 备注）

发布新版必须：改 `package.json` 的 `version` → 更新 `CHANGELOG.md` → 打 tag → 建 Release（附新 tarball）→ `npm publish` → 市场条目里的 `tarball` 指向新 Release。
