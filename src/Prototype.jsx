import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadGlyphs, loadManifest, loadScreen } from './loader.js';

// Device size of the Figma prototype (APP)
const DW = 390;
const DH = 840;
// Design width of the WEB frames
const WEB_W = 1920;

const CLICK_EVENTS = ['ON_CLICK', 'ON_PRESS', 'MOUSE_UP', 'MOUSE_DOWN'];

// Figma transition -> CSS animation names (enter / leave-on-back)
function transitionClass(tr, back) {
  if (!tr || tr === 'INSTANT_TRANSITION' || tr === 'INSTANT') return null;
  if (/SLIDE_FROM_RIGHT|PUSH_FROM_RIGHT|MOVE_FROM_RIGHT/.test(tr)) return back ? 'out-right' : 'in-right';
  if (/SLIDE_FROM_LEFT|PUSH_FROM_LEFT|MOVE_FROM_LEFT/.test(tr)) return back ? 'out-left' : 'in-left';
  if (/SLIDE_FROM_BOTTOM|PUSH_FROM_BOTTOM|MOVE_FROM_BOTTOM/.test(tr)) return back ? 'out-bottom' : 'in-bottom';
  if (/SLIDE_FROM_TOP|PUSH_FROM_TOP|MOVE_FROM_TOP/.test(tr)) return back ? 'out-top' : 'in-top';
  // DISSOLVE, SMART_ANIMATE and others are shown as a cross-fade
  return back ? 'fade-out' : 'fade-in';
}

function getHashId() {
  const h = decodeURIComponent((window.location.hash || '').replace(/^#\/?/, ''));
  return /^\d+:\d+$/.test(h) ? h : null;
}

/* One rendered Figma frame */
function Screen({ s, mode, scale, anim, dur, z, initialScroll, onMount }) {
  const scrollerRef = useRef(null);
  const innerRef = useRef(null);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTop = initialScroll || 0;
    // Sticky elements (Figma "STICKY_SCROLLS")
    let off = null;
    if (scroller) {
      const els = inner.querySelectorAll('[data-sticky]');
      if (els.length) {
        const base = inner.getBoundingClientRect();
        const k = base.height / s.h || 1;
        const st = scroller.scrollTop;
        const items = Array.from(els).map((e) => ({ e, y: (e.getBoundingClientRect().top - base.top) / k + st }));
        const on = () => {
          const t = scroller.scrollTop;
          for (const it of items) it.e.style.translate = `0 ${Math.max(0, t - it.y)}px`;
        };
        scroller.addEventListener('scroll', on, { passive: true });
        on();
        off = () => scroller.removeEventListener('scroll', on);
      }
    }
    onMount && onMount({ s, inner, scroller });
    return () => off && off();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = { zIndex: z, background: s.bg };
  if (anim) style.animation = `${anim} ${dur}s cubic-bezier(0.33,1,0.68,1) both`;

  if (mode === 'app') {
    return (
      <div className="layer" style={style}>
        <div className="scroller" ref={scrollerRef}>
          <div className="screen" ref={innerRef} style={{ width: s.w, height: s.h, background: s.bg }} dangerouslySetInnerHTML={{ __html: s.html }} />
        </div>
        {s.fixed ? <div className="fixed" dangerouslySetInnerHTML={{ __html: s.fixed }} /> : null}
      </div>
    );
  }
  return (
    <div className="layer" style={style}>
      <div className="screen" ref={innerRef} style={{ width: s.w, height: s.h, background: s.bg, transform: `scale(${scale})` }} dangerouslySetInnerHTML={{ __html: s.html }} />
    </div>
  );
}

export default function Prototype({ mode }) {
  const [manifest, setManifest] = useState(null);
  const [glyphs, setGlyphs] = useState(null);
  const [layers, setLayers] = useState([]); // [{key, s, anim, dur, z, scroll}]
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight, cw: document.documentElement.clientWidth });

  const byId = useRef({});
  const stack = useRef([]); // [{id, scroll, tr, dur}]
  const current = useRef(null); // {s, inner, scroller}
  const keyN = useRef(0);
  const busy = useRef(false);
  const timers = useRef([]);
  const histOK = useRef(true);
  const ignorePop = useRef(0);

  // ---------- data ----------
  useEffect(() => {
    Promise.all([loadManifest(), loadGlyphs()]).then(([m, g]) => {
      m.screens.forEach((x) => (byId.current[x.id] = x));
      setGlyphs(g);
      setManifest(m);
    });
  }, []);

  // ---------- layout ----------
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight, cw: document.documentElement.clientWidth });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const mobile = mode === 'app' && size.w < 600;
  let scale = 1;
  let vh = DH;
  if (mode === 'app') {
    if (mobile) { scale = size.w / DW; vh = size.h / scale; }
    else scale = Math.min(1, size.h / DH);
  } else {
    scale = size.cw / WEB_W;
  }

  // ---------- navigation ----------
  const curScroll = () => (mode === 'app' ? (current.current && current.current.scroller ? current.current.scroller.scrollTop : 0) : window.scrollY);

  const show = useCallback(async (id, tr, dur, back, scroll) => {
    const info = byId.current[id];
    if (!info) return false;
    const s = await loadScreen(info.file);
    if (!s) return false;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const cls = transitionClass(tr, back);
    const d = dur || 0.3;
    const key = ++keyN.current;
    setLayers((prev) => {
      const old = prev[prev.length - 1];
      if (!cls || !old) return [{ key, s, anim: null, dur: d, z: 1, scroll }];
      if (back) return [{ key, s, anim: null, dur: d, z: 1, scroll }, { ...old, anim: cls, z: 2, leaving: true }];
      return [{ ...old, z: 1 }, { key, s, anim: cls, dur: d, z: 2, scroll }];
    });
    if (cls) {
      busy.current = true;
      setTimeout(() => {
        busy.current = false;
        setLayers((prev) => prev.filter((l) => l.key >= key));
      }, d * 1000 + 30);
    }
    if (mode === 'web') window.scrollTo(0, scroll || 0);
    // preload neighbours
    (s.actions || []).forEach((list) => list.forEach((a) => {
      if (a.kind === 'nav' && byId.current[a.to]) loadScreen(byId.current[a.to].file);
    }));
    return true;
  }, [mode]);

  const go = useCallback(async (id, tr, dur) => {
    if (!byId.current[id]) return;
    const cur = current.current;
    if (cur) stack.current.push({ id: cur.s.id, scroll: curScroll(), tr, dur });
    if (histOK.current) {
      try { window.history.pushState({ id }, '', '#/' + id); } catch (e) { histOK.current = false; }
    }
    await show(id, tr, dur, false, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const internalBack = useCallback(() => {
    const prev = stack.current.pop();
    if (!prev) return false;
    show(prev.id, prev.tr, prev.dur, true, prev.scroll);
    return true;
  }, [show]);

  const back = useCallback((fallback) => {
    if (stack.current.length) {
      internalBack();
      if (histOK.current) { ignorePop.current++; try { window.history.back(); } catch (e) { ignorePop.current--; } }
      return;
    }
    if (fallback && byId.current[fallback]) go(fallback, 'INSTANT', 0);
  }, [go, internalBack]);

  useEffect(() => {
    const onPop = () => {
      if (ignorePop.current > 0) { ignorePop.current--; return; }
      const id = getHashId();
      const top = stack.current[stack.current.length - 1];
      if (top && top.id === id) internalBack();
      else if (id && (!current.current || current.current.s.id !== id)) {
        if (current.current) stack.current.push({ id: current.current.s.id, scroll: curScroll(), tr: 'INSTANT', dur: 0 });
        show(id, 'INSTANT', 0, false, 0);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalBack, show]);

  // first screen
  useEffect(() => {
    if (!manifest) return;
    const first = (manifest.starts[0] && manifest.starts[0].id) || manifest.screens[0].id;
    const id = getHashId() && byId.current[getHashId()] ? getHashId() : first;
    try { window.history.replaceState({ id }, '', '#/' + id); } catch (e) { histOK.current = false; }
    show(id, 'INSTANT', 0, false, 0);
  }, [manifest, show]);

  // ---------- actions ----------
  const run = useCallback((a) => {
    if (a.kind === 'nav') go(a.to, a.tr, a.dur);
    else if (a.kind === 'back') back(a.to);
    else if (a.kind === 'scroll') {
      const c = current.current; if (!c) return;
      const t = c.inner.querySelector(`[data-id="${a.to}"]`);
      let y = 0;
      if (t) {
        const base = c.inner.getBoundingClientRect();
        const k = base.height / c.s.h || 1;
        y = (t.getBoundingClientRect().top - base.top) / k;
      }
      if (mode === 'app') c.scroller.scrollTo({ top: y, behavior: 'smooth' });
      else window.scrollTo({ top: y * scale, behavior: 'smooth' });
    } else if (a.kind === 'url' && a.url) window.open(a.url, '_blank', 'noopener');
  }, [go, back, mode, scale]);

  const onMount = useCallback((c) => {
    current.current = c;
    // Figma "After delay" interactions on the frame itself
    const topEl = c.inner.querySelector(`[data-id="${c.s.id}"]`);
    if (topEl && topEl.hasAttribute('data-pi')) {
      (c.s.actions[+topEl.getAttribute('data-pi')] || []).forEach((a) => {
        if (a.ev === 'AFTER_TIMEOUT') {
          timers.current.push(setTimeout(() => { if (current.current === c) run(a); }, (a.delay || 0) * 1000));
        }
      });
    }
  }, [run]);

  // Figma hit-testing: the topmost layer that HAS an interaction wins;
  // layers without interactions do not block clicks on hotspots below them.
  const actionsAt = (x, y, evs) => {
    const c = current.current;
    if (!c) return null;
    const stackEls = document.elementsFromPoint(x, y);
    const seen = new Set();
    for (const el of stackEls) {
      let e = el.closest ? el.closest('[data-pi]') : null;
      while (e) {
        if (!seen.has(e)) {
          seen.add(e);
          const acts = (c.s.actions[+e.getAttribute('data-pi')] || []).filter((a) => evs.includes(a.ev));
          if (acts.length) return acts;
        }
        e = e.parentElement ? e.parentElement.closest('[data-pi]') : null;
      }
    }
    return null;
  };

  const ptr = useRef({ x: 0, y: 0, down: false, moved: false, drag: null });
  const handlers = {
    onPointerDown: (e) => { ptr.current = { x: e.clientX, y: e.clientY, down: true, moved: false, drag: actionsAt(e.clientX, e.clientY, ['DRAG']) }; },
    onPointerMove: (e) => {
      const p = ptr.current; if (!p.down) return;
      if (Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y) > 12) {
        if (!p.moved && p.drag && !busy.current) { const d = p.drag; p.drag = null; d.forEach(run); }
        p.moved = true;
      }
    },
    onPointerUp: () => { ptr.current.down = false; },
    onClick: (e) => {
      if (ptr.current.moved) { ptr.current.moved = false; return; }
      if (busy.current) return;
      const acts = actionsAt(e.clientX, e.clientY, CLICK_EVENTS);
      if (acts) { e.preventDefault(); acts.forEach(run); }
    },
  };

  // ---------- render ----------
  const glyphDefs = glyphs ? <div className="glyphs" dangerouslySetInnerHTML={{ __html: glyphs }} /> : null;
  const screensEls = glyphs ? layers.map((l) => (
    <Screen key={l.key} s={l.s} mode={mode} scale={scale} anim={l.anim} dur={l.dur} z={l.z}
      initialScroll={l.scroll} onMount={l.leaving ? null : onMount} />
  )) : null;

  const jump = (id) => {
    if (!byId.current[id]) return;
    stack.current = [];
    try { window.history.pushState({ id }, '', '#/' + id); } catch (e) { histOK.current = false; }
    show(id, 'INSTANT', 0, false, 0);
  };
  const curId = layers.length ? layers[layers.length - 1].s.id : null;

  if (mode === 'app') {
    const deviceStyle = mobile
      ? { width: DW, height: vh, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0 }
      : { width: DW, height: DH, transform: `scale(${scale})` };
    return (
      <div className={'stage' + (mobile ? ' mobile' : '')}>
        {glyphDefs}
        {!mobile && manifest ? (
          <nav className="flows">
            <h1>하나은행</h1>
            {manifest.starts.map((f) => (
              <a key={f.id} className={f.id === curId ? 'on' : ''} onClick={() => jump(f.id)}>{f.name}</a>
            ))}
          </nav>
        ) : null}
        <div className="device" style={deviceStyle}>
          <div className="vp" {...handlers}>{screensEls}</div>
        </div>
      </div>
    );
  }
  const top = layers[layers.length - 1];
  const wrapStyle = top ? { width: top.s.w * scale, height: top.s.h * scale } : null;
  return (
    <div className="web-stage">
      {glyphDefs}
      <div className="webwrap" style={wrapStyle} {...handlers}>{screensEls}</div>
    </div>
  );
}
