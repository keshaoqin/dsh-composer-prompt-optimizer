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
        'error.empty': '请先输入要优化的提示词',
        'error.unavailable': '优化服务不可用，请确认插件已启用',
        'error.timeout': '优化超时，请重试',
        'error.generic': '优化失败，请重试',
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
        'error.empty': 'Type a prompt first',
        'error.unavailable': 'The optimization service is unavailable. Is the plugin enabled?',
        'error.timeout': 'Optimization timed out. Try again.',
        'error.generic': 'Optimization failed. Try again.',
      },
    };

    const CSS = [
      '.po-btn{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;font-weight:500;line-height:1;white-space:nowrap;cursor:pointer;transition:background .15s,color .15s,border-color .15s,opacity .15s;}',
      '.po-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);}',
      '.po-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}',
      '.po-btn:disabled{opacity:.42;cursor:default;}',
      '.po-btn[data-po-state="done"]{color:var(--dsw-alias-brand-primary);border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 42%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-brand-primary) 9%,transparent);}',
      '.po-btn[data-po-state="error"]{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 48%,var(--dsw-alias-border-l1));}',
      '.po-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;}',
      '.po-spin{animation:po-spin 1s linear infinite;}',
      '@keyframes po-spin{to{transform:rotate(360deg);}}',
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

    function PromptOptimizerButton(props) {
      const useInput = props.useInput;
      const inputActions = props.inputActions;
      const useProjection = props.useProjection;
      const t = typeof props.t === 'function' ? props.t : fallbackT;

      const input = useInput((state) => state) || { draft: '', phase: 'plain', draftRev: -1 };
      let modelProjection;
      try {
        modelProjection = typeof useProjection === 'function'
          ? useProjection('modelSelection', (value) => value)
          : undefined;
      } catch {
        modelProjection = undefined;
      }
      const selected = modelProjection && (modelProjection.next || modelProjection.lastUsed);

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
          setState({ status: 'error', message: t('error.empty') });
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
          const response = await fetch('/prompt-optimizer/api/enhance', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              text: draft,
              ...(selected && selected.provider ? { provider: selected.provider } : {}),
              ...(selected && selected.model ? { model: selected.model } : {}),
              ...(selected && (selected.reasoningEffort || selected.effort)
                ? { reasoningEffort: selected.reasoningEffort || selected.effort }
                : {}),
            }),
            signal: controller.signal,
          });
          const data = await response.json().catch(() => null);
          if (!response.ok || !data || !data.ok) {
            const message = data && data.error && data.error.message
              ? data.error.message
              : (data && data.message ? data.message : 'HTTP ' + response.status);
            throw new Error(message);
          }
          if (controller.signal.aborted || controllerRef.current !== controller) return;
          const current = inputRef.current || {};
          if (String(current.draft || '') !== baseDraft) return;
          const optimized = String(data.text || '');
          if (!optimized.trim()) throw new Error(t('error.generic'));

          applyingRef.current = true;
          inputActions.setDraft(optimized);
          setState({ status: 'done', before: baseDraft, after: optimized });
        } catch (error) {
          if (!mountedRef.current) return;
          if (controllerRef.current !== controller && controller.signal.aborted) return;
          if (controller.signal.aborted && !timedOut) return;
          setState({
            status: 'error',
            message: timedOut ? t('error.timeout') : (error && error.message ? error.message : t('error.generic')),
          });
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
        title = state.message || t('error.generic');
        icon = h(RetryIcon);
      } else {
        label = t('button.optimize');
        title = busy ? t('button.busyTitle') : t('button.optimizeTitle');
        icon = h(SparkleIcon);
      }

      return h(React.Fragment, null,
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
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
      );
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
