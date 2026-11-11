# Changelog

## 0.1.2 — 2026-11-11

- Fixed: the optimizer now always uses the model selected in the composer's
  current session (sent as `provider` + `model`), not the global
  `agentDefaultModel`. The plugin's config no longer accepts `provider` /
  `model`, so it can never pin its own model or a different credential.
- Verified: the plugin ships no API key, reads no environment variables and
  makes no direct request to a model service; it only calls `ctx.llm.stream()`,
  whose adapter uses the credential already configured in Harness for the
  provider the user selected in the composer.
- Fixed: `cordis.patch.yml` still pinned `maxTokens: 1024`, overriding the
  code default of 2048. It is now 2048, so reasoning models have enough output
  budget.
- `reasoningEffort` is still never sent by the browser, so switching models
  cannot produce "does not support reasoning effort" anymore.
- Publishing docs now use `<YOUR_TOKEN>` placeholders only; no local token path
  is written into the shipped documentation.
- Added tests asserting config cannot pin a model and the session model wins.

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
