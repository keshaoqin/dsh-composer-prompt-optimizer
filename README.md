# Prompt Optimizer (dsh-composer-prompt-optimizer)

A resident **Optimize prompt** button in the DeepSeek Harness composer. It rewrites the current draft into a clearer, more specific prompt with the current conversation model, keeps the original as a snapshot, and turns into **Revert** so the change is never destructive.

The plugin is based on the `outputs/` reverse-engineering of WorkBuddy 5.7.7's "Enhance prompt" behaviour and the portable `prompt-enhancer` prompt assets, reimplemented on DeepSeek Harness slots, the `llm` service, and a local HTTP bridge.

![Optimize button in the composer](docs/screenshot-composer.png)

![The button becomes Revert after optimization](docs/screenshot-optimized.png)

## Features

- **Resident in the composer**: registered in `conversation.input.right`, just before the send action.
- **One-click optimization**: reads the draft and calls `ctx.llm.stream()` in a single-turn, tool-free, low-temperature request.
- **One-click revert**: keeps a `before` snapshot and restores it from the button.
- **Manual-edit protection**: if you edit the draft after optimizing, the snapshot is discarded so revert can never overwrite new input.
- **Cancellation and soft failure**: cancel an in-flight request; timeout or provider failures keep the original draft and show a retry state.
- **Language preserving**: Chinese in / Chinese out, English in / English out, mixed input keeps a natural mix, and no language labels are emitted.
- **Never executes the task**: it sharpens the ask, never answers it.
- **Text-only replacement**: attachments stay in the attachment rail; only the text draft is rewritten.

## Install

### From a local directory (development)

```bash
dsh plugin --profile desktop add /absolute/path/to/dsh-composer-prompt-optimizer
```

Or use the Plugin Manager's local-bundle install action. Restart Harness once after installation.

### From npm (after publishing)

```bash
dsh plugin --profile desktop add dsh-composer-prompt-optimizer
dsh plugin --profile desktop add dsh-composer-prompt-optimizer@0.1.0
```

## Use

1. Type a draft, e.g. `write something about our Q3 results`.
2. Click **Optimize prompt** on the right of the composer.
3. After a few seconds the draft is replaced and the button becomes **Revert**.
4. Send it, or click **Revert** to restore the original.
5. If you edit after optimizing, the button returns to **Optimize prompt** and the snapshot is discarded.

| State | Label | Click |
| --- | --- | --- |
| Idle | Optimize prompt | Start |
| Loading | Cancel (spinner) | Abort and restore |
| Optimized | Revert | Restore the original draft |
| Error | Retry | Try again |

## Configuration

```yaml
- id: prompt-optimizer
  name: 'dsh-composer-prompt-optimizer'
  config:
    temperature: 0.3      # 0–2, lower stays closer to the original intent
    maxTokens: 1024       # 64–8192
    timeoutMs: 60000      # 1s–300s
    # provider: deepseek
    # model: deepseek-chat
```

When `provider` / `model` are omitted, the current session model is preferred; the Harness `agentDefaultModel` is used as a fallback.

## Compatibility

- DeepSeek Harness `>= 0.2.0-rc.2`.
- Web client only (`dsh.client.platform: web`): available in the Web GUI and the desktop app; no button in pure CLI.
- Uses the standard `conversation.input.right` slot and `setDraft` input action. It does not read or modify another plugin's DOM.

## Privacy and security

- No data collection or upload.
- Network behaviour is limited to the browser calling the local Harness route `/prompt-optimizer/api/*` and the Host calling `ctx.llm.stream()` against the model service you configured.
- No file access, command execution, tool registration, or session-log writes.
- The route is served by the Harness local web server. If you bind Harness to a non-loopback address, review that deployment's access control.

## Development checks

```bash
node --check index.js
node --check client.js
node --test test/*.test.mjs
```

## License

MIT
