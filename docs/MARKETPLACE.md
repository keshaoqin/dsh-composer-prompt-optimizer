# 公开市场发布资料

本插件采用 DeepSeek Harness 的标准 bundle 形态：npm 包 + `dsh.bundle.patch` + `dsh.client`。发布 npm 包后，DSH 用户可以用 `dsh plugin --profile <profile> add dsh-composer-prompt-optimizer` 安装；社区索引（如 awesome-dsh-plugin / dsh-plugin-catalog）可收录它的条目。

## 1. 发布 npm 包

```bash
cd dsh-composer-prompt-optimizer
npm whoami
npm pack --dry-run
npm publish
```

发布前请把 `package.json` 里的作者、仓库、主页补成你的真实信息：

```json
{
  "author": "your-name",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-name/dsh-composer-prompt-optimizer.git"
  },
  "homepage": "https://github.com/your-name/dsh-composer-prompt-optimizer"
}
```

## 2. 社区索引条目模板（format-1）

向 awesome-dsh-plugin 等索引提交 PR/issue 时，使用下面这条（把 URL/作者替换成你的）：

```json
{
  "name": "dsh-composer-prompt-optimizer",
  "title": "your-name/dsh-composer-prompt-optimizer",
  "description": {
    "en": "A resident Optimize prompt / Revert button in the DSH composer. One click rewrites your draft with the current model while preserving intent and language; the original stays restorable.",
    "zh": "DSH 输入框常驻「优化提示词 / 回退原文」按钮：一键用当前模型改写草稿，保持原意与语言，原文随时可恢复。"
  },
  "homepage": "https://awesome-dsh-plugin.com/p/your-name/dsh-composer-prompt-optimizer/",
  "repository": {
    "url": "https://github.com/your-name/dsh-composer-prompt-optimizer"
  },
  "metadata": {
    "category": "ui",
    "keywords": ["prompt", "prompt-optimizer", "composer", "ui"],
    "labels": ["prompt", "composer"]
  },
  "versions": [
    {
      "version": "0.1.0",
      "publishTimestamp": 0,
      "source": { "type": "npm" },
      "engines": { "dsh": ">=0.2.0-rc.2" }
    }
  ]
}
```

> `publishTimestamp` 由索引方或脚本按 npm 发布时间填写；手动提交时留 0 或按索引说明填 Unix 秒。

## 3. 市场展示素材

- 标题：提示词优化 / Prompt Optimizer
- 一句话：输入框里的提示词改写按钮，优化后可一键回退。
- 分类：UI 增强（`ui`）
- 截图：
  - `docs/screenshot-composer.png`
  - `docs/screenshot-optimized.png`
- 最低 DSH 版本：`>= 0.2.0-rc.2`
- 平台：Web（桌面端 / Web GUI）

## 4. 安全声明（提交时附上）

- 不收集数据、不上传用户内容。
- 仅通过本地 Harness 路由 `/prompt-optimizer/api/*` 与 Harness 的 `ctx.llm.stream()` 调用用户已配置的模型服务。
- 不读文件、不执行命令、不注册模型工具、不写入会话日志。

## 5. 发布后验证

```bash
dsh plugin --profile desktop add dsh-composer-prompt-optimizer@latest
```

在真实页面确认：

1. 插件页显示「提示词优化」和原创图标；
2. 输入框右侧出现「优化提示词」；
3. 中文 / 英文 / 混排草稿分别保持语言；
4. 优化后「回退原文」可用；
5. 手动编辑后回退快照失效；
6. 失败时原文保留且可重试。
