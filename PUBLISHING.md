# 发布清单（Publishing checklist）

本文件随包发布，供维护者参考。

## 1. 发布前检查

```bash
cd dsh-composer-prompt-optimizer
node --check index.js
node --check client.js
node --test test/*.test.mjs

# 验证插件能装、能显示、能优化、能回退
# 安装到 desktop profile 后用真实页面走一遍：
#   输入「做个网站」→ 优化 → 回退
```

确认：

- `package.json` 的 `name`、`version`、`description`、`keywords` 正确。
- `locale/en.json` 和 `locale/zh.json` 的 `meta.title` / `meta.description` 不包含模板占位文本。
- `icon.svg` 为原创或可再分发素材，且小于 256 KiB。
- `files` 覆盖所有运行文件：`index.js`、`client.js`、`prompts/system-prompt.txt`、`cordis.patch.yml`、`locale/*.json`、`icon.svg`、`docs/*.png`。
- `npm pack --dry-run` 输出没有把 `test/`、`_research/`、`.DS_Store` 打进去。

## 2. 检查包名是否可用

```bash
npm view dsh-composer-prompt-optimizer
# 404 表示可用；如果已有版本，请改包名（如 @your-scope/dsh-composer-prompt-optimizer）
```

## 3. 本地打包和试装

```bash
npm pack --dry-run   # 只看清单
npm pack             # 生成 dsh-composer-prompt-optimizer-0.1.1.tgz
dsh plugin --profile desktop add /absolute/path/to/dsh-composer-prompt-optimizer-0.1.1.tgz
```

## 4. 发布到 npm

```bash
npm whoami           # 确认登录的是自己的账号
npm publish          # package.json 已声明 publishConfig.access = public
```

如果包名带 scope：

```bash
npm publish --access public
```

## 5. 发布到 DSH 插件市场

当前社区的 DSH 插件索引使用 format-1 结构（例如 `dsh-plugin-catalog` / `awesome-dsh-plugin`）。发布 npm 包后：

1. 在 GitHub 建仓库，补 `repository`、`homepage`、`bugs` 字段。
2. 准备：
   - 包名：`dsh-composer-prompt-optimizer`
   - 版本：`0.1.1`
   - 分类：`ui`（UI 增强）
   - 标题（中/英）和一句话描述
   - 真实运行截图（输入框按钮、优化前后、回退状态）
   - `dsh.engines.dsh` 最低版本
3. 向维护的索引提交 PR / issue（不同市场的索引地址以当时说明为准）。
4. 在 README 顶部加安装命令和截图。

## 6. 版本规则

遵循 SemVer：

- 修文案、修 CSS、修错误处理 → patch
- 新交互（例如预览模式、快捷键）→ minor
- 改动路由/配置/数据契约 → major（0.x 阶段可放宽，但要在 CHANGELOG 说明）

## 7. 发布后自检

```bash
dsh plugin --profile desktop add dsh-composer-prompt-optimizer@latest
```

确认：

- 插件管理器显示标题「提示词优化」/「Prompt Optimizer」和原创图标。
- 输入框右侧出现按钮。
- 中文、英文、混排草稿分别返回对应语言。
- 失败时原文保留，不阻塞发送。
- 回退后内容与优化前一致。

## 8. 已知限制（发布说明中如实告知）

- 仅 Web 客户端；纯 CLI 不显示按钮。
- 优化以纯文本替换整个草稿；输入框内的引用 chip 可能被展平为文本，附件不受影响。
- 依赖 Harness 的 `ctx.llm.stream()` 与默认模型；没有配置模型时按钮会显示重试状态。
- 路由是本地同源路由，不额外做鉴权；请勿把 Harness 暴露到不可信网络。
