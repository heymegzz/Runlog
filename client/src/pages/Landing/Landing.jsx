import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../components/Brand/Logo';
import './landing.css';

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

function useReveal(className = 'reveal-hidden', options = { threshold: 0.12 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-visible');
        obs.unobserve(e.target);
      }
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return ref;
}

function useRafCountUp(target, { duration = 2200, decimals = 0, startOnMount = false } = {}) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);

  const run = useCallback(() => {
    if (done.current) return;
    done.current = true;
    const t0 = performance.now();
    const tick = (now) => {
      const p = easeOutQuart(Math.min((now - t0) / duration, 1));
      const v = target * p;
      setVal(decimals ? Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals) : Math.floor(v));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration, decimals]);

  useEffect(() => {
    if (startOnMount) run();
  }, [startOnMount, run]);

  useEffect(() => {
    if (startOnMount || !ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        run();
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [startOnMount, run]);

  return [val, ref];
}

const CYCLE_WORDS = ['send-digest', 'sync-inventory', 'process-payments', 'cleanup-sessions', 'daily-report'];

function HeadlineCycler() {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState(CYCLE_WORDS.length - 1);

  useEffect(() => {
    const iv = setInterval(() => {
      setIdx((i) => {
        setPrev(i);
        return (i + 1) % CYCLE_WORDS.length;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <span className="hero-cycle-slot">
      {CYCLE_WORDS.map((w, i) => (
        <span
          key={w}
          className={`hero-cycle-word ${i === idx ? 'active' : ''} ${i === prev && i !== idx ? 'prev' : ''}`}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

const HERO_LOGS = [
  { name: 'send-digest', status: 'ok', code: '200', dur: '142ms', next: '08:00' },
  { name: 'sync-inventory', status: 'ok', code: '200', dur: '89ms', next: '*/15' },
  { name: 'process-payments', status: 'warn', code: 'RETRY', dur: '—', next: '2/3' },
  { name: 'cleanup-sessions', status: 'ok', code: '204', dur: '31ms', next: '00:00' },
  { name: 'daily-report', status: 'run', code: 'RUN', dur: '…', next: 'now' },
  { name: 'webhook-retry', status: 'err', code: '503', dur: '12ms', next: 'alert' },
];

function HeroTerminal() {
  const [rows, setRows] = useState([]);
  const idx = useRef(0);

  useEffect(() => {
    const push = () => {
      const d = HERO_LOGS[idx.current % HERO_LOGS.length];
      setRows((r) => [...r.slice(-6), { ...d, id: `${Date.now()}-${idx.current}` }]);
      idx.current += 1;
    };
    push();
    const iv = setInterval(push, 1500);
    return () => clearInterval(iv);
  }, []);

  const statusClass = (s) => ({ ok: 'ok', warn: 'warn', err: 'err', run: 'run' }[s] || 'ok');

  return (
    <div className="hw-terminal">
      <div className="hw-term-head">
        <div className="hw-dot" />
        <div className="hw-dot" />
        <div className="hw-dot" />
        <span>execution feed · live</span>
      </div>
      <div className="hw-term-body">
        {rows.map((r) => (
          <div key={r.id} className="hw-row">
            <div className={`hw-row-dot ${statusClass(r.status)}`} />
            <div className="hw-row-name">{r.name}</div>
            <span className={`st-${r.status === 'run' ? 'run' : r.status}`}>{r.code}</span>
            <span className="hw-row-dur">{r.dur}</span>
            <span className="hw-row-next">→ {r.next}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MARQUEE_EVENTS = [
  { ts: '21:04:11', job: 'send-digest', code: '200', dur: '142ms', st: 'ok' },
  { ts: '21:04:12', job: 'sync-inventory', code: '200', dur: '89ms', st: 'ok' },
  { ts: '21:04:15', job: 'process-payments', code: 'RETRY', dur: 'timeout', st: 'warn' },
  { ts: '21:04:18', job: 'process-payments', code: '200', dur: '312ms', st: 'ok' },
  { ts: '21:04:22', job: 'cleanup-sessions', code: '503', dur: '12ms', st: 'err' },
  { ts: '21:04:25', job: 'daily-report', code: '200', dur: '891ms', st: 'ok' },
];

function MarqueeStrip() {
  const items = [...MARQUEE_EVENTS, ...MARQUEE_EVENTS, ...MARQUEE_EVENTS, ...MARQUEE_EVENTS];
  return (
    <div className="marquee-strip">
      <div className="marquee-track">
        {items.map((e, i) => (
          <div key={i} className="marquee-item">
            <span className="marquee-ts">{e.ts}</span>
            <span className={`st-${e.st}`}>{e.code}</span>
            <span>{e.job}</span>
            <span style={{ color: 'var(--text-muted)' }}>{e.dur}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricBlock({ value, suffix, label, decimals = 0 }) {
  const num = parseFloat(String(value).replace(/[^\d.]/g, ''));
  const [count, ref] = useRafCountUp(num, { decimals, duration: 2400 });
  return (
    <div className="metric-item" ref={ref}>
      <div className="metric-num">
        {decimals ? count.toFixed(decimals) : count}
        {suffix}
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

function HiwStep({ step, index, scrollProgress }) {
  const contentRef = useReveal();
  const mockRef = useReveal();
  const stepThreshold = (index + 0.5) / 4;
  const markerClass =
    scrollProgress >= stepThreshold + 0.12
      ? 'done'
      : scrollProgress >= stepThreshold - 0.12
        ? 'active'
        : '';

  return (
    <div className="hiw-step" data-step={step.n}>
      <span className="hiw-watermark">{step.n}</span>
      <span className={`hiw-marker ${markerClass}`} />
      <div ref={contentRef} className="reveal-hidden">
        <h3>{step.title}</h3>
        <p>{step.body}</p>
      </div>
      <div ref={mockRef} className="reveal-hidden reveal-from-right reveal-delay-1">
        {step.mock}
      </div>
    </div>
  );
}

function HowItWorks() {
  const wrapRef = useRef(null);
  const fillRef = useRef(null);
  const headRef = useRef(null);
  const trackRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lineLen = useRef(0);

  const updateLine = useCallback(() => {
    const wrap = wrapRef.current;
    const fill = fillRef.current;
    const head = headRef.current;
    const track = trackRef.current;
    if (!wrap || !fill || !track) return;

    const h = wrap.offsetHeight - 24;
    track.style.height = `${h}px`;
    fill.setAttribute('x2', '1.5');
    fill.setAttribute('y2', String(h));
    lineLen.current = h;
    fill.style.strokeDasharray = String(h);
    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = rect.top - vh * 0.2;
    const end = rect.bottom - vh * 0.75;
    const range = end - start;
    const progress = range <= 0 ? 0 : Math.max(0, Math.min(1, -start / range));
    fill.style.strokeDashoffset = String(h * (1 - progress));
    if (head) {
      head.setAttribute('cy', String(Math.max(8, h * progress)));
    }
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    updateLine();
    const ro = new ResizeObserver(updateLine);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('scroll', updateLine, { passive: true });
    window.addEventListener('resize', updateLine);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', updateLine);
      window.removeEventListener('resize', updateLine);
    };
  }, [updateLine]);

  const steps = [
    {
      n: '01',
      title: 'Register your endpoint',
      body: 'Name the job, paste the URL, set a cron expression, pick GET or POST. Retries and timeouts ship with sensible defaults.',
      mock: (
        <div className="ui-mock">
          <div className="ui-mock-bar"><i /><i /><i /></div>
          <div className="ui-mock-body">
            <div className="ui-field"><label>Job name</label><input readOnly value="send-digest" /></div>
            <div className="ui-field"><label>URL</label><input readOnly value="https://api.acme.io/v1/digest" /></div>
            <div className="ui-row-flex">
              <div className="ui-field" style={{ flex: 1 }}><label>Cron</label><input readOnly value="0 8 * * *" /></div>
              <div className="ui-field" style={{ width: 90 }}><label>Method</label><select disabled><option>POST</option></select></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      n: '02',
      title: 'See the schedule',
      body: 'A 24-hour grid shows every fire across your workspace. Spot collisions before they hit production.',
      mock: (
        <div className="ui-mock">
          <div className="ui-mock-bar"><i /><i /><i /></div>
          <div className="ui-mock-body">
            <div style={{ marginBottom: 8, color: 'var(--text-muted)' }}>next 24h · 4 jobs</div>
            <div className="ui-sched-grid">
              {Array.from({ length: 32 }, (_, i) => (
                <div
                  key={i}
                  className={`ui-sched-cell ${[2, 5, 9, 14, 18, 22, 27].includes(i) ? 'fire' : i % 7 === 0 ? 'pending' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      n: '03',
      title: 'Watch executions live',
      body: 'Every HTTP call streams to the feed in real time — status code, duration, retry state, and next run.',
      mock: (
        <div className="ui-mock">
          <div className="ui-mock-bar"><i /><i /><i /></div>
          <div className="ui-mock-body">
            {[
              ['ok', 'send-digest', '200', '142ms'],
              ['warn', 'process-payments', 'RETRY', '2/3'],
              ['ok', 'sync-inventory', '200', '89ms'],
            ].map(([st, name, code, dur]) => (
              <div key={name} className="ui-log-line">
                <span className={`ui-badge ${st}`}>{code}</span>
                <span>{name}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{dur}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: '04',
      title: 'Alert on failure',
      body: 'Route final failures to email and Slack. Test webhooks before anything breaks at 3am.',
      mock: (
        <div className="ui-mock">
          <div className="ui-mock-bar"><i /><i /><i /></div>
          <div className="ui-mock-body">
            <div className="ui-field"><label>Email</label><input readOnly value="oncall@acme.io" /></div>
            <div className="ui-field"><label>Slack webhook</label><input readOnly value="https://hooks.slack.com/…" /></div>
            <div className="ui-btn">Send test alert</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="hiw-wrap" ref={wrapRef}>
      <div className="hiw-line-track" ref={trackRef}>
        <svg width="3" height="100%" aria-hidden>
          <line className="hiw-line-bg" x1="1.5" y1="0" x2="1.5" y2="100%" />
          <line ref={fillRef} className="hiw-line-fill" x1="1.5" y1="0" x2="1.5" y2="100" />
          <circle ref={headRef} className="hiw-line-head" r="5" cx="1.5" cy="0" />
        </svg>
      </div>
      <div className="hiw-steps">
        {steps.map((s, i) => (
          <HiwStep key={s.n} step={s} index={i} scrollProgress={scrollProgress} />
        ))}
      </div>
    </div>
  );
}

const FEAT_MINI_LOGS = [
  { s: 'ok', n: 'send-digest', c: '200', d: '142ms' },
  { s: 'ok', n: 'sync-inventory', c: '200', d: '89ms' },
  { s: 'warn', n: 'process-payments', c: 'RETRY', d: '2/3' },
];

function FeatureMiniFeed() {
  const [rows, setRows] = useState(FEAT_MINI_LOGS);
  const i = useRef(0);
  useEffect(() => {
    const iv = setInterval(() => {
      const d = HERO_LOGS[i.current % HERO_LOGS.length];
      i.current += 1;
      setRows((r) => [...r.slice(-3), { s: d.status, n: d.name, c: d.code, d: d.dur }]);
    }, 1800);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="feat-mini-feed">
      {rows.map((r) => (
        <div key={`${r.n}-${r.c}`} className="feat-mini-row">
          <span className={`hw-row-dot ${r.s}`} style={{ width: 5, height: 5 }} />
          <span>{r.n}</span>
          <span className={`st-${r.s}`}>{r.c}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{r.d}</span>
        </div>
      ))}
    </div>
  );
}

function FeatCard({ card, delayClass }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`feat-card reveal-hidden feat-card--${card.layout} ${delayClass}`}
    >
      <h4>{card.title}</h4>
      <p>{card.desc}</p>
      {card.mini && <FeatureMiniFeed />}
    </div>
  );
}

const FEATURE_CARDS = [
  { id: 'feed', title: 'Live Execution Feed', desc: 'WebSocket stream pushes every result in under 200ms. Filter by job, status, or workspace.', layout: 'hero', mini: true },
  { id: 'cron', title: 'Cron Scheduler', desc: 'Standard cron expressions with timezone support and collision preview.', layout: 'side' },
  { id: 'retry', title: 'Retry Engine', desc: 'Exponential backoff with configurable max attempts and jitter.', layout: 'side' },
  { id: 'alerts', title: 'Failure Alerts', desc: 'Email, Slack, and PagerDuty on final failure — not on every retry.', layout: 'bottom' },
  { id: 'rbac', title: 'Team RBAC', desc: 'Owner, admin, and developer roles per workspace.', layout: 'bottom' },
  { id: 'api', title: 'API Keys', desc: 'Trigger jobs from CI/CD or scripts with scoped keys.', layout: 'bottom' },
];

function FeaturesGrid() {
  const delays = ['', 'reveal-delay-1', 'reveal-delay-2'];
  return (
    <div className="feat-bento">
      {FEATURE_CARDS.map((c, i) => (
        <FeatCard key={c.id} card={c} delayClass={delays[i % 3]} />
      ))}
    </div>
  );
}

const TERM_CMDS = {
  'runlog jobs list': [
    { t: 'sys', x: '❯ Fetching jobs from workspace ws_77a…' },
    { t: 'hdr', x: '  ID        NAME                 CRON           STATUS' },
    { t: 'ok', x: '  j_194x    send-digest          0 8 * * *      OK' },
    { t: 'ok', x: '  j_821a    sync-inventory       */15 * * * *   OK' },
    { t: 'ok', x: '  j_448b    cleanup-sessions     0 0 * * *      OK' },
  ],
  'runlog trigger send-digest': [
    { t: 'sys', x: '❯ POST /api/v1/jobs/j_194x/trigger' },
    { t: 'run', x: '  queued · worker-3 picked up job' },
    { t: 'warn', x: '  waiting for HTTP response…' },
    { t: 'ok', x: '✓ complete in 142ms · HTTP 200 OK' },
  ],
  'runlog logs --live': [
    { t: 'sys', x: '❯ streaming execution events…' },
    { t: 'run', x: '[21:04:11] sync-inventory      started' },
    { t: 'ok', x: '[21:04:11] sync-inventory      200 · 89ms' },
    { t: 'err', x: '[21:04:15] process-payments    503 · 12ms' },
    { t: 'warn', x: '[21:04:18] process-payments    retry 1/3' },
    { t: 'ok', x: '[21:04:19] process-payments    200 · 312ms' },
  ],
};

function lineColor(t) {
  if (t === 'ok') return 'var(--status-ok)';
  if (t === 'warn') return 'var(--status-warn)';
  if (t === 'err') return 'var(--status-err)';
  if (t === 'run') return 'var(--status-run)';
  if (t === 'hdr') return 'var(--text-muted)';
  return 'var(--text-secondary)';
}

function InteractiveTerminal() {
  const [cmd, setCmd] = useState(null);
  const [lines, setLines] = useState([]);
  const [typedCmd, setTypedCmd] = useState('');
  const [running, setRunning] = useState(false);
  const boxRef = useReveal();
  const outRef = useRef(null);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (outRef.current) {
      outRef.current.scrollTop = outRef.current.scrollHeight;
    }
  }, [lines, typedCmd]);

  const run = (c) => {
    clearTimers();
    setCmd(c);
    setLines([]);
    setTypedCmd('');
    setRunning(true);
    const full = `$ ${c}`;
    let ci = 0;

    const typeTick = setInterval(() => {
      ci += 1;
      setTypedCmd(full.slice(0, ci));
      if (ci >= full.length) {
        clearInterval(typeTick);
        const seq = TERM_CMDS[c];
        let li = 0;
        const outTick = setInterval(() => {
          li += 1;
          setLines(seq.slice(0, li));
          if (li >= seq.length) {
            clearInterval(outTick);
            setRunning(false);
          }
        }, 90);
        timersRef.current.push(outTick);
      }
    }, 28);
    timersRef.current.push(typeTick);
  };

  return (
    <div ref={boxRef} className="iterm-window reveal-hidden">
      <div className="iterm-chrome">
        <div className="hw-dot" /><div className="hw-dot" /><div className="hw-dot" />
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          bash — 80×24
        </span>
      </div>
      <div className="iterm-pills">
        {Object.keys(TERM_CMDS).map((c) => (
          <button
            key={c}
            type="button"
            className={`iterm-pill ${cmd === c ? 'active' : ''}`}
            onClick={() => run(c)}
            disabled={running}
          >
            $ {c}
          </button>
        ))}
      </div>
      <div className="iterm-out" ref={outRef}>
        <div className="iterm-prompt">runlog@prod ~ %</div>
        {cmd && (
          <div className="iterm-line typing">
            <span style={{ color: 'var(--text)' }}>{typedCmd}</span>
            {running && typedCmd.length < `$ ${cmd}`.length && <span className="iterm-cursor" />}
          </div>
        )}
        {lines.map((l, i) => (
          <div key={`${cmd}-${i}`} className="iterm-line" style={{ color: lineColor(l.t) }}>{l.x}</div>
        ))}
        {!cmd && !running && (
          <div className="iterm-line" style={{ color: 'var(--text-muted)' }}>
            Click a command pill to run it.<span className="iterm-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard3D() {
  const sceneRef = useRef(null);
  const cardRef = useRef(null);
  const sheenRef = useRef(null);
  const chartPathRef = useRef(null);
  const revealRef = useReveal();
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const lerp = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${current.current.x}deg) rotateY(${current.current.y}deg) scale3d(1,1,1)`;
      }
      rafRef.current = requestAnimationFrame(lerp);
    };
    rafRef.current = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const path = chartPathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const start = performance.now();
      const draw = (now) => {
        const p = easeOutQuart(Math.min((now - start) / 1800, 1));
        path.style.strokeDashoffset = len * (1 - p);
        if (p < 1) requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
      obs.disconnect();
    }, { threshold: 0.35 });
    if (sceneRef.current) obs.observe(sceneRef.current);
    return () => obs.disconnect();
  }, []);

  const onMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    target.current.x = ((r.height / 2 - y) / (r.height / 2)) * 8;
    target.current.y = ((x - r.width / 2) / (r.width / 2)) * 8;
    if (sheenRef.current) {
      sheenRef.current.style.background = `radial-gradient(circle 200px at ${x}px ${y}px, rgba(255,255,255,0.04) 0%, transparent 70%)`;
    }
  };

  const onLeave = () => {
    target.current = { x: 0, y: 0 };
    if (sheenRef.current) sheenRef.current.style.background = 'transparent';
  };

  const tableRows = [
    { job: 'send-digest', status: 'ok', code: '200', dur: '142ms', at: '21:04:11' },
    { job: 'sync-inventory', status: 'ok', code: '200', dur: '89ms', at: '21:04:12' },
    { job: 'process-payments', status: 'warn', code: 'RETRY', dur: '—', at: '21:04:15' },
    { job: 'cleanup-sessions', status: 'ok', code: '204', dur: '31ms', at: '21:04:18' },
    { job: 'daily-report', status: 'err', code: '503', dur: '12ms', at: '21:04:22' },
  ];

  return (
    <div ref={revealRef} className="dash-3d-scene reveal-hidden">
      <div ref={sceneRef}>
        <div
          className="dash-card-3d"
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          <div className="dash-sheen" ref={sheenRef} />
          <div className="dash-layout">
            <aside className="dash-side">
              <div className="dash-side-logo">Runlog</div>
              <div className="dash-nav-item on">Overview</div>
              <div className="dash-nav-item">Jobs</div>
              <div className="dash-nav-item">Executions</div>
              <div className="dash-nav-item">Alerts</div>
              <div className="dash-nav-item">Settings</div>
            </aside>
            <div className="dash-main">
              <div className="dash-tiles">
                <div className="dash-tile"><div className="dash-tile-val">1,204</div><div className="dash-tile-label">Runs today</div></div>
                <div className="dash-tile"><div className="dash-tile-val ok">98.2%</div><div className="dash-tile-label">Success</div></div>
                <div className="dash-tile"><div className="dash-tile-val">143ms</div><div className="dash-tile-label">Avg duration</div></div>
                <div className="dash-tile"><div className="dash-tile-val st-warn">2</div><div className="dash-tile-label">Alerts</div></div>
              </div>
              <div className="dash-chart">
                <svg viewBox="0 0 400 100" width="100%" height="100%" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  <path className="chart-fill" d="M0,80 L50,65 L100,70 L150,45 L200,50 L250,30 L300,35 L350,20 L400,25 L400,100 L0,100 Z" />
                  <path ref={chartPathRef} d="M0,80 L50,65 L100,70 L150,45 L200,50 L250,30 L300,35 L350,20 L400,25" />
                </svg>
              </div>
              <table className="dash-table">
                <thead>
                  <tr><th>Job</th><th>Status</th><th>Code</th><th>Duration</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.job + r.at}>
                      <td>{r.job}</td>
                      <td><span className={`status-pill ${r.status}`}>{r.status === 'ok' ? 'SUCCESS' : r.status === 'warn' ? 'RETRY' : 'FAILED'}</span></td>
                      <td className={`st-${r.status}`}>{r.code}</td>
                      <td>{r.dur}</td>
                      <td>{r.at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TESTI_QUOTES = [
  { q: 'We replaced three cron scripts and a Slack bot with Runlog. On-call finally sees failures before customers do.', name: 'Priya N.', role: 'Staff Engineer', co: 'Meridian Pay', initials: 'PN' },
  { q: 'The live feed is what sold us — it feels like tailing production, except every line is a scheduled job we actually own.', name: 'James K.', role: 'Platform Lead', co: 'Northline', initials: 'JK' },
  { q: 'Five minutes from signup to first scheduled fire. The retry defaults alone saved us a week of glue code.', name: 'Alex R.', role: 'Backend Engineer', co: 'Stackform', initials: 'AR' },
];

function Testimonials() {
  const [teams, teamsRef] = useRafCountUp(240, { duration: 2000 });
  const headRef = useReveal();

  return (
    <>
      <div ref={headRef} className="reveal-hidden">
        <div className="testi-stats">
          <div ref={teamsRef}>
            <div className="testi-stat-val">{teams}+</div>
            <div className="testi-stat-label">Teams on Runlog</div>
          </div>
          <div>
            <div className="testi-stat-val">4.9</div>
            <div className="testi-stat-label">Engineer NPS</div>
          </div>
          <div>
            <div className="testi-stat-val">12M+</div>
            <div className="testi-stat-label">Jobs executed</div>
          </div>
        </div>
      </div>
      <div className="testi-grid">
        {TESTI_QUOTES.map((t) => (
          <article key={t.name} className="testi-card">
            <p className="testi-quote">&ldquo;{t.q}&rdquo;</p>
            <div className="testi-footer">
              <div className="testi-avatar">{t.initials}</div>
              <div>
                <div className="testi-author">{t.name}</div>
                <div className="testi-role">{t.role} · {t.co}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="testi-logos">
        {['Meridian Pay', 'Northline', 'Stackform', 'Relay DB'].map((name) => (
          <span key={name} className="testi-logo">{name}</span>
        ))}
      </div>
    </>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(false);
  const gridRef = useReveal();

  const onCardMove = (e) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty('--spot-y', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const proPrice = yearly ? 15 : 19;
  const entPrice = yearly ? 47 : 59;

  return (
    <>
      <div className="sec-header center pricing-sec-head">
        <p className="sec-eyebrow">Pricing</p>
        <h2 className="sec-title center">Simple, transparent plans</h2>
      </div>
      <div className="pricing-head">
        <div className="billing-toggle">
          <div className={`billing-pill ${yearly ? 'yearly' : ''}`} />
          <button type="button" className={`billing-btn ${!yearly ? 'active' : ''}`} onClick={() => setYearly(false)}>Monthly</button>
          <button type="button" className={`billing-btn ${yearly ? 'active' : ''}`} onClick={() => setYearly(true)}>Yearly</button>
        </div>
      </div>
      <div ref={gridRef} className={`price-grid reveal-hidden`}>
        <div className="price-card" onMouseMove={onCardMove}>
          <h3>Starter</h3>
          <div className="price-amt">$0</div>
          <p className="price-desc">Side projects and experiments.</p>
          <div className="price-feat">5 scheduled jobs</div>
          <div className="price-feat">7-day log retention</div>
          <div className="price-feat">Email alerts</div>
          <Link to="/register" className="price-cta">Get started</Link>
        </div>
        <div className="price-card pro" onMouseMove={onCardMove}>
          <h3>Pro</h3>
          <div className="price-amt">${proPrice}<span>/mo</span></div>
          <p className="price-desc">Production teams shipping daily.</p>
          <div className="price-feat">Unlimited jobs</div>
          <div className="price-feat">90-day log retention</div>
          <div className="price-feat">Slack &amp; PagerDuty</div>
          <Link to="/register" className="price-cta">Start free trial</Link>
        </div>
        <div className="price-card" onMouseMove={onCardMove}>
          <h3>Enterprise</h3>
          <div className="price-amt">${entPrice}<span>/mo</span></div>
          <p className="price-desc">RBAC, SSO, and custom retention.</p>
          <div className="price-feat">Everything in Pro</div>
          <div className="price-feat">SAML / SSO</div>
          <div className="price-feat">Priority support</div>
          <a href="mailto:sales@runlog.dev" className="price-cta">Contact sales</a>
        </div>
      </div>
    </>
  );
}

function FinalCTA() {
  const ref = useReveal();
  const year = new Date().getFullYear();

  return (
    <section className="landing-close" aria-labelledby="final-cta-heading">
      <div className="landing-close-bg" aria-hidden>
        <div className="landing-close-art" />
        <div className="landing-close-vignette" />
      </div>

      <div className="final-cta">
        <div ref={ref} className="final-cta-layout reveal-hidden">
          <div className="final-cta-card">
            <p className="final-cta-eyebrow">Ready when you are</p>
            <h2 id="final-cta-heading" className="final-cta-title">
              Your cron jobs deserve an ops layer
            </h2>
            <p className="final-cta-sub">
              Ship scheduled HTTP work with retries, alerts, and a live feed — without babysitting cron on a box somewhere.
            </p>
            <div className="final-cta-actions">
              <Link to="/register" className="btn-primary">
                Get started free
              </Link>
              <a href="#how" className="btn-secondary">
                See how it works
              </a>
            </div>
            <ul className="final-cta-trust" aria-label="Plan highlights">
              <li>5 jobs on free tier</li>
              <li>No credit card</li>
              <li>Live in ~5 minutes</li>
            </ul>
          </div>

          <div className="final-cta-preview" aria-hidden>
            <div className="final-preview-chrome">
              <span className="final-preview-dot" />
              <span className="final-preview-dot" />
              <span className="final-preview-dot" />
              <span className="final-preview-label">runlog — schedules</span>
            </div>
            <div className="final-preview-rows">
              <div className="final-preview-row">
                <span className="final-preview-method">POST</span>
                <span className="final-preview-path">/api/sync-inventory</span>
                <span className="final-preview-cron">*/15 * * * *</span>
                <span className="final-preview-status ok">ok</span>
              </div>
              <div className="final-preview-row">
                <span className="final-preview-method">GET</span>
                <span className="final-preview-path">/health/deep</span>
                <span className="final-preview-cron">0 * * * *</span>
                <span className="final-preview-status ok">ok</span>
              </div>
              <div className="final-preview-row dim">
                <span className="final-preview-method">POST</span>
                <span className="final-preview-path">/webhooks/reconcile</span>
                <span className="final-preview-cron">0 2 * * *</span>
                <span className="final-preview-status run">run</span>
              </div>
            </div>
            <div className="final-preview-foot">
              <span className="final-preview-stat">
                <span className="final-preview-stat-val">1,204</span> runs today
              </span>
              <span className="final-preview-stat">
                <span className="final-preview-stat-val">98.2%</span> success
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-shell">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <Logo to="/" unified className="footer-logo brand--nav" />
              <p className="footer-lead">
                Cron orchestration and live execution logs for engineering teams.
              </p>
            </div>
            <div className="footer-links-col">
              <p className="footer-col-label">Product</p>
              <nav className="footer-col-nav" aria-label="Product">
                <a href="#features" className="footer-link">Features</a>
                <a href="#how" className="footer-link">How it works</a>
                <a href="#pricing" className="footer-link">Pricing</a>
                <Link to="/register" className="footer-link">Get started</Link>
              </nav>
            </div>
            <div className="footer-links-col">
              <p className="footer-col-label">Company</p>
              <nav className="footer-col-nav" aria-label="Company">
                <a href="mailto:hello@runlog.dev" className="footer-link">Contact</a>
                <a href="#" className="footer-link">Docs</a>
                <a href="#" className="footer-link">Privacy</a>
                <Link to="/login" className="footer-link">Log in</Link>
              </nav>
            </div>
          </div>
          <div className="footer-bar">
            <span className="footer-copy">© {year} Runlog</span>
            <span className="footer-status">
              <span className="nav-dot" /> All systems operational
            </span>
          </div>
        </div>
      </footer>
    </section>
  );
}

export default function Landing() {
  const [runs, runsRef] = useRafCountUp(1204, { startOnMount: true });
  const [success, successRef] = useRafCountUp(98.2, { startOnMount: true, decimals: 1 });
  const [dur, durRef] = useRafCountUp(143, { startOnMount: true });
  const [alerts, alertsRef] = useRafCountUp(2, { startOnMount: true });

  const heroContentRef = useReveal();
  const heroPanelRef = useReveal();

  return (
    <div className="landing-page">
      <nav className="nav-glass">
        <div className="nav-inner">
          <Logo to="/" unified className="nav-logo brand--nav" />
          <div className="nav-links">
            <a href="#how" className="nav-link">How it works</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link to="/login" className="nav-link">Log in</Link>
            <span className="nav-cta-wrap">
              <Link to="/register" className="nav-cta">Start free</Link>
            </span>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div ref={heroContentRef} className="reveal-hidden">
            <div className="hero-pill">
              <span className="hero-pill-dot" />
              Cron orchestration for HTTP workloads
            </div>
            <h1 className="hero-title">
              Schedule <HeadlineCycler />
              <br />
              on autopilot
            </h1>
            <p className="hero-desc">
              Register HTTP endpoints as cron jobs. Set schedules, stream execution logs in real time, and get retries, failure alerts, and team access — without another worker process.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-primary">Get started</Link>
              <a href="#how" className="btn-secondary">See how it works</a>
            </div>
          </div>
          <div ref={heroPanelRef} className="hero-panel reveal-hidden reveal-delay-1">
            <div className="hero-panel-glow" aria-hidden />
            <div className="hw-stats">
              <div className="hw-stat" ref={runsRef}>
                <div className="hw-stat-val">{runs.toLocaleString()}</div>
                <div className="hw-stat-label">Runs today</div>
              </div>
              <div className="hw-stat" ref={successRef}>
                <div className="hw-stat-val">{success}%</div>
                <div className="hw-stat-label">Success</div>
              </div>
              <div className="hw-stat" ref={durRef}>
                <div className="hw-stat-val">{dur}ms</div>
                <div className="hw-stat-label">Avg duration</div>
              </div>
              <div className="hw-stat" ref={alertsRef}>
                <div className="hw-stat-val st-err">{alerts}</div>
                <div className="hw-stat-label">Alerts</div>
              </div>
            </div>
            <HeroTerminal />
          </div>
        </div>
      </section>

      <MarqueeStrip />

      <section className="metrics-section">
        <div className="section-shell">
          <div className="sec-header">
            <p className="sec-eyebrow">Metrics</p>
            <h2 className="sec-title left">The numbers teams care about.</h2>
          </div>
          <div className="metrics-grid">
            <MetricBlock value="30" suffix="×" label="faster than hand-rolled cron" />
            <MetricBlock value="12" suffix="×" label="more failures caught before users" />
            <MetricBlock value="99.9" suffix="%" label="uptime SLA" decimals={1} />
            <MetricBlock value="5" suffix=" min" label="median time to first job" />
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="section-inner">
          <div className="sec-header wide">
            <p className="sec-eyebrow">Workflow</p>
            <h2 className="sec-title left">How it works</h2>
          </div>
          <HowItWorks />
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-inner">
          <div className="sec-header wide">
            <p className="sec-eyebrow">Platform</p>
            <h2 className="sec-title left">Built for production schedules</h2>
          </div>
          <FeaturesGrid />
        </div>
      </section>

      <section className="section terminal-section">
        <div className="section-inner">
          <div className="sec-header center">
            <p className="sec-eyebrow">CLI</p>
            <h2 className="sec-title center">Operate from the terminal</h2>
          </div>
          <InteractiveTerminal />
        </div>
      </section>

      <section className="section">
        <div className="section-inner dash-section-head">
          <div className="sec-header wide">
            <p className="sec-eyebrow">Dashboard</p>
            <h2 className="sec-title left">The control plane for every fire</h2>
          </div>
          <Dashboard3D />
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="sec-header center testi-section-head">
            <p className="sec-eyebrow">Customers</p>
            <h2 className="sec-title center">Used by engineering teams</h2>
          </div>
          <Testimonials />
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="section-inner">
          <Pricing />
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
