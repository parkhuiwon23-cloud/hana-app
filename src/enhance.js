// Interactions added on top of the Figma prototype:
//  - 홈/간편 toggle: the pill slides before the screen changes
//  - Amount keypads (이체, 적금 가입): keys really type an amount
//  - Values entered on one screen are shown on the next (e.g. 적금 금액)
// Typed text is drawn with the same Figma glyph outlines as the rest of the UI.

import { store as flowStore, mountFlows, mountExtras } from './flows.js';

const store = {}; // values shared between screens

const fmt = (v) => v.toLocaleString('ko-KR') + '원';

function byId(root, id) { return root.querySelector(`[data-id="${id}"]`); }

// Build glyph <use> markup for a string in a given Figma text style
function glyphMarkup(text, st, glyphMap, boxW) {
  const map = glyphMap[st.font] || {};
  let x = 0; const parts = [];
  for (const ch of text) {
    const g = map[ch]; if (!g) continue;
    parts.push(`<use href="#${g[0]}" transform="translate(${x.toFixed(2)} ${st.baseline.toFixed(2)}) scale(${st.fs} ${-st.fs})"/>`);
    x += g[1] * st.fs;
  }
  let x0 = 0;
  if (st.align === 'CENTER') x0 = (boxW - x) / 2;
  else if (st.align === 'RIGHT') x0 = boxW - x;
  return `<g transform="translate(${x0.toFixed(2)} 0)" fill="${st.color}">${parts.join('')}</g>`;
}

// Replaces a Figma text node with live text (keeps position / size / style)
function liveText(orig, st, glyphMap) {
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  t.setAttribute('class', 'N T typed');
  t.setAttribute('style', orig.getAttribute('style') || '');
  const w = parseFloat(orig.getAttribute('width')) || orig.getBBox().width;
  const h = parseFloat(orig.getAttribute('height')) || 30;
  t.setAttribute('width', w); t.setAttribute('height', h);
  t.style.overflow = 'visible';
  orig.after(t);
  return {
    set(text, pop) {
      if (text == null) { t.style.display = 'none'; orig.style.visibility = ''; return; }
      orig.style.visibility = 'hidden'; t.style.display = '';
      t.innerHTML = glyphMarkup(text, st, glyphMap, w);
      if (pop) { t.classList.remove('pop'); void t.getBoundingClientRect(); t.classList.add('pop'); }
    },
    shake() { const e = orig.style.visibility === 'hidden' ? t : orig; e.classList.remove('shake'); void e.getBoundingClientRect(); e.classList.add('shake'); },
  };
}

// position of an element inside the screen (design px)
function boxIn(el, inner, k) {
  const a = el.getBoundingClientRect(), b = inner.getBoundingClientRect();
  return { x: (a.left - b.left) / k, y: (a.top - b.top) / k, w: a.width / k, h: a.height / k };
}

export function enhance(c, api) {
  const root = c.layer; const inner = c.inner;
  const k = inner.getBoundingClientRect().height / c.s.h || 1;
  const fapi = Object.assign({ k }, api);
  mountFlows(c, fapi);
  mountExtras(c, fapi);
  const enh = c.s.enh; if (!enh) return null;
  const handlers = [];

  // ---------- 홈 / 간편 toggle ----------
  if (enh.toggle) {
    const T = enh.toggle;
    const btn = byId(root, T.btn), pill = byId(root, T.pill), home = byId(root, T.home), simple = byId(root, T.simple), track = byId(root, T.track);
    if (btn && pill && home && simple && track) {
      // take the 홈 label out of the pill so the pill can move on its own
      const pl = parseFloat(pill.style.left) || 0, pt = parseFloat(pill.style.top) || 0;
      home.style.left = (pl + (parseFloat(home.style.left) || 0)) + 'px';
      home.style.top = (pt + (parseFloat(home.style.top) || 0)) + 'px';
      pill.after(home);
      home.classList.add('tg-txt'); simple.classList.add('tg-txt');
      const trackW = parseFloat(track.style.width) || 56;
      const pillW = T.simpleBox.w + 2;
      const apply = (sel) => {
        if (sel === 'simple') { pill.style.left = (trackW - pillW) + 'px'; pill.style.width = pillW + 'px'; }
        else { pill.style.left = T.homeBox.x + 'px'; pill.style.width = T.homeBox.w + 'px'; }
        home.querySelectorAll('g').forEach((g) => g.setAttribute('fill', sel === 'home' ? T.on : T.off));
        simple.querySelectorAll('g').forEach((g) => g.setAttribute('fill', sel === 'simple' ? T.on : T.off));
      };
      apply(T.selected);
      requestAnimationFrame(() => pill.classList.add('tg-anim'));
      let busy = false;
      handlers.push((e) => {
        if (!btn.contains(e.target) || busy) return false;
        busy = true;
        apply(T.selected === 'home' ? 'simple' : 'home');
        setTimeout(() => api.runActionsOf(btn), 340);
        return true;
      });
    }
  }

  // ---------- text bound to stored values ----------
  (enh.binds || []).forEach((b) => {
    const el = byId(root, b.id); if (!el || store[b.store] == null) return;
    liveText(el, b.st, api.glyphMap).set(fmt(store[b.store]));
  });

  // ---------- amount keypad ----------
  if (enh.keypad) {
    const K = enh.keypad;
    const disp = byId(root, K.display);
    if (disp) {
      disp.removeAttribute('data-pi');
      const live = liveText(disp, K.st, api.glyphMap);
      let v = K.store && store[K.store] != null ? store[K.store] : K.init;
      const render = (pop) => live.set(v > 0 ? fmt(v) : null, pop);
      render(false);
      const dark = /255,\s*255,\s*255/.test(K.st.color);
      const layerFor = inner;
      const hitBoxes = [];
      const press = (key) => {
        const before = v;
        if (/^[0-9]$/.test(key)) {
          const nv = v * 10 + +key;
          if (nv > K.max) { live.shake(); return; }
          v = nv;
        } else if (key === 'back') v = Math.floor(v / 10);
        else if (key === '전액') v = K.all;
        else if (/만$/.test(key)) {
          const add = parseInt(key, 10) * 10000;
          if (v + add > K.max) { v = K.max; live.shake(); } else v += add;
        } else if (key === 'done') {
          if (v === 0 && K.store) { api.go(K.to, 'DISSOLVE', 0.25); return; }
          if (v === 0 || (K.min && v < K.min)) { live.shake(); return; }
          if (K.store) store[K.store] = v; else flowStore.amount = v;
          api.go(K.to, 'DISSOLVE', 0.22);
          return;
        }
        if (v !== before) render(true);
      };
      K.keys.forEach((kk) => {
        const el = byId(root, kk.id); if (!el) return;
        el.removeAttribute('data-pi');
        const b = boxIn(el, inner, k);
        const hit = document.createElement('div');
        hit.className = 'kp-hit' + (kk.quick ? ' quick' : '');
        let w, h;
        if (kk.quick) { w = b.w; h = b.h; }
        else { w = 88; h = 54; }
        Object.assign(hit.style, { left: (b.x + b.w / 2 - w / 2) + 'px', top: (b.y + b.h / 2 - h / 2) + 'px', width: w + 'px', height: h + 'px' });
        hit.style.setProperty('--rp', dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.07)');
        if (kk.quick) hit.style.borderRadius = '8px';
        const on = () => { hit.classList.add('on'); if (kk.quick) el.classList.add('kp-press'); };
        const off = () => { hit.classList.remove('on'); el.classList.remove('kp-press'); };
        hit.addEventListener('pointerdown', on);
        hit.addEventListener('pointerup', off);
        hit.addEventListener('pointerleave', off);
        hit.addEventListener('pointercancel', off);
        hit.addEventListener('click', (e) => { e.stopPropagation(); press(kk.key); });
        layerFor.appendChild(hit);
        hitBoxes.push({ x: parseFloat(hit.style.left), y: parseFloat(hit.style.top), w, h });
      });
      // swallow clicks between the keys (only the keypad itself)
      if (hitBoxes.length) {
        const x0 = Math.min(...hitBoxes.map((h) => h.x)), y0 = Math.min(...hitBoxes.map((h) => h.y));
        const x1 = Math.max(...hitBoxes.map((h) => h.x + h.w)), y1 = Math.max(...hitBoxes.map((h) => h.y + h.h));
        const area = document.createElement('div');
        area.className = 'kp-area';
        Object.assign(area.style, { left: x0 + 'px', top: y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' });
        area.addEventListener('click', (e) => e.stopPropagation());
        layerFor.insertBefore(area, layerFor.querySelector('.kp-hit'));
      }
    }
  }

  return {
    click(e) { for (const h of handlers) if (h(e)) return true; return false; },
  };
}
