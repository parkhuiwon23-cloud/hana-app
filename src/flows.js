// Extra flows that are not in the Figma file:
//  - 하이챗봇: voice input (listening -> live transcript) and answer result
//  - 이체: 직접 입력 (bank + account) -> amount -> confirm -> complete
//  - 메뉴: category chips (select / scroll / expand-collapse) + missing sections
// New screens use the same design tokens as the Figma file (Pretendard, #009178, #1c1b1b ...).

export const store = {
  amount: 0,
  recipient: null, // { bank, acct }
  chatQ: null,
};

const GREEN = '#009178';
const won = (v) => v.toLocaleString('ko-KR') + '원';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtAcct = (d) => {
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + '-' + d.slice(3);
  return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
};
const now = () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const BALANCE = 346698;

/* ---------------- icons ---------------- */
const ICON_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="#1c1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_DOWN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#1c1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_DEL = '<svg width="28" height="22" viewBox="0 0 28 22"><path d="M9 1h16a2 2 0 012 2v16a2 2 0 01-2 2H9L1 11z" fill="#4d4d4d"/><path d="M13 7l8 8M21 7l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';

/* ---------------- custom screens ---------------- */
function screen(id, name, body, actions, bg = '#ffffff') {
  return { id, name, w: 390, h: 840, bg, custom: true, fixed: '', actions,
    html: `<div class="cx" data-id="${id}" style="position:absolute;left:0;top:0;width:390px;height:840px;background:${bg}">${body}</div>` };
}
const header = (title, right) => `
  <div class="cx-header">
    <div class="cx-back" data-pi="0">${ICON_BACK}</div>
    <div class="cx-title">${title}</div>
    ${right ? `<div class="cx-right" data-pi="0">${right}</div>` : ''}
  </div>`;

const BANKS = ['하나은행', 'KB국민은행', '신한은행', '우리은행', 'NH농협은행', 'IBK기업은행', '카카오뱅크', '토스뱅크', '케이뱅크'];

function keypad() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', ''];
  return `<div class="cx-keypad">${keys.map((k) => k === '' ? '<div></div>' :
    `<div class="cx-key" data-key="${k}">${k === 'back' ? ICON_DEL : k}</div>`).join('')}</div>`;
}

export const CUSTOM_SCREENS = {
  'c:tr-account': () => screen('c:tr-account', '이체 - 직접 입력', `
    ${header('이체', '취소')}
    <div class="cx-h1" style="top:104px">어디로 보낼까요?</div>
    <div class="cx-label" style="top:170px">은행</div>
    <div class="cx-field" data-id="c-bank" style="top:196px">
      <span class="cx-bank">${BANKS[0]}</span><span class="cx-chev">${ICON_DOWN}</span>
    </div>
    <div class="cx-label" style="top:276px">계좌번호</div>
    <div class="cx-field cx-acct" style="top:302px">
      <span class="cx-ph">계좌번호 입력</span><span class="cx-val"></span><span class="cx-caret"></span>
    </div>
    <div class="cx-hint" style="top:372px">숫자만 입력해주세요 (10~14자리)</div>
    <div style="position:absolute;left:0;top:448px;width:390px">${keypad()}</div>
    <div class="cx-btn disabled" data-id="c-next" style="top:763px">다음</div>
    <div class="cx-dim" data-id="c-dim"></div>
    <div class="cx-sheet" data-id="c-sheet">
      <div class="cx-sheet-title">은행 선택</div>
      <div class="cx-bankgrid">${BANKS.map((b) => `<div class="cx-bankitem" data-bank="${b}">${b}</div>`).join('')}</div>
    </div>`, [[{ ev: 'ON_CLICK', kind: 'back' }]]),

  'c:tr-confirm': () => {
    const r = store.recipient || { bank: '하나은행', acct: '' };
    return screen('c:tr-confirm', '이체 - 확인', `
    ${header('이체')}
    <div class="cx-h1" style="top:112px;line-height:36px">000님에게<br><span style="color:${GREEN}">${won(store.amount || 0)}</span>을<br>보낼까요?</div>
    <div class="cx-card" style="top:262px">
      <div class="cx-row"><span>받는 계좌</span><b>${esc(r.bank)} ${esc(fmtAcct(r.acct || '0000000000'))}</b></div>
      <div class="cx-row"><span>출금 계좌</span><b>하나은행 000-0000-0000</b></div>
      <div class="cx-row"><span>받는 분 통장 표시</span><b>김하나</b></div>
      <div class="cx-row"><span>내 통장 표시</span><b>000</b></div>
      <div class="cx-row"><span>수수료</span><b>면제</b></div>
    </div>
    <div class="cx-note" style="top:540px">이체 후에는 취소할 수 없어요. 받는 분 정보를 한 번 더 확인해주세요.</div>
    <div class="cx-btn" data-id="c-send" style="top:763px">이체하기</div>
    <div class="cx-busy" data-id="c-busy"><div class="cx-spin"></div><div>이체하고 있어요</div></div>`, [[{ ev: 'ON_CLICK', kind: 'back' }]]);
  },

  'c:tr-done': () => {
    const r = store.recipient || { bank: '하나은행', acct: '' };
    const amt = store.amount || 0;
    return screen('c:tr-done', '이체 - 완료', `
    <div class="cx-done-icon"><svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="36" fill="${GREEN}"/><path class="cx-check" d="M22 37l10 10 18-20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="cx-done-title">이체가 완료되었어요</div>
    <div class="cx-done-sub">000님에게 <b>${won(amt)}</b>을 보냈어요</div>
    <div class="cx-card" style="top:330px">
      <div class="cx-row"><span>받는 계좌</span><b>${esc(r.bank)} ${esc(fmtAcct(r.acct || '0000000000'))}</b></div>
      <div class="cx-row"><span>이체 금액</span><b>${won(amt)}</b></div>
      <div class="cx-row"><span>출금 후 잔액</span><b>${won(Math.max(0, BALANCE - amt))}</b></div>
      <div class="cx-row"><span>이체 일시</span><b>${now()}</b></div>
    </div>
    <div class="cx-btn2" data-pi="0" style="top:763px;left:20px;width:110px">추가 이체</div>
    <div class="cx-btn" data-pi="1" style="top:763px;left:140px;width:230px">확인</div>`,
    [[{ ev: 'ON_CLICK', kind: 'nav', to: '1:21810' }], [{ ev: 'ON_CLICK', kind: 'home', to: '1:24140' }]]);
  },
};

/* ---------------- helpers for Figma screens ---------------- */
function byId(root, id) { return root.querySelector(`[data-id="${id}"]`); }
function boxIn(el, inner, k) {
  const a = el.getBoundingClientRect(), b = inner.getBoundingClientRect();
  return { x: (a.left - b.left) / k, y: (a.top - b.top) / k, w: a.width / k, h: a.height / k };
}
function overlay(inner, box, cls, html) {
  const d = document.createElement('div');
  d.className = cls;
  Object.assign(d.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' });
  if (html != null) d.innerHTML = html;
  inner.appendChild(d);
  return d;
}

/* ---------------- 하이챗봇 ---------------- */
const VOICE_Q = '나에게 맞는 상품 없나';
const ANSWERS = {
  [VOICE_Q]: { text: '김하나님의 소비·저축 패턴을 보고<br>지금 가입하기 좋은 상품을 골랐어요.', cards: [
    { t: '도전365적금', d: '매일 저축 습관 만들기 · 최고 연 4.5%', to: '1:28386' },
    { t: '급여하나 월복리 적금', d: '급여 이체 시 우대금리 · 최고 연 4.15%', to: '1:28277' },
    { t: '하나 머니 통장', d: '하루만 맡겨도 이자 · 최고 연 2.0%', to: '1:28067' }] },
  '잔액조회를 하고 싶어': { text: '입출금 자립예탁금 잔액은<br><b>346,698원</b>이에요.', cards: [{ t: '전체계좌 보기', d: '내 모든 계좌 잔액과 거래내역', to: '1:26911' }] },
  '대출이자에 대해 알고싶어': { text: '현재 이용 중인 대출은 없어요.<br>예상 금리를 먼저 확인해 볼까요?', cards: [{ t: '대출 상품 둘러보기', d: '내 조건으로 예상 금리 확인', to: '1:28067' }] },
  '호주 달러로 환전하는 방법은?': { text: '앱에서 환전 신청 후<br>가까운 영업점에서 받을 수 있어요.', cards: [{ t: '영업점 찾기', d: '환전 가능한 가까운 영업점', to: '1:21986' }] },
  '이번 달 결제 예정 금액은 얼마야?': { text: '이번 달 카드 결제 예정 금액은<br><b>340,000원</b>이에요.', cards: [{ t: '지출 분석 보기', d: '이번 달 소비 흐름 확인', to: '1:25347' }] },
  '잔여 한도를 알려줘': { text: '오늘 남은 이체 한도는<br><b>5,000,000원</b>이에요.', cards: [{ t: '이체하기', d: '바로 이체하러 가기', to: '1:21810' }] },
  '고유가 피해지원금에 대해 알려줘': { text: '고유가 피해지원금은 정부 지원 사업으로,<br>대상 여부를 먼저 확인해야 해요.', cards: [{ t: '알짜 금융 정보 보기', d: '요즘 20대가 주목하는 정보', to: '1:24140' }] },
};
const answerFor = (q) => ANSWERS[q] || { text: '말씀하신 내용을 확인했어요.<br>관련 메뉴로 안내해 드릴게요.', cards: [{ t: '전체 메뉴', d: '원하는 업무를 바로 찾아보세요', to: '1:22573' }] };

function typeInto(el, text, speed, done) {
  let i = 0; el.textContent = '';
  const t = setInterval(() => {
    i++; el.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(t); done && done(); }
  }, speed);
  return () => clearInterval(t);
}

// replaces the "무엇이든 물어보세요." input placeholder with a live input
function chatInput(root, inner, k, phId, micId) {
  const ph = byId(root, phId); const mic = byId(root, micId);
  if (!ph) return null;
  const b = boxIn(ph, inner, k);
  const live = overlay(inner, { x: b.x, y: b.y, w: 250, h: b.h }, 'cx-chatin');
  let ring = null;
  if (mic) { const m = boxIn(mic, inner, k); ring = overlay(inner, { x: m.x - 4, y: m.y - 4, w: m.w + 8, h: m.h + 8 }, 'cx-micring'); }
  return {
    listen() { ph.style.visibility = 'hidden'; live.innerHTML = '<span class="cx-listen">듣고 있어요<i></i><i></i><i></i></span>'; ring && ring.classList.add('on'); },
    type(text, done) { ph.style.visibility = 'hidden'; live.innerHTML = '<span class="cx-typed"></span>'; return typeInto(live.firstChild, text, 70, () => { ring && ring.classList.remove('on'); done && done(); }); },
    reset() { live.innerHTML = ''; ph.style.visibility = ''; ring && ring.classList.remove('on'); },
  };
}

function mountChatHome(c, api) { // 1:25873
  const { layer: root, inner } = c; const k = api.k;
  const input = chatInput(root, inner, k, '1:25921', '1:25922');
  let busy = false;
  const ask = (q, voice) => {
    if (busy) return; busy = true;
    if (voice) {
      input.listen();
      setTimeout(() => input.type(q, () => setTimeout(() => { store.chatQ = q; api.go('1:25927'); }, 450)), 1300);
    } else {
      input.type(q, () => setTimeout(() => { store.chatQ = q; api.go('1:25927'); }, 300));
    }
  };
  const bar = byId(root, '1:25919');
  if (bar) api.link(bar, () => ask(VOICE_Q, true), true);
  // suggestion chips
  ['1:25899', '1:25902', '1:25905', '1:25909', '1:25912', '1:25915'].forEach((id) => {
    const el = byId(root, id); if (!el) return;
    const q = (el.querySelector('svg.T') || {}).getAttribute ? el.querySelector('svg.T').getAttribute('aria-label').trim() : '';
    api.link(el, () => ask(q, false));
  });
}

function renderAnswer(c, api, q) {
  const { layer: root, inner } = c; const k = api.k;
  // question bubble: replace the Figma text if the question is different
  const bubbleWrap = byId(root, '1:25948');
  if (bubbleWrap && q !== VOICE_Q) {
    bubbleWrap.style.visibility = 'hidden';
    const b = boxIn(bubbleWrap, inner, k);
    const old = inner.querySelector('.cx-qbubble'); if (old) old.remove();
    overlay(inner, { x: 20, y: b.y, w: 350, h: 80 }, 'cx-qbubble', `<div class="cx-bubble">${esc(q)}</div><div class="cx-time">오전 00:00</div>`);
  }
  const loading = byId(root, '1:25955');
  const a = answerFor(q);
  const base = loading ? boxIn(loading, inner, k) : { x: 20, y: 230 };
  const old = inner.querySelector('.cx-answer'); if (old) old.remove();
  if (loading) loading.style.opacity = '1';
  setTimeout(() => {
    if (loading) { loading.style.transition = 'opacity .25s'; loading.style.opacity = '0'; }
    const box = overlay(inner, { x: 20, y: base.y - 2, w: 350, h: 420 }, 'cx-answer', `
      <div class="cx-a-text">${a.text}</div>
      ${a.cards.map((cd, i) => `<div class="cx-a-card" data-i="${i}" style="animation-delay:${0.12 + i * 0.08}s"><div><b>${cd.t}</b><span>${cd.d}</span></div>${'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#4d4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'}</div>`).join('')}`);
    box.querySelectorAll('.cx-a-card').forEach((el) => api.link(el, { kind: 'nav', to: a.cards[+el.dataset.i].to }));
  }, 1500);
}

function mountChatAnswer(c, api) { // 1:25927
  const q = store.chatQ || VOICE_Q;
  renderAnswer(c, api, q);
  const input = chatInput(c.layer, c.inner, api.k, '1:25961', '1:25962');
  const bar = byId(c.layer, '1:25959');
  let busy = false;
  if (bar && input) api.link(bar, () => {  // eslint-disable-line
    if (busy) return; busy = true;
    input.listen();
    setTimeout(() => input.type(VOICE_Q, () => setTimeout(() => { busy = false; input.reset(); store.chatQ = VOICE_Q; renderAnswer(c, api, VOICE_Q); }, 400)), 1300);
  }, true);
}

/* ---------------- 이체 ---------------- */
function mountAccountInput(c, api) { // c:tr-account
  const root = c.layer;
  let digits = ''; let bank = BANKS[0];
  const val = root.querySelector('.cx-val'), ph = root.querySelector('.cx-ph'), next = byId(root, 'c-next');
  const render = () => {
    val.textContent = fmtAcct(digits); ph.style.display = digits ? 'none' : '';
    next.classList.toggle('disabled', digits.length < 10);
    val.classList.remove('pop'); void val.offsetWidth; val.classList.add('pop');
  };
  root.querySelectorAll('.cx-key').forEach((el) => {
    el.addEventListener('pointerdown', () => el.classList.add('on'));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, () => el.classList.remove('on')));
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const kk = el.dataset.key;
      if (kk === 'back') digits = digits.slice(0, -1);
      else if (digits.length < 14) digits += kk;
      else { root.querySelector('.cx-acct').classList.remove('shake'); void root.offsetWidth; root.querySelector('.cx-acct').classList.add('shake'); }
      render();
    });
  });
  const sheet = byId(root, 'c-sheet'), dim = byId(root, 'c-dim');
  const open = (v) => { sheet.classList.toggle('open', v); dim.classList.toggle('open', v); };
  api.link(byId(root, 'c-bank'), () => open(true));
  dim.addEventListener('click', (e) => { e.stopPropagation(); open(false); });
  root.querySelectorAll('.cx-bankitem').forEach((el) => {
    if (el.dataset.bank === bank) el.classList.add('sel');
    api.link(el, () => {
      bank = el.dataset.bank;
      root.querySelectorAll('.cx-bankitem').forEach((x) => x.classList.toggle('sel', x === el));
      root.querySelector('.cx-bank').textContent = bank;
      setTimeout(() => open(false), 120);
    });
  });
  api.link(next, () => {
    if (digits.length < 10) { next.classList.remove('shake'); void next.offsetWidth; next.classList.add('shake'); return; }
    store.recipient = { bank, acct: digits }; store.amount = 0;
    api.go('1:21928');
  });
}

function mountConfirm(c, api) { // c:tr-confirm
  const root = c.layer; const busy = byId(root, 'c-busy');
  api.link(byId(root, 'c-send'), () => {
    busy.classList.add('on');
    setTimeout(() => api.go('c:tr-done', 0.25), 900);
  });
}

function mountTransferAmount(c, api) { // 1:21928 / 1:37634: show the account typed on the previous screen
  const r = store.recipient; if (!r) return;
  const { layer: root, inner } = c; const k = api.k;
  const ids = c.s.id === '1:21928' ? ['1:21938', '1:21939'] : ['1:37644', '1:37645'];
  const bankEl = byId(root, ids[0]), acctEl = byId(root, ids[1]);
  if (!bankEl || !acctEl) return;
  const b = boxIn(bankEl, inner, k);
  bankEl.style.visibility = 'hidden'; acctEl.style.visibility = 'hidden';
  overlay(inner, { x: b.x, y: b.y, w: 300, h: b.h }, 'cx-acctline', `${esc(r.bank)}&nbsp;&nbsp;${esc(fmtAcct(r.acct))}`);
}

/* ---------------- 메뉴 ---------------- */
const MENU_ADD = [
  { t: '자산관리', items: [['내 자산 현황', '1:26911'], ['자산리포트', '1:27131'], ['MY금융진단', '1:27371'], ['맞춤 자산 관리', '1:25202']] },
  { t: '예적금', items: [['예금·적금 가입', '1:28067'], ['적금 찾기', '1:28277'], ['상품 비교함', '1:28650']] },
  { t: '퇴직연금', items: [['퇴직연금 조회', '1:26911'], ['IRP 가입', '1:28067'], ['연금 수령 안내', '1:25873']] },
];
const MENU_LINKS = { '1:22701': '1:26911', '1:22703': '1:21810', '1:22709': '1:21810', '1:22711': '1:21713', '1:22713': '1:21847', '1:22715': '1:21810' };

function mountMenu(c, api) { // 1:22573
  const { layer: root, inner, scroller } = c; const k = api.k;
  // existing rows -> real destinations
  Object.keys(MENU_LINKS).forEach((id) => { const el = byId(root, id); if (el && !el.hasAttribute('data-pi')) api.link(el, { kind: 'nav', to: MENU_LINKS[id] }); });

  // add the missing sections (자산관리 / 예적금 / 퇴직연금) below 이체
  const host = byId(root, '1:22673'), lastSec = byId(root, '1:22706');
  const SEC_GAP = 40, ROW = 38;
  let extra = 0; const secTops = [];
  if (host && lastSec) {
    const hb = boxIn(host, inner, k), lb = boxIn(lastSec, inner, k);
    let y = lb.y + lb.h - hb.y + SEC_GAP; // relative to host
    const wrap = document.createElement('div');
    wrap.className = 'cx-menuadd';
    let html = '';
    MENU_ADD.forEach((sec) => {
      html += `<div class="cx-mline" style="top:${y - SEC_GAP / 2}px"></div>`;
      secTops.push(hb.y + y);
      html += `<div class="cx-msec" style="top:${y}px"><div class="cx-mtitle">${sec.t}</div>${sec.items.map((it, i) => `<div class="cx-mrow" data-to="${it[1]}" style="top:${34 + i * ROW}px"><span>${it[0]}</span></div>`).join('')}</div>`;
      y += 34 + sec.items.length * ROW + SEC_GAP;
    });
    wrap.innerHTML = html;
    host.appendChild(wrap);
    wrap.querySelectorAll('.cx-mrow').forEach((el) => api.link(el, { kind: 'nav', to: el.dataset.to }));
    extra = y - hb.h + 20;
    if (extra > 0) {
      [host, byId(root, '1:22582'), byId(root, c.s.id)].forEach((el) => { if (el) el.style.height = (parseFloat(el.style.height) + extra) + 'px'; });
      inner.style.height = (parseFloat(inner.style.height) + extra) + 'px';
    }
  }

  // category chips
  const chipIds = ['1:22675', '1:22679', '1:22683', '1:22687', '1:22691'];
  const chips = chipIds.map((id) => byId(root, id)).filter(Boolean);
  const secIds = ['1:22698', '1:22706'];
  const tops = secIds.map((id) => { const el = byId(root, id); return el ? boxIn(el, inner, k).y : 0; }).concat(secTops);
  const setActive = (i) => {
    chips.forEach((ch, j) => {
      const on = i === j;
      ch.querySelectorAll(':scope > .L').forEach((l) => { l.style.transition = 'background .2s'; l.style.background = on ? GREEN : '#e6e6e6'; });
      ch.querySelectorAll('svg.T g').forEach((g) => g.setAttribute('fill', on ? '#ffffff' : '#4d4d4d'));
    });
    panel.querySelectorAll('.cx-pchip').forEach((p, j) => p.classList.toggle('on', i === j));
    active = i;
  };
  let active = 0; let spyLock = 0;
  const go = (i) => {
    setActive(i);
    spyLock = Date.now() + 700;
    const stickyH = 76;
    scroller.scrollTo({ top: Math.max(0, tops[i] - stickyH - 10), behavior: 'smooth' });
  };
  // chip row: horizontally scrollable look + sticky under the top while scrolling
  const row = byId(root, '1:22674');
  const rowBox = row ? boxIn(row, inner, k) : null;
  // expand / collapse panel
  const chev = byId(root, '1:22696');
  const panel = document.createElement('div');
  panel.className = 'cx-chippanel';
  panel.innerHTML = `<div class="cx-pchips">${['조회', '이체', '자산관리', '예적금', '퇴직연금'].map((t, i) => `<div class="cx-pchip${i === 0 ? ' on' : ''}" data-i="${i}">${t}</div>`).join('')}</div>`;
  if (rowBox) Object.assign(panel.style, { left: '0px', top: (rowBox.y - 20) + 'px' });
  inner.appendChild(panel);
  let open = false;
  const toggle = (v) => {
    open = v; panel.classList.toggle('open', v);
    if (chev) { chev.style.transition = 'transform .25s'; chev.style.transformOrigin = '50% 50%'; chev.style.rotate = v ? '180deg' : '0deg'; }
  };
  chips.forEach((ch, i) => api.link(ch, () => go(i)));
  panel.querySelectorAll('.cx-pchip').forEach((p) => api.link(p, () => { toggle(false); go(+p.dataset.i); }));
  if (chev) api.link(chev, () => toggle(!open));
  // sticky chip row + panel, and scroll-spy
  const stickEls = [row, byId(root, '1:22695'), chev].filter(Boolean).filter((e, i, arr) => !arr.some((o) => o !== e && o.contains(e)));
  if (scroller && rowBox) {
    const y0 = rowBox.y - 20; // chip block top
    const bg = document.createElement('div');
    bg.className = 'cx-chipbg';
    Object.assign(bg.style, { left: '0px', top: (parseFloat(row.style.top) - 20) + 'px', width: '390px', height: '76px' });
    row.parentNode.insertBefore(bg, row);
    stickEls.forEach((e) => { e.style.zIndex = '5'; });
    bg.style.zIndex = '4';
    stickEls.push(bg);
    const onScroll = () => {
      const t = scroller.scrollTop; const d = Math.max(0, t - y0);
      stickEls.forEach((e) => { e.style.translate = `0 ${d}px`; });
      panel.style.translate = `0 ${d}px`;
      bg.classList.toggle('stuck', d > 0);
      if (Date.now() > spyLock) {
        let i = 0; tops.forEach((ty, j) => { if (t + 76 + 40 >= ty) i = j; });
        if (i !== active) setActive(i);
      }
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
  }
}

/* ---------------- entry ---------------- */
export function mountFlows(c, api) {
  const id = c.s.id;
  if (id === 'c:tr-account') mountAccountInput(c, api);
  if (id === 'c:tr-confirm') mountConfirm(c, api);
  if (id === '1:25873') mountChatHome(c, api);
  if (id === '1:25927') mountChatAnswer(c, api);
  if (id === '1:21928' || id === '1:37634') mountTransferAmount(c, api);
  if (id === '1:22573') mountMenu(c, api);
  // 이체 화면들의 "직접 입력" -> 계좌 직접 입력
  if (id === '1:21713' || id === '1:21769' || id === '1:21810') {
    const lbl = [...c.layer.querySelectorAll('svg.T')].find((s) => (s.getAttribute('aria-label') || '').trim() === '직접 입력');
    let box = lbl ? lbl.parentElement : null;
    while (box && !(box.hasAttribute && box.hasAttribute('data-id') && parseFloat(box.style.width) >= 300)) box = box.parentElement;
    if (box) api.link(box, { kind: 'nav', to: 'c:tr-account' }, true);
  }
}

/* ---------------- toast ---------------- */
export function toast(c, text) {
  const host = c.layer; if (!host) return;
  let t = host.querySelector('.cx-toast');
  if (!t) { t = document.createElement('div'); t.className = 'cx-toast'; host.appendChild(t); }
  t.textContent = text;
  t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1700);
}

/* ---------------- radios (금융진단 설문) ---------------- */
const CHECK_SVG = '<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#009178"/><path d="M5.6 10.3l3 3 5.8-6.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
store.radio = {};
function mountRadios(c, api, radios) {
  const root = c.layer; const key = 'survey';
  const items = radios.map((r) => ({ opt: byId(root, r.option), radio: byId(root, r.radio) })).filter((x) => x.opt && x.radio);
  items.forEach((it) => {
    const chk = document.createElement('div');
    chk.className = 'cx-radiochk';
    chk.innerHTML = CHECK_SVG;
    chk.setAttribute('style', it.radio.getAttribute('style'));
    chk.style.position = 'absolute';
    it.radio.after(chk);
    it.chk = chk;
  });
  const sel = (i, anim) => {
    items.forEach((it, j) => {
      const on = i === j;
      it.chk.classList.toggle('on', on);
      if (on && anim) { it.chk.classList.remove('pop'); void it.chk.offsetWidth; it.chk.classList.add('pop'); }
      it.opt.querySelectorAll(':scope > .B').forEach((b) => { if (b._bc == null) b._bc = b.style.borderColor; b.style.transition = 'border-color .2s'; b.style.borderColor = on ? '#009178' : b._bc; });
    });
    store.radio[key] = i;
  };
  if (store.radio[key] != null) sel(store.radio[key], false);
  items.forEach((it, i) => api.link(it.opt, () => sel(i, true)));
}

/* ---------------- buttons without a destination ---------------- */
const DEAD_MAP = {
  '금융진단': { kind: 'nav', to: '1:27371' }, '5월 지출': { kind: 'nav', to: '1:25347' },
  '차근차근, 목표를 다시 정해요': { kind: 'nav', to: '1:25202' }, '인증서 없이 신용점수 올려요': { kind: 'nav', to: '1:27131' },
  '더보기': { kind: 'nav', to: '1:26911' }, '김하나님 맞춤 상품': { kind: 'nav', to: '1:28277' }, '20대 인기 예적금 상품': { kind: 'nav', to: '1:28277' },
  '증권': { kind: 'nav', to: '1:26302' }, '서울백화점': { kind: 'nav', to: '1:22460' }, '새로 발급': { kind: 'nav', to: '1:23516' },
  '요즘 20대가 주목하는 알짜 금융 정': { kind: 'nav', to: '1:28067' }, 'MY 거래대금 순위': { kind: 'nav', to: '1:26611' },
  '실시간 관심 상품 순위': { kind: 'nav', to: '1:26611' }, '실시간 차트': { kind: 'nav', to: '1:26302' },
  '00은행': { kind: 'nav', to: 'c:tr-account' },
  '인증요청': { toast: '필수 약관에 동의해주세요' },
  '하나금융그룹': { toast: '하나금융그룹 서비스로 연결돼요' }, '하나카드': { toast: '하나카드 앱으로 연결돼요' },
  '하나머니': { toast: '하나머니 앱으로 연결돼요' }, '하나증권': { toast: '하나증권 앱으로 연결돼요' }, '하나캐피탈': { toast: '하나캐피탈로 연결돼요' },
};
const CHAT_QS = ['잔액조회를 하고 싶어', '대출이자에 대해 알고싶어', '호주 달러로 환전하는 방법은?', '이번 달 결제 예정 금액은 얼마야?', '잔여 한도를 알려줘', '고유가 피해지원금에 대해 알려줘'];
function mountDead(c, api, dead) {
  dead.forEach((d) => {
    const el = byId(c.layer, d.id); if (!el) return;
    const label = d.label;
    if (CHAT_QS.includes(label)) { api.link(el, () => { store.chatQ = label; api.go('1:25927'); }); return; }
    const m = DEAD_MAP[label];
    if (m && m.kind) { api.link(el, m); return; }
    const msg = (m && m.toast) || (label ? `'${label}' 화면은 준비 중이에요` : '준비 중인 화면이에요');
    api.link(el, () => toast(c, msg));
  });
}

export function mountExtras(c, api) {
  const e = c.s.enh || {};
  if (e.radios) mountRadios(c, api, e.radios);
  if (e.dead) mountDead(c, api, e.dead);
}
