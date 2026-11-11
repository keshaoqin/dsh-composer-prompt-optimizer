window.__ModuleLoader__.load({
  id: 'dsh-composer-prompt-optimizer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NAMESPACE = 'promptOptimizer';

    const LOCALE_DICTS = {
      zh: {
        'button.optimize': '优化提示词',
        'button.optimizing': '优化中…',
        'button.cancel': '取消优化',
        'button.revert': '回退原文',
        'button.retry': '重试',
        'button.optimizeTitle': '用当前模型改写输入框中的提示词',
        'button.revertTitle': '恢复到优化前的提示词',
        'button.cancelTitle': '取消正在进行的优化',
        'button.busyTitle': '当前输入状态不可优化',
        'status.done': '已优化，可回退',

        'error.title': '优化失败',
        'error.retry': '重试',
        'error.close': '关闭',
        'error.codeLabel': '错误码',
        'error.modelLabel': '当前模型',
        'error.technical': '技术详情',
        'error.generic.title': '优化失败',
        'error.generic.hint': '发生了未知错误，请重试。若持续失败，请查看技术详情。',

        'error.network.title': '无法连接优化服务',
        'error.network.hint': '浏览器没能连上插件的本地服务。请确认插件已启用，并刷新页面后重试。',
        'error.empty_input.title': '草稿为空',
        'error.empty_input.hint': '请先在输入框写下要优化的提示词。',
        'error.input_too_long.title': '草稿过长',
        'error.input_too_long.hint': '草稿超过长度上限。请缩短内容，或拆成几次优化。',
        'error.bad_request.title': '请求无效',
        'error.bad_request.hint': '请求格式不正确，请刷新页面后重试。',
        'error.not_found.title': '优化服务未就绪',
        'error.not_found.hint': '插件接口不存在。请确认插件已启用并重启 Harness。',
        'error.unavailable.title': '优化服务不可用',
        'error.unavailable.hint': '当前 Harness 没有可用的 LLM 服务。请确认插件已启用、Harness 已完全启动。',
        'error.no_model.title': '尚未选择模型',
        'error.no_model.hint': '请先在输入框选择一个可用模型，再点击优化。',
        'error.rate_limited.title': '模型调用被限流',
        'error.rate_limited.hint': '当前模型已超出调用频率或配额限制。请在输入框切换其他模型，或等待配额重置后再试。',
        'error.unsupported_effort.title': '推理等级不兼容',
        'error.unsupported_effort.hint': '当前模型不支持所选推理等级。插件已自动以默认等级重试；若仍失败请切换模型。',
        'error.unknown_model.title': '模型不可用',
        'error.unknown_model.hint': '所选模型未在当前模型服务中配置。请在输入框切换一个可用模型后重试。',
        'error.unknown_provider.title': '模型服务未注册',
        'error.unknown_provider.hint': '该模型服务未注册。请检查 Harness 的模型设置，或切换模型后重试。',
        'error.auth_failed.title': '模型鉴权失败',
        'error.auth_failed.hint': 'API Key 或账号登录状态有问题。请检查模型服务的凭据配置。',
        'error.output_truncated.title': '输出被截断',
        'error.output_truncated.hint': '模型输出达到长度上限，没有生成完整提示词。请缩短草稿后重试。',
        'error.empty_result.title': '模型没有返回正文',
        'error.empty_result.hint': '模型只返回了推理过程或空内容。请切换到其他模型后重试。',
        'error.timeout.title': '优化超时',
        'error.timeout.hint': '请求超过时间限制。请重试，或缩短草稿、切换到更快的模型。',
        'error.cancelled.title': '已取消',
        'error.cancelled.hint': '优化已取消，原文保持不变。',
        'error.model_error.title': '模型调用失败',
        'error.model_error.hint': '模型服务返回了错误。建议切换其他模型后重试；若持续失败，请查看技术详情。',
      },
      en: {
        'button.optimize': 'Optimize prompt',
        'button.optimizing': 'Optimizing…',
        'button.cancel': 'Cancel',
        'button.revert': 'Revert',
        'button.retry': 'Retry',
        'button.optimizeTitle': 'Rewrite the prompt in the composer with the current model',
        'button.revertTitle': 'Restore the prompt from before optimization',
        'button.cancelTitle': 'Cancel the optimization in progress',
        'button.busyTitle': 'The composer is busy',
        'status.done': 'Optimized — revert is available',

        'error.title': 'Optimization failed',
        'error.retry': 'Retry',
        'error.close': 'Close',
        'error.codeLabel': 'Code',
        'error.modelLabel': 'Model',
        'error.technical': 'Technical details',
        'error.generic.title': 'Optimization failed',
        'error.generic.hint': 'An unknown error occurred. Try again, or open the technical details.',

        'error.network.title': 'Cannot reach the optimizer service',
        'error.network.hint': 'The browser could not reach the local plugin service. Check that the plugin is enabled, then reload the page.',
        'error.empty_input.title': 'The draft is empty',
        'error.empty_input.hint': 'Type a prompt in the composer first.',
        'error.input_too_long.title': 'The draft is too long',
        'error.input_too_long.hint': 'Shorten the draft or split it into several optimizations.',
        'error.bad_request.title': 'Invalid request',
        'error.bad_request.hint': 'The request was malformed. Reload the page and try again.',
        'error.not_found.title': 'Optimizer service not ready',
        'error.not_found.hint': 'The plugin endpoint is missing. Enable the plugin and restart Harness.',
        'error.unavailable.title': 'Optimizer service unavailable',
        'error.unavailable.hint': 'Harness has no usable LLM service. Check that the plugin is enabled and Harness has fully started.',
        'error.no_model.title': 'No model selected',
        'error.no_model.hint': 'Select a model in the composer, then try again.',
        'error.rate_limited.title': 'Model rate limit reached',
        'error.rate_limited.hint': 'The current model hit a rate or quota limit. Switch to another model in the composer, or wait for the quota to reset.',
        'error.unsupported_effort.title': 'Reasoning level incompatible',
        'error.unsupported_effort.hint': 'The current model does not support the selected reasoning level. The plugin retried with its default level; switch models if it still fails.',
        'error.unknown_model.title': 'Model unavailable',
        'error.unknown_model.hint': 'The selected model is not configured for this provider. Pick another model in the composer.',
        'error.unknown_provider.title': 'Model provider not registered',
        'error.unknown_provider.hint': 'That provider is not registered. Check Harness model settings or switch models.',
        'error.auth_failed.title': 'Model authentication failed',
        'error.auth_failed.hint': 'Check the API key or account sign-in for the model service.',
        'error.output_truncated.title': 'Output truncated',
        'error.output_truncated.hint': 'The model hit its length limit before finishing the prompt. Shorten the draft and try again.',
        'error.empty_result.title': 'Model returned no prompt',
        'error.empty_result.hint': 'The model returned only reasoning or empty content. Switch to another model and retry.',
        'error.timeout.title': 'Optimization timed out',
        'error.timeout.hint': 'The request exceeded the time limit. Retry, shorten the draft, or switch to a faster model.',
        'error.cancelled.title': 'Cancelled',
        'error.cancelled.hint': 'Optimization was cancelled; your original draft is unchanged.',
        'error.model_error.title': 'Model call failed',
        'error.model_error.hint': 'The model service returned an error. Switch to another model and retry; see technical details if it persists.',
      },
    };

    const CSS = [
      '.po-root{position:relative;display:inline-flex;align-items:center;}',
      '.po-btn{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;font-weight:500;line-height:1;white-space:nowrap;cursor:pointer;transition:background .15s,color .15s,border-color .15s,opacity .15s;}',
      '.po-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);}',
      '.po-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}',
      '.po-btn:disabled{opacity:.42;cursor:default;}',
      '.po-btn[data-po-state="done"]{color:var(--dsw-alias-brand-primary);border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 42%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-brand-primary) 9%,transparent);}',
      '.po-btn[data-po-state="error"]{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 48%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 8%,transparent);}',
      '.po-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;}',
      '.po-spin{animation:po-spin 1s linear infinite;}',
      '@keyframes po-spin{to{transform:rotate(360deg);}}',

      '.po-popover{position:absolute;right:0;bottom:calc(100% + 10px);z-index:40;width:310px;max-width:calc(100vw - 32px);box-sizing:border-box;padding:12px 13px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-overlay);box-shadow:0 10px 32px rgba(0,0,0,.16);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px;line-height:1.55;text-align:left;white-space:normal;}',
      '.po-popover:after{content:"";position:absolute;right:16px;bottom:-6px;width:10px;height:10px;transform:rotate(45deg);background:var(--dsw-alias-bg-overlay);border-right:1px solid var(--dsw-alias-border-l2);border-bottom:1px solid var(--dsw-alias-border-l2);}',
      '.po-pop-head{display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;}',
      '.po-pop-badge{flex:0 0 auto;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 16%,transparent);color:var(--dsw-alias-state-error-primary);font-size:11px;font-weight:700;line-height:1;}',
      '.po-pop-title{font-weight:650;font-size:13px;flex:1;}',
      '.po-pop-close{cursor:pointer;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:16px;line-height:1;padding:0 2px;}',
      '.po-pop-hint{margin:0 0 8px;color:var(--dsw-alias-label-secondary);}',
      '.po-pop-meta{display:flex;flex-wrap:wrap;gap:4px 10px;margin-bottom:8px;font-size:11px;color:var(--dsw-alias-label-secondary);}',
      '.po-pop-meta b{font-weight:600;}',
      '.po-pop-actions{display:flex;gap:6px;margin-bottom:4px;}',
      '.po-pop-action{cursor:pointer;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:11.5px;padding:4px 10px;}',
      '.po-pop-action.primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff;}',
      '.po-pop-details{margin-top:6px;font-size:11px;color:var(--dsw-alias-label-secondary);}',
      '.po-pop-details summary{cursor:pointer;}',
      '.po-pop-raw{margin-top:6px;max-height:110px;overflow:auto;white-space:pre-wrap;word-break:break-word;background:var(--dsw-alias-bg-layer-2);border-radius:6px;padding:6px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;line-height:1.45;color:var(--dsw-alias-label-primary);}',
      '@container (max-width:560px){.po-label{display:none;}.po-btn{padding:0 7px;}}',
    ].join('');

    function fallbackT(key) {
      return LOCALE_DICTS.en[key] || key;
    }

    function makeTranslator(locale) {
      let bound;
      try {
        bound = locale && typeof locale.bind === 'function' ? locale.bind(NAMESPACE) : undefined;
      } catch {
        bound = undefined;
      }
      return function translate(key) {
        try {
          const value = bound ? bound(key) : undefined;
          if (typeof value === 'string' && value !== key) return value;
        } catch {
          /* fall through */
        }
        return fallbackT(key);
      };
    }

    function errorText(t, code, kind) {
      const key = 'error.' + code + '.' + kind;
      const value = t(key);
      if (value && value !== key) return value;
      return kind === 'title' ? t('error.generic.title') : t('error.generic.hint');
    }

    /** Turn an API failure into a readable, actionable object. */
    function makeFailure(data, status, t) {
      const code =
        (data && data.error && data.error.code) ||
        (status === 504 ? 'timeout' : status === 404 ? 'not_found' : 'unknown');
      const serverHint = data && data.error && data.error.hint;
      const details = (data && data.error && data.error.details) || {};
      const raw =
        (data && data.error && data.error.message) ||
        (data && data.message) ||
        'HTTP ' + status;
      return {
        code,
        title: errorText(t, code, 'title'),
        hint: errorText(t, code, 'hint') || serverHint || '',
        details,
        raw: String(raw),
      };
    }

    function makeNetworkFailure(error, timedOut, t) {
      const code = timedOut ? 'timeout' : 'network';
      return {
        code,
        title: errorText(t, code, 'title'),
        hint: errorText(t, code, 'hint'),
        details: {},
        raw: error && error.message ? String(error.message) : 'fetch failed',
      };
    }

    function SparkleIcon() {
      return h('svg', {
        viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true, focusable: 'false',
        className: 'po-icon',
      }, h('path', {
        d: 'M8 1.2l1.28 3.52L12.8 6 9.28 7.28 8 10.8 6.72 7.28 3.2 6l3.52-1.28L8 1.2Z',
        fill: 'currentColor',
      }), h('path', {
        d: 'M12.8 10.2l.55 1.45 1.45.55-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55.55-1.45Z',
        fill: 'currentColor', opacity: '.72',
      }));
    }

    function RevertIcon() {
      return h('svg', {
        viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true, focusable: 'false',
        className: 'po-icon', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      }, h('path', { d: 'M3.2 6.4a5 5 0 1 0 1.5-3.1' }), h('path', { d: 'M3.2 2.9v3.5h3.5' }));
    }

    function RetryIcon() {
      return h('svg', {
        viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true, focusable: 'false',
        className: 'po-icon', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      }, h('path', { d: 'M12.8 6.4A5 5 0 1 0 11.3 3.3' }), h('path', { d: 'M12.8 2.9v3.5h-3.5' }));
    }

    function SpinnerIcon() {
      return h('svg', {
        viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true, focusable: 'false',
        className: 'po-icon po-spin', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
        strokeLinecap: 'round',
      }, h('circle', { cx: 8, cy: 8, r: 5.2, opacity: '.25' }),
      h('path', { d: 'M8 2.8a5.2 5.2 0 0 1 5.2 5.2' }));
    }

    function ErrorPopover(props) {
      const failure = props.failure;
      const t = props.t;
      const model = failure.details.provider
        ? failure.details.provider + '/' + (failure.details.model || '?')
        : (failure.details.model || '');
      const extra = [];
      if (failure.details.reasoningChars !== undefined) {
        extra.push('reasoning chars: ' + failure.details.reasoningChars);
      }
      if (failure.details.finishReason) {
        extra.push('finish: ' + failure.details.finishReason);
      }
      return h('div', { className: 'po-popover', role: 'alert', 'aria-live': 'assertive' },
        h('div', { className: 'po-pop-head' },
          h('span', { className: 'po-pop-badge' }, '!'),
          h('span', { className: 'po-pop-title' }, failure.title),
          h('button', {
            type: 'button', className: 'po-pop-close', 'aria-label': t('error.close'),
            title: t('error.close'), onClick: props.onClose,
          }, '×')),
        h('p', { className: 'po-pop-hint' }, failure.hint),
        h('div', { className: 'po-pop-meta' },
          h('span', null, h('b', null, t('error.codeLabel') + ': '), failure.code),
          model ? h('span', null, h('b', null, t('error.modelLabel') + ': '), model) : null),
        h('div', { className: 'po-pop-actions' },
          h('button', {
            type: 'button', className: 'po-pop-action primary', onClick: props.onRetry,
          }, t('error.retry'))),
        h('details', { className: 'po-pop-details' },
          h('summary', null, t('error.technical')),
          h('div', { className: 'po-pop-raw' },
            extra.length ? extra.join(' | ') + '\n' : '',
            failure.raw)));
    }

    function PromptOptimizerButton(props) {
      const useInput = props.useInput;
      const inputActions = props.inputActions;
      const t = typeof props.t === 'function' ? props.t : fallbackT;

      const input = useInput((state) => state) || { draft: '', phase: 'plain', draftRev: -1 };
      const [state, setState] = React.useState({ status: 'idle' });
      const controllerRef = React.useRef(null);
      const inputRef = React.useRef(input);
      inputRef.current = input;
      const applyingRef = React.useRef(false);
      const mountedRef = React.useRef(true);

      React.useEffect(() => () => {
        mountedRef.current = false;
        if (controllerRef.current) controllerRef.current.abort();
      }, []);

      React.useEffect(() => {
        if (state.status === 'done' && input.draft !== state.after) {
          setState({ status: 'idle' });
        }
      }, [input.draft, state.status, state.after]);

      React.useEffect(() => {
        if (state.status !== 'loading') return;
        if (applyingRef.current) {
          applyingRef.current = false;
          return;
        }
        if (input.draft !== state.baseDraft) {
          if (controllerRef.current) controllerRef.current.abort();
          controllerRef.current = null;
          setState({ status: 'idle' });
        }
      }, [input.draft, state.status, state.baseDraft]);

      const cleanDraft = String(input.draft || '').replace(/[\u200B\uFEFF]/g, '').trim();
      const busy = input.phase !== undefined && input.phase !== 'plain';
      const disabled = state.status === 'loading' ? false : (!cleanDraft || busy);

      async function optimize() {
        const liveInput = inputRef.current || {};
        const draft = String(liveInput.draft || '').replace(/[\u200B\uFEFF]/g, '').trim();
        if (!draft) {
          setState({ status: 'error', failure: {
            code: 'empty_input',
            title: errorText(t, 'empty_input', 'title'),
            hint: errorText(t, 'empty_input', 'hint'),
            details: {}, raw: 'empty draft',
          } });
          return;
        }
        const controller = new AbortController();
        controllerRef.current = controller;
        const baseDraft = String(liveInput.draft || '');
        setState({ status: 'loading', baseDraft });
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, 60_000);

        try {
          // The Host resolves the current model itself via agentDefaultModel.
          // Sending a stale projection-shaped model/effort here is what used to
          // break optimization right after the user switched models.
          const response = await fetch('/prompt-optimizer/api/enhance', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text: draft }),
            signal: controller.signal,
          });
          const data = await response.json().catch(() => null);
          if (!response.ok || !data || !data.ok) {
            const failure = makeFailure(data, response.status, t);
            const err = new Error(failure.title);
            err.failure = failure;
            throw err;
          }
          if (controller.signal.aborted || controllerRef.current !== controller) return;
          const current = inputRef.current || {};
          if (String(current.draft || '') !== baseDraft) return;
          const optimized = String(data.text || '');
          if (!optimized.trim()) {
            const failure = makeFailure({ error: { code: 'empty_result', message: 'empty text in response' } }, 200, t);
            const err = new Error(failure.title);
            err.failure = failure;
            throw err;
          }

          applyingRef.current = true;
          inputActions.setDraft(optimized);
          setState({ status: 'done', before: baseDraft, after: optimized });
        } catch (error) {
          if (!mountedRef.current) return;
          if (controllerRef.current !== controller && controller.signal.aborted) return;
          if (controller.signal.aborted && !timedOut) return;
          const failure = error && error.failure
            ? error.failure
            : makeNetworkFailure(error, timedOut, t);
          setState({ status: 'error', failure });
        } finally {
          clearTimeout(timer);
          if (controllerRef.current === controller) controllerRef.current = null;
        }
      }

      function onClick() {
        if (state.status === 'loading') {
          const controller = controllerRef.current;
          controllerRef.current = null;
          if (controller) controller.abort();
          setState({ status: 'idle' });
          return;
        }
        if (state.status === 'done') {
          inputActions.setDraft(state.before);
          setState({ status: 'idle' });
          return;
        }
        void optimize();
      }

      function dismissError() {
        setState({ status: 'idle' });
      }

      let label;
      let title;
      let icon;
      if (state.status === 'loading') {
        label = t('button.cancel');
        title = t('button.cancelTitle');
        icon = h(SpinnerIcon);
      } else if (state.status === 'done') {
        label = t('button.revert');
        title = t('button.revertTitle');
        icon = h(RevertIcon);
      } else if (state.status === 'error') {
        label = t('button.retry');
        title = state.failure ? state.failure.title : t('error.generic.title');
        icon = h(RetryIcon);
      } else {
        label = t('button.optimize');
        title = busy ? t('button.busyTitle') : t('button.optimizeTitle');
        icon = h(SparkleIcon);
      }

      return h(React.Fragment, null,
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('div', { className: 'po-root' },
          h('button', {
            type: 'button',
            className: 'po-btn',
            'data-po-state': state.status,
            'aria-label': label,
            'aria-busy': state.status === 'loading' ? 'true' : 'false',
            title,
            disabled,
            onClick,
          }, icon, h('span', { className: 'po-label' }, label)),
          state.status === 'error' && state.failure
            ? h(ErrorPopover, {
                failure: state.failure,
                t,
                onRetry: () => void optimize(),
                onClose: dismissError,
              })
            : null));
    }

    function apply(ctx) {
      const locale = ctx.get('locale');
      if (locale && typeof locale.register === 'function') {
        for (const id of Object.keys(LOCALE_DICTS)) {
          ctx.effect(
            () => locale.register(NAMESPACE, id, LOCALE_DICTS[id]),
            'prompt-optimizer: ' + id + ' locale',
          );
        }
      }
      const t = makeTranslator(locale);

      ctx.effect(() => ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
        name: 'conversation.input.right',
        id: 'prompt-optimizer',
        order: 5,
        label: () => t('button.optimize'),
      }, (props) => h(PromptOptimizerButton, { ...props, t }))), 'prompt-optimizer: composer button');
    }

    return {
      inject: ['slots', 'locale'],
      apply,
    };
  },
});
