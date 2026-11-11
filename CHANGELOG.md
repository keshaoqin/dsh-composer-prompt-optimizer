# Changelog

## 0.1.1 — 2026-11-11

- Fixed: optimizing right after switching models could fail. The browser no
  longer forwards a stale `reasoningEffort`/model projection; the Host resolves
  the current model itself and never forwards an unsupported reasoning level.
- Added: automatic retry without reasoning effort when a model rejects it.
- Added: structured, classified failures (`rate_limited`, `unsupported_effort`,
  `unknown_model`, `unknown_provider`, `auth_failed`, `output_truncated`,
  `empty_result`, `timeout`, …) with an actionable hint and diagnostic details.
- Added: a visible, localized error popover in the composer explaining the
  cause, the affected model, the error code, and how to recover (retry / switch
  model), plus collapsible technical details.
- Increased default `maxTokens` to 2048 so reasoning models do not exhaust the
  output budget before writing the rewritten prompt.
- Added tests for error classification and hint coverage.

## 0.1.0 — 2026-11-11

- First release.
- Resident `conversation.input.right` composer button with optimize / cancel / revert / retry states.
- Host route `/prompt-optimizer/api/enhance` backed by `ctx.llm.stream()`.
- Snapshot revert with manual-edit invalidation.
- Chinese and English UI dictionaries and plugin metadata.
- Marketplace-ready npm/Esm package layout: `dsh.bundle`, `dsh.client`, `dsh.engines`.
