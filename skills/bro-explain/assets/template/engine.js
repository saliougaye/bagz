/* ENGINE: sidebar, pages, "On this page", search, diagrams, theme. A new guide does not need to touch it. */
const FLAT = [], PARENTS = {};
(function walk(items, parents) { items.forEach(it => { if (it.page) { FLAT.push(it.page); PARENTS[it.page] = parents; } else walk(it.items, [...parents, it.id]); }); })(NAV.flatMap(g => g.items), []);
const navTitle = p => PAGES[p].nav || PAGES[p].title;

function contentsIndex() {
  const list = (items, sub) => `<ul class="idx${sub ? ' sub' : ''}">${items.map(it => it.page
    ? `<li><a href="#/${it.page}"><span class="t">${esc(navTitle(it.page))}</span><span class="d">${esc(PAGES[it.page].line || '')}</span></a></li>`
    : `<li><span class="d">${esc(it.folder)}</span>${list(it.items, true)}</li>`).join('')}</ul>`;
  return NAV.map((g, i) => `<section class="idx-g" aria-labelledby="cg-${i}"><h3 id="cg-${i}">${esc(g.group)}</h3>${list(g.items)}</section>`).join('');
}

/* =====================================================================
   SHARED PIECES
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const announce = t => { const s = $('#status'); s.textContent = ''; setTimeout(() => { s.textContent = t; }, 30); };
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
$('#kbd-mod').textContent = isMac ? '⌘' : 'Ctrl';
$('#search-open').setAttribute('aria-label', `${T.searchGuide} (${isMac ? 'Command' : 'Control'} K)`);

/* =====================================================================
   NODE DIAGRAM: canvas with drag and zoom, nodes are buttons, details
   panel, full screen, keyboard. Zones and edge ports are computed.
   ===================================================================== */
let DGUID = 0;
function createDiagram(host, spec, opts = {}) {
  if (spec.type && spec.type !== 'nodes') return createPanelDiagram(host, spec);
  const full = !!opts.full, uid = 'dg' + (++DGUID);
  const nodes = spec.nodes, edges = spec.edges, kinds = spec.kinds || {};
  const NW = spec.nodeW, NH = spec.nodeH, W = spec.w, H = spec.h;
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const zoneT = Object.fromEntries((spec.zones || []).map(z => [z.id, z.title]));
  const order = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x).map(n => n.id);
  const kind = n => kinds[n.kind];
  const unit = kinds && Object.keys(kinds).length ? T.steps : T.blocks;
  const nbr = n => { const i = edges.filter(e => e.to === n.id).map(e => byId[e.from].title), o = edges.filter(e => e.from === n.id).map(e => byId[e.to].title); return `${i.length ? (T.receivesFrom + ': ') + i.join(', ') + '. ' : ''}${o.length ? (T.goesTo + ': ') + o.join(', ') + '.' : ''}`; };

  /* ports: side picked from relative position; several edges on one side spread out */
  const RC = id => ({ x: byId[id].x, y: byId[id].y, w: NW, h: NH });
  const routes = (() => {
    const E = edges.map(e => { const a = RC(e.from), b = RC(e.to); let sa, sb;
      if (b.y >= a.y + a.h - 1) { sa = 'b'; sb = 't'; } else if (b.y + b.h <= a.y + 1) { sa = 't'; sb = 'b'; }
      else if (b.x >= a.x + a.w) { sa = 'r'; sb = 'l'; } else { sa = 'l'; sb = 'r'; }
      return { e, sa: e.fs || sa, sb: e.ts || sb }; });
    const ports = {};
    E.forEach(o => { (ports[o.e.from + ':' + o.sa] ||= []).push({ o, end: 'a', other: RC(o.e.to) }); (ports[o.e.to + ':' + o.sb] ||= []).push({ o, end: 'b', other: RC(o.e.from) }); });
    Object.entries(ports).forEach(([k, list]) => { const [id, side] = k.split(':'), r = RC(id), v = side === 't' || side === 'b';
      list.sort((p, q) => v ? (p.other.x - q.other.x) : (p.other.y - q.other.y));
      list.forEach((p, j) => { const f = (j + 1) / (list.length + 1);
        p.o[p.end] = side === 't' ? { x: r.x + r.w * f, y: r.y } : side === 'b' ? { x: r.x + r.w * f, y: r.y + r.h } : side === 'l' ? { x: r.x, y: r.y + r.h * f } : { x: r.x + r.w, y: r.y + r.h * f }; }); });
    const N = { t: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0] };
    return E.map(o => { const a = o.a, b = o.b, d = Math.max(22, Math.hypot(b.x - a.x, b.y - a.y) / 2.4);
      const c1 = [a.x + N[o.sa][0] * d, a.y + N[o.sa][1] * d], c2 = [b.x + N[o.sb][0] * d, b.y + N[o.sb][1] * d];
      return { e: o.e, d: `M${a.x},${a.y} C${c1} ${c2} ${b.x},${b.y}`, mx: (a.x + 3 * c1[0] + 3 * c2[0] + b.x) / 8, my: (a.y + 3 * c1[1] + 3 * c2[1] + b.y) / 8 }; });
  })();

  const body = n => `<p>${esc(n.what)}</p>${n.zone ? `<dl class="pn-f"><div><dt>${T.zone}</dt><dd>${esc(zoneT[n.zone])}</dd></div>${(n.fields || []).map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>` : (n.fields || []).length ? `<dl class="pn-f">${n.fields.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>` : ''}`;
  const conns = n => { const i = edges.filter(e => e.to === n.id), o = edges.filter(e => e.from === n.id);
    const li = (e, other) => `<li><button type="button" data-go="${other}">${esc(byId[other].title)}</button>${e.text ? `: ${esc(e.text)}` : e.label ? ` (${esc(e.label)})` : ''}</li>`;
    return `${i.length ? `<h5 class="pn-ct">${T.receivesFrom}</h5><ul class="pn-c">${i.map(e => li(e, e.from)).join('')}</ul>` : ''}${o.length ? `<h5 class="pn-ct">${T.goesTo}</h5><ul class="pn-c">${o.map(e => li(e, e.to)).join('')}</ul>` : ''}`; };
  const kg = k => `<svg class="kg" viewBox="0 0 16 16" aria-hidden="true" style="--k:var(--k-${k})">${ICON.shape[k]}</svg>`;

  host.innerHTML = `<div class="dg${full ? ' is-full' : ''}" id="${uid}">
  <div class="dg-bar" role="group" aria-label="${T.diagramControls}">
    <div class="dg-grp"><button type="button" class="dg-btn" data-a="out" aria-label="${T.zoomOut}">−</button><span class="dg-zoom" aria-hidden="true">100%</span><button type="button" class="dg-btn" data-a="in" aria-label="${T.zoomIn}">+</button><button type="button" class="dg-btn" data-a="fit">${T.fit}</button></div>
    ${full ? '' : `<div class="dg-grp dg-right"><button type="button" class="dg-btn" data-a="full">${ICON.full}${T.fullScreen}</button></div>`}
  </div>
  <div class="dg-body">
    <div class="dg-vp" tabindex="0" role="group" aria-label="${T.diagramCanvas}: ${esc(spec.title)}" aria-describedby="${uid}-h">
      <svg class="dg-bg" aria-hidden="true"><defs><pattern id="${uid}-pt" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2"/></pattern></defs><rect width="100%" height="100%" fill="url(#${uid}-pt)"/></svg>
      <div class="dg-world" style="width:${W}px;height:${H}px">
        ${(spec.zones || []).map(z => `<div class="dg-zone" style="left:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px" aria-hidden="true"><span class="dg-zl">${esc(z.title)}</span></div>`).join('')}
        <svg class="dg-edges" width="${W}" height="${H}" aria-hidden="true"><defs><marker id="${uid}-a" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path class="dg-ar" d="M0,0 L10,4 L0,8z"/></marker><marker id="${uid}-b" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path class="dg-ar-on" d="M0,0 L12,5 L0,10z"/></marker></defs>
          ${routes.map(r => `<path class="dg-e" data-f="${r.e.from}" data-t="${r.e.to}" d="${r.d}" marker-end="url(#${uid}-a)"/>${r.e.label ? `<text class="dg-el" data-f="${r.e.from}" data-t="${r.e.to}" x="${r.mx}" y="${r.my}">${esc(r.e.label)}</text>` : ''}`).join('')}</svg>
        ${order.map(id => { const n = byId[id]; return `<button type="button" class="dg-n${n.kind ? ' has-k k-' + n.kind : ''}" data-id="${id}" aria-pressed="false" aria-describedby="${uid}-d-${id}" style="left:${n.x}px;top:${n.y}px;width:${NW}px;height:${NH}px${n.kind ? `;--k:var(--k-${n.kind})` : ''}"><span class="dg-t">${kind(n) ? kg(n.kind) : ''}${esc(n.title)}</span>${n.sub ? `<span class="dg-s">${esc(n.sub)}</span>` : ''}<span class="sr" id="${uid}-d-${id}">${esc((kind(n) ? kind(n).label + '. ' : '') + (n.zone ? (T.zone + ': ') + zoneT[n.zone] + '. ' : '') + nbr(n))}</span></button>`; }).join('')}
      </div>
    </div>
    <aside class="dg-panel" hidden aria-label="${T.details}"></aside>
  </div>
  <div class="dg-foot"><span class="dg-leg"><span>${nodes.length} ${unit}</span>${Object.entries(kinds).map(([id, k]) => `<span class="it">${kg(id)}${esc(k.label)}</span>`).join('')}</span><span class="dg-hint" id="${uid}-h">${esc(spec.hint)}</span></div></div>`;

  const root = $('.dg', host), vp = $('.dg-vp', root), world = $('.dg-world', root), panel = $('.dg-panel', root), zoomL = $('.dg-zoom', root), pat = $('pattern', root);
  const nodeEl = id => $(`.dg-n[data-id="${id}"]`, root);
  let tx = 0, ty = 0, sc = 1, userMoved = false, selected = null, dragged = false;
  const apply = (anim = false) => {
    world.classList.toggle('is-anim', anim && !reduced());
    world.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`;
    pat.setAttribute('patternTransform', `translate(${tx} ${ty}) scale(${sc})`);
    zoomL.textContent = Math.round(sc * 100) + '%';
  };
  const vpSize = () => ({ w: vp.clientWidth, h: vp.clientHeight });
  const wide = () => root.clientWidth > 640;
  const panelW = () => (!panel.hidden && wide()) ? panel.offsetWidth : 0;
  const panelH = () => (!panel.hidden && !wide()) ? panel.offsetHeight : 0;
  /* readable start scale: never below READ; if the drawing is larger, start on the first node */
  const READ = full ? .8 : .72;
  function setH() { if (full) return; const w = root.clientWidth || 700; const s = Math.max(READ, Math.min(1, (w - 48) / W)); vp.style.height = Math.round(Math.max(340, Math.min(640, H * s + 48))) + 'px'; }
  function fit(all = false, anim = false) {
    const { w, h } = vpSize(); if (!w || !h) return; const pad = 24;
    const f = Math.min((w - pad * 2) / W, (h - pad * 2) / H, full ? 1.25 : 1);
    sc = all ? Math.max(.3, f) : Math.max(READ, f);
    const f0 = byId[order[0]];
    tx = W * sc + pad * 2 <= w ? (w - W * sc) / 2 : Math.min(pad, Math.max(w - pad - W * sc, w / 2 - (f0.x + NW / 2) * sc));
    ty = H * sc + pad * 2 <= h ? (h - H * sc) / 2 : pad; apply(anim);
  }
  function zoomAt(cx, cy, f, anim = false) { const n = Math.max(.3, Math.min(2, sc * f)); tx = cx - (cx - tx) * (n / sc); ty = cy - (cy - ty) * (n / sc); sc = n; userMoved = true; apply(anim); }
  const zoomC = f => { const { w, h } = vpSize(); zoomAt((w - panelW()) / 2, (h - panelH()) / 2, f, true); };
  function reveal(id) {
    const n = byId[id], { w, h } = vpSize(), m = 20, pw = panelW(), ph = panelH();
    const x0 = tx + n.x * sc, x1 = x0 + NW * sc, y0 = ty + n.y * sc, y1 = y0 + NH * sc; let moved = false;
    if (x0 < m) { tx += m - x0; moved = true; } else if (x1 > w - pw - m) { tx -= x1 - (w - pw - m); moved = true; }
    if (y0 < m) { ty += m - y0; moved = true; } else if (y1 > h - ph - m) { ty -= y1 - (h - ph - m); moved = true; }
    if (moved) { userMoved = true; apply(true); }
  }
  function highlight(id) {
    root.classList.toggle('has-hl', !!id);
    const near = new Set(id ? [id] : []);
    $$('.dg-e', root).forEach(e => { const on = !!id && (e.dataset.f === id || e.dataset.t === id); if (on) { near.add(e.dataset.f); near.add(e.dataset.t); } e.classList.toggle('is-on', on); e.setAttribute('marker-end', `url(#${uid}-${on ? 'b' : 'a'})`); });
    $$('.dg-el', root).forEach(e => e.classList.toggle('is-on', !!id && (e.dataset.f === id || e.dataset.t === id)));
    $$('.dg-n', root).forEach(b => b.classList.toggle('is-on', near.has(b.dataset.id)));
  }
  function select(id, focus = true) {
    selected = id; $$('.dg-n', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === id))); highlight(id);
    if (!id) { panel.hidden = true; panel.innerHTML = ''; return; }
    const n = byId[id];
    panel.innerHTML = `<div class="pn-h"><div>${kind(n) ? `<p class="pn-kind">${kg(n.kind)}${esc(kind(n).label)}</p>` : n.zone ? `<p class="pn-kind">${esc(zoneT[n.zone])}</p>` : ''}<h4 class="pn-t" tabindex="-1">${esc(n.title)}</h4></div><button type="button" class="pn-x" aria-label="${T.closeDetails}">${ICON.x}</button></div><div class="pn-body">${body(n)}${conns(n)}</div>`;
    panel.hidden = false; requestAnimationFrame(() => reveal(id));
    if (focus) $('.pn-t', panel).focus({ preventScroll: true });
    announce(`${T.details}: ${n.title}`);
  }
  const closePanel = () => { const id = selected; select(null); if (id) nodeEl(id)?.focus({ preventScroll: true }); };

  root.addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'in') zoomC(1.2); else if (a === 'out') zoomC(1 / 1.2); else if (a === 'fit') { userMoved = false; fit(true, true); }
    else if (a === 'full') openFull(spec);
    const go = e.target.closest('[data-go]'); if (go) select(go.dataset.go);
    if (e.target.closest('.pn-x')) closePanel();
    const nb = e.target.closest('.dg-n'); if (nb && !dragged) select(selected === nb.dataset.id ? null : nb.dataset.id);
    dragged = false;
  });
  root.addEventListener('pointerover', e => { const n = e.target.closest('.dg-n'); if (n && !selected) highlight(n.dataset.id); });
  root.addEventListener('pointerout', e => { if (e.target.closest('.dg-n') && !selected) highlight(null); });
  root.addEventListener('focusin', e => { const n = e.target.closest('.dg-n'); if (n && !selected) highlight(n.dataset.id); });
  root.addEventListener('focusout', e => { if (e.target.closest('.dg-n') && !selected && !root.contains(e.relatedTarget)) highlight(null); });

  /* keyboard: arrows = nearest node in that direction; + − 0 to zoom */
  function nearest(id, key) {
    const c = n => ({ x: n.x + NW / 2, y: n.y + NH / 2 }), o = c(byId[id]);
    const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[key];
    let best = null, bs = Infinity;
    nodes.forEach(n => { if (n.id === id) return; const p = c(n), dx = p.x - o.x, dy = p.y - o.y, along = dx * dir[0] + dy * dir[1]; if (along <= 4) return;
      const across = Math.abs(dx * dir[1] - dy * dir[0]), s = along + across * 2.2; if (s < bs) { bs = s; best = n.id; } });
    return best;
  }
  function focusNode(id) { const b = nodeEl(id); if (!b) return; reveal(id); b.focus({ preventScroll: true }); if (selected) select(id, false); }
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape' && selected) { e.preventDefault(); e.stopPropagation(); closePanel(); return; }
    const b = e.target.closest('.dg-n');
    if (b && e.key.startsWith('Arrow')) { e.preventDefault(); const t = nearest(b.dataset.id, e.key); if (t) focusNode(t); return; }
    if (e.target === vp || b) {
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomC(1.2); } else if (e.key === '-') { e.preventDefault(); zoomC(1 / 1.2); } else if (e.key === '0') { e.preventDefault(); userMoved = false; fit(true, true); }
      else if (e.target === vp && e.key.startsWith('Arrow')) { e.preventDefault(); const s = 48; if (e.key === 'ArrowLeft') tx += s; if (e.key === 'ArrowRight') tx -= s; if (e.key === 'ArrowUp') ty += s; if (e.key === 'ArrowDown') ty -= s; userMoved = true; apply(true); }
    }
  });

  /* pointer: drag with one finger or the mouse, pinch with two */
  const ptr = new Map(); let startPan = null, pinch = null;
  vp.addEventListener('pointerdown', e => {
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size === 1) startPan = { x: e.clientX, y: e.clientY, tx, ty, on: false };
    else if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), sc }; startPan = null; dragged = true; }
  });
  vp.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size === 2 && pinch) { const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = vp.getBoundingClientRect(); zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, (pinch.sc * d / pinch.d) / sc); return; }
    if (startPan) { const dx = e.clientX - startPan.x, dy = e.clientY - startPan.y;
      if (!startPan.on && Math.hypot(dx, dy) > 5) { startPan.on = true; dragged = true; vp.setPointerCapture(e.pointerId); vp.classList.add('is-pan'); }
      if (startPan.on) { tx = startPan.tx + dx; ty = startPan.ty + dy; userMoved = true; apply(); } }
  });
  const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; if (!ptr.size) { startPan = null; vp.classList.remove('is-pan'); setTimeout(() => { dragged = false; }, 0); } };
  vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
  vp.addEventListener('wheel', e => { const r = vp.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * .0025)); }
    else if (full) { e.preventDefault(); tx -= e.deltaX; ty -= e.deltaY; userMoved = true; apply(); } }, { passive: false });
  vp.addEventListener('click', e => { if ((e.target === vp || e.target === world || e.target.closest('.dg-bg,.dg-zone')) && !dragged && selected) closePanel(); });

  new ResizeObserver(() => { setH(); if (!userMoved) fit(); }).observe(root);
  setH(); fit();
  requestAnimationFrame(() => requestAnimationFrame(() => { if (!userMoved) fit(); }));
  return { root, select, fit };
}

/* full screen: native dialog (focus trapped, Esc) */
const dlg = $('#dg-dialog'), dlgHost = $('#dg-dialog-host'); let dlgOpener = null;
function openFull(spec) { dlgOpener = document.activeElement; $('#dg-dialog-t').textContent = spec.title; dlg.showModal(); createDiagram(dlgHost, spec, { full: true }); requestAnimationFrame(() => $('.dg-vp', dlgHost)?.focus()); }
$('#dg-dialog-x').addEventListener('click', () => dlg.close());
dlg.addEventListener('close', () => { dlgHost.innerHTML = ''; dlgOpener?.focus?.(); });

/* =====================================================================
   SEQUENCE, TIMELINE, COMPARISON: fit-to-width diagrams. Items are
   buttons; selecting one opens a details panel under the drawing.
   DIAGRAMS.x = { type: 'sequence' | 'timeline' | 'compare', … }
   ===================================================================== */
const VERDICT = { good: 'good', mid: 'warning', bad: 'critical' };
const verdict = k => `<span class="cp-v">${chartMark(VERDICT[k])}<span>${{ good: T.strong, mid: T.soso, bad: T.weak }[k]}</span></span>`;
const dvBtn = (i, label, cls) => `<button type="button" class="${cls} dv-item" data-i="${i}" aria-pressed="false" aria-label="${esc(label)}">`;

const PANEL_TYPES = {
  sequence: {
    items: s => s.msgs.map(m => ({ title: m.text, text: `${m.text} ${m.what || ''}` })),
    html(s) {
      const P = s.parts, n = P.length, ix = Object.fromEntries(P.map((p, i) => [p.id, i]));
      const lives = P.map((p, i) => `<span class="sq-life" style="--i:${i}" aria-hidden="true"></span>`).join('');
      const head = `<div class="sq-head" style="--n:${n}">${P.map(p => `<div class="sq-p"><b>${esc(p.label)}</b>${p.sub ? `<span>${esc(p.sub)}</span>` : ''}</div>`).join('')}</div>`;
      const rows = s.msgs.map((m, i) => {
        const a = ix[m.from], b = ix[m.to], lo = Math.min(a, b), hi = Math.max(a, b), who = `${P[a].label} → ${P[b].label}`;
        return `${dvBtn(i, `${T.step} ${i + 1}: ${who}, ${m.text}`, `sq-m${m.reply ? ' reply' : ''}${a === b ? ' self' : ''}`)}<span class="sq-lane" style="--n:${n};--lo:${lo};--hi:${hi}">${lives}<span class="sq-ar${b < a ? ' rtl' : ''}" aria-hidden="true"></span><span class="sq-l"><span class="sq-no">${i + 1}</span>${esc(m.text)}</span></span><span class="sq-ft">${esc(who)}</span></button>`;
      }).join('');
      return `<div class="sq">${head}<div class="sq-rows">${rows}</div></div>`;
    },
    detail(s, i) { const m = s.msgs[i], L = Object.fromEntries(s.parts.map(p => [p.id, p.label])); return { k: `${T.step} ${i + 1} ${T.of} ${s.msgs.length} · ${L[m.from]} → ${L[m.to]}`, t: m.text, body: `<p>${esc(m.what || '')}</p>` }; }
  },
  timeline: {
    items: s => s.items.map(it => ({ title: it.title, text: `${it.date} ${it.title} ${it.what || ''}` })),
    html: s => `<div class="tl" style="--n:${s.items.length}">${s.items.map((it, i) => `${dvBtn(i, `${it.date}: ${it.title}`, `tl-it${it.now ? ' now' : ''}`)}<span class="tl-d">${esc(it.date)}</span><span class="tl-dot" aria-hidden="true"></span><span class="tl-t">${esc(it.title)}</span>${it.now ? `<span class="tl-now">${T.inProgress}</span>` : ''}</button>`).join('')}</div>`,
    detail: (s, i) => { const it = s.items[i]; return { k: `${it.date}${it.now ? ' · ' + T.inProgress : ''}`, t: it.title, body: `<p>${esc(it.what || '')}</p>` }; }
  },
  compare: {
    items: s => s.rows.map(r => ({ title: r.label, text: `${r.label} ${r.what || ''} ${s.options.map(o => r.cells[o.id][1]).join(' ')}` })),
    html(s) {
      const O = s.options, n = O.length;
      const grid = `<div class="cp-grid" style="--n:${n}"><div></div>${O.map(o => `<div class="cp-h"><b>${esc(o.label)}</b>${o.sub ? `<span>${esc(o.sub)}</span>` : ''}</div>`).join('')}${s.rows.map((r, i) => `${dvBtn(i, `${r.label}: ${T.details.toLowerCase()}`, 'cp-r')}<span class="cp-l">${esc(r.label)}</span>${O.map(o => `<span class="cp-c">${verdict(r.cells[o.id][0])}</span>`).join('')}</button>`).join('')}${s.when ? `<div class="cp-r cp-when"><span class="cp-l">${T.whenToChoose}</span>${O.map(o => `<span class="cp-c"><span class="cp-tx">${esc(s.when[o.id] || '')}</span></span>`).join('')}</div>` : ''}</div>`;
      const cards = `<div class="cp-cards">${O.map(o => `<section class="cp-card"><h4>${esc(o.label)}${o.sub ? ` <span>${esc(o.sub)}</span>` : ''}</h4><div class="cp-list">${s.rows.map((r, i) => `${dvBtn(i, `${o.label}, ${r.label}: ${T.details.toLowerCase()}`, 'cp-cl')}<span class="cp-k">${esc(r.label)}</span><span class="cp-vv">${verdict(r.cells[o.id][0])}</span></button>`).join('')}${s.when ? `<div class="cp-cl"><span class="cp-k">${T.whenToChoose}</span><span class="cp-vv"><span class="cp-tx">${esc(s.when[o.id] || '')}</span></span></div>` : ''}</div></section>`).join('')}</div>`;
      return grid + cards;
    },
    detail(s, i) { const r = s.rows[i]; return { k: `${T.criterion} ${i + 1} ${T.of} ${s.rows.length}`, t: r.label, body: `${r.what ? `<p>${esc(r.what)}</p>` : ''}<dl class="pn-f">${s.options.map(o => { const [k, t] = r.cells[o.id]; return `<div><dt>${esc(o.label)}</dt><dd class="cp-dd">${verdict(k)}<span>${esc(t)}</span></dd></div>`; }).join('')}</dl>` }; }
  }
};
const diagramItems = spec => PANEL_TYPES[spec.type] ? PANEL_TYPES[spec.type].items(spec) : spec.nodes.map(n => ({ title: n.title, text: `${n.title} ${n.sub || ''} ${n.what}` }));

function createPanelDiagram(host, spec) {
  const type = PANEL_TYPES[spec.type];
  if (!type) throw new Error(`Unknown diagram type "${spec.type}". Use sequence, timeline, compare, or omit type for a node diagram.`);
  host.innerHTML = `<div class="dv dv-${spec.type}" role="group" aria-label="${esc(spec.title)}"><div class="dv-art">${type.html(spec)}</div><aside class="dv-pn" hidden aria-label="${T.details}"></aside><div class="dg-foot"><span>${T.selectForDetails}</span><span class="dg-hint">${T.escCloses}</span></div></div>`;
  const root = host.firstElementChild, pn = $('.dv-pn', root), items = () => $$('.dv-item', root);
  let sel = null;
  function open(i, focus = true) {
    if (i === null || i === sel) {
      const was = sel; sel = null; pn.hidden = true; pn.innerHTML = '';
      items().forEach(b => b.setAttribute('aria-pressed', 'false'));
      if (was !== null && focus) items().find(b => +b.dataset.i === was && b.offsetParent)?.focus();
      return;
    }
    const d = type.detail(spec, i); sel = i;
    pn.innerHTML = `<div class="pn-h"><div><p class="pn-kind">${esc(d.k)}</p><h4 class="pn-t" tabindex="-1">${esc(d.t)}</h4></div><button type="button" class="pn-x" aria-label="${T.closeDetails}">${ICON.x}</button></div><div class="pn-body">${d.body}</div>`;
    pn.hidden = false; items().forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    if (focus) $('.pn-t', pn).focus({ preventScroll: true });
    announce(`${T.details}: ${d.t}`);
  }
  root.addEventListener('click', e => { if (e.target.closest('.pn-x')) { open(null); return; } const b = e.target.closest('.dv-item'); if (b) open(+b.dataset.i); });
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && sel !== null) { e.preventDefault(); e.stopPropagation(); open(null); } });
}

/* =====================================================================
   LEFT SIDEBAR: groups, items, folders that open, indicator
   ===================================================================== */
const OPEN = new Set();
(function initOpen(items) { items.forEach(it => { if (it.folder) { if (it.open) OPEN.add(it.id); initOpen(it.items); } }); })(NAV.flatMap(g => g.items));
function navItems(items, lvl) {
  return `<ul${lvl ? ` style="--lvl:${lvl}"` : ''}>${items.map(it => it.page
    ? `<li><a class="nl" href="#/${it.page}" data-page="${it.page}" style="--lvl:${lvl}">${esc(navTitle(it.page))}</a></li>`
    : `<li><button type="button" class="nf-b" data-folder="${it.id}" aria-expanded="${OPEN.has(it.id)}" aria-controls="nf-${it.id}" style="--lvl:${lvl}"><span>${esc(it.folder)}</span>${ICON.chev}</button><div class="nf-c${OPEN.has(it.id) ? ' open' : ''}" id="nf-${it.id}"><div class="nf-in">${navItems(it.items, lvl + 1)}</div></div></li>`).join('')}</ul>`;
}
$('#nav-tree').innerHTML = NAV.map((g, i) => `<div class="ng"><p class="ng-t" id="ng-${i}">${esc(g.group)}</p><div role="group" aria-labelledby="ng-${i}">${navItems(g.items, 0)}</div></div>`).join('') + '<span class="nav-ind" aria-hidden="true"></span>';

function setFolder(id, open) {
  if (open) OPEN.add(id); else OPEN.delete(id);
  const b = $(`.nf-b[data-folder="${id}"]`); b.setAttribute('aria-expanded', String(open));
  $('#nf-' + id).classList.toggle('open', open);
  slideNav();
}
$('#nav-tree').addEventListener('click', e => { const b = e.target.closest('.nf-b'); if (b) setFolder(b.dataset.folder, !OPEN.has(b.dataset.folder)); });

let navSlideUntil = 0;
function placeNav(anim) {
  const tree = $('#nav-tree'), ind = $('.nav-ind', tree), cur = $('.nl[aria-current="page"]', tree);
  const hidden = !cur || cur.closest('.nf-c:not(.open)');
  if (hidden || !cur.offsetHeight) { ind.classList.remove('on'); return; }
  const tr = tree.getBoundingClientRect(), r = cur.getBoundingClientRect();
  ind.classList.toggle('no-anim', !anim || reduced());
  ind.style.transform = `translate(${r.left - tr.left}px,${r.top - tr.top}px)`;
  ind.style.width = r.width + 'px'; ind.style.height = r.height + 'px';
  ind.classList.add('on');
  if (!anim) requestAnimationFrame(() => ind.classList.remove('no-anim'));
}
function slideNav() { navSlideUntil = performance.now() + 300; placeNav(true); }
new ResizeObserver(() => placeNav(performance.now() < navSlideUntil)).observe($('#nav-tree'));
$$('.nf-c').forEach(c => c.addEventListener('transitionend', e => { if (e.propertyName === 'grid-template-rows') placeNav(false); }));

function setNavCurrent(page, anim) {
  $$('#nav-tree .nl').forEach(a => { if (a.dataset.page === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  (PARENTS[page] || []).forEach(id => { if (!OPEN.has(id)) setFolder(id, true); });
  $$('#nav-tree .nf-b').forEach(b => b.classList.toggle('has-cur', (PARENTS[page] || []).includes(b.dataset.folder) && !OPEN.has(b.dataset.folder)));
  if (anim) slideNav(); else placeNav(false);
  const cur = $('#nav-tree .nl[aria-current="page"]'), nav = $('#nav');
  if (cur && !isDrawer()) { const r = cur.getBoundingClientRect(), nr = nav.getBoundingClientRect(); if (r.top < nr.top || r.bottom > nr.bottom) nav.scrollTop += r.top - nr.top - nr.height / 3; }
}

/* =====================================================================
   PAGE, "ON THIS PAGE", SCROLLSPY
   ===================================================================== */
const state = { page: null, spy: null, heads: [] };
function pageHTML(id) {
  const p = PAGES[id], i = FLAT.indexOf(id), prev = FLAT[i - 1], next = FLAT[i + 1];
  const head = p.home
    ? `<header class="ph"><h1 tabindex="-1">${esc(p.title)}</h1><p class="lead">${esc(p.lead)}</p><p class="ph-meta">${(GUIDE.meta || []).map(x => `<span>${esc(x)}</span>`).join('')}<span>${T.updated} <time datetime="${GUIDE.updatedISO}">${GUIDE.updated}</time></span></p>${next ? `<p class="go"><a class="btn" href="#/${next}">${T.startWith} ${esc(navTitle(next))} ${ICON.right}</a></p>` : ''}</header>`
    : `<header class="ph"><h1 tabindex="-1">${esc(p.title)}</h1><p class="lead">${esc(p.lead)}</p></header>`;
  return `<article class="page" data-page="${id}">
  <div class="otp" id="otp"><button type="button" class="otp-b" id="otp-b" aria-expanded="false" aria-controls="otp-p"><span class="k">${T.onThisPage}</span><span class="cur" id="otp-cur"></span>${ICON.chev}</button><div class="otp-p" id="otp-p" hidden><ul id="otp-l"></ul></div></div>
  ${head}
  <div class="prose">${p.body()}</div>
  <nav class="pn" aria-label="${T.prevNext}">${prev ? `<a class="prev" href="#/${prev}" rel="prev"><span class="k">${ICON.left}${T.previous}</span><span class="t">${esc(navTitle(prev))}</span></a>` : ''}${next ? `<a class="next" href="#/${next}" rel="next"><span class="k">${T.next}${ICON.right}</span><span class="t">${esc(navTitle(next))}</span></a>` : ''}</nav>
  <p class="pf">${T.lastUpdated} <time datetime="${GUIDE.updatedISO}">${GUIDE.updated}</time></p>
</article>`;
}
function buildToc(id) {
  const heads = $$('#main .prose > h2, #main .prose > h3');
  state.heads = heads;
  const items = heads.map(h => `<li><a href="#/${id}/${h.id}" data-h="${h.id}" style="--l:${h.tagName === 'H3' ? 1 : 0}">${esc(h.textContent)}</a></li>`).join('');
  $('#toc').innerHTML = `<p class="toc-h">${ICON.lines}${T.onThisPage}</p><div class="toc-w"><ul class="toc-l">${items}</ul><span class="toc-ind" aria-hidden="true"></span></div>`;
  $('#otp-l').innerHTML = items;
}
let tocMoved = false;
function placeToc() {
  const a = $('#toc a[aria-current="true"]'), ind = $('#toc .toc-ind'); if (!ind) return;
  if (!a || !a.offsetParent) { ind.classList.remove('on'); return; }
  const lr = $('#toc .toc-w').getBoundingClientRect(), r = a.getBoundingClientRect();
  ind.classList.toggle('no-anim', !tocMoved || reduced());
  ind.style.transform = `translateY(${r.top - lr.top}px)`; ind.style.height = r.height + 'px'; ind.classList.add('on');
  tocMoved = true;
  const toc = $('#toc'), tr = toc.getBoundingClientRect(); if (r.bottom > tr.bottom - 24 || r.top < tr.top + 40) toc.scrollTop += r.top - tr.top - tr.height / 2;
}
function topOffset() {
  const otp = $('#otp'), bar = isDrawer() ? $('#side').offsetHeight : 0;
  return (otp && getComputedStyle(otp).display !== 'none' ? otp.offsetHeight : 0) + bar + 20;
}
function spy() {
  const heads = state.heads; if (!heads.length) return;
  const line = topOffset() + Math.min(140, innerHeight * .18);
  let cur = heads[0].id;
  for (const h of heads) { if (h.getBoundingClientRect().top <= line) cur = h.id; else break; }
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = heads[heads.length - 1].id;
  if (cur === state.spy) return;
  state.spy = cur;
  $$('#toc a[data-h], #otp-l a[data-h]').forEach(a => { if (a.dataset.h === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  const h = document.getElementById(cur); $('#otp-cur').textContent = h ? h.textContent : '';
  placeToc();
}
let spyQ = false;
addEventListener('scroll', () => { if (!spyQ) { spyQ = true; requestAnimationFrame(() => { spyQ = false; spy(); }); } }, { passive: true });

function goTo(sec, { smooth = false, focus = false } = {}) {
  const el = sec ? document.getElementById(sec) : null;
  const top = el ? el.getBoundingClientRect().top + scrollY - topOffset() : 0;
  window.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduced() ? 'smooth' : 'auto' });
  if (focus) { const t = el || $('#main h1'); if (t) { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } }
}

/* compact "On this page": drop-down menu at the top */
function closeOtp(returnFocus) { const b = $('#otp-b'); if (!b || b.getAttribute('aria-expanded') !== 'true') return; b.setAttribute('aria-expanded', 'false'); $('#otp-p').hidden = true; if (returnFocus) b.focus(); }
document.addEventListener('click', e => {
  const b = e.target.closest('#otp-b');
  if (b) { const open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open)); $('#otp-p').hidden = !open; if (open) ($('#otp-l a[aria-current="true"]') || $('#otp-l a'))?.focus(); return; }
  if (e.target.closest('#otp-p a')) { closeOtp(false); return; }
  if (!e.target.closest('#otp')) closeOtp(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#otp-b')?.getAttribute('aria-expanded') === 'true') { e.preventDefault(); closeOtp(true); } });

/* copy code */
document.addEventListener('click', async e => {
  const b = e.target.closest('.copy'); if (!b) return;
  const txt = b.closest('.code').querySelector('code').innerText.replace(/^\$ /gm, '');
  let ok = false; try { await navigator.clipboard.writeText(txt); ok = true; } catch { const t = document.createElement('textarea'); t.value = txt; document.body.append(t); t.select(); try { ok = document.execCommand('copy'); } catch {} t.remove(); }
  const old = b.lastChild.textContent; b.lastChild.textContent = ok ? T.copied : T.selectAndCopy; announce(ok ? T.codeCopied : T.copyFailed);
  setTimeout(() => { b.lastChild.textContent = old; }, 1600);
});

/* =====================================================================
   ROUTER
   ===================================================================== */
const parseRoute = () => { const [p, s] = location.hash.replace(/^#\/?/, '').split('/'); return { page: PAGES[p] ? p : 'introduction', sec: s || null }; };
function render(page, sec, { first = false, keepSpy = null } = {}) {
  const changed = page !== state.page;
  state.page = page; state.spy = null; tocMoved = false;
  $('#main').innerHTML = pageHTML(page);
  const art = $('#main .page');
  if (!first && changed && !reduced()) art.classList.add('enter');
  $$('#main .dg-mount').forEach(m => createDiagram(m, DIAGRAMS[m.dataset.dg]));
  buildToc(page);
  setNavCurrent(page, !first && changed);
  const p = PAGES[page];
  document.title = p.home ? GUIDE.title : `${p.title} · ${GUIDE.title}`;
  requestAnimationFrame(() => { goTo(keepSpy || sec); spy(); if (!first && !keepSpy) goTo(sec, { focus: true }); });
  if (!first && changed) announce(`${T.page}: ${p.title}`);
}
addEventListener('hashchange', () => {
  if (!location.hash.startsWith('#/')) return;
  const r = parseRoute(); closeNav(false); closeOtp(false);
  if (r.page !== state.page) render(r.page, r.sec);
  else goTo(r.sec, { smooth: true, focus: true });
});
$('#skip').addEventListener('click', e => { e.preventDefault(); const m = $('#main'); m.focus({ preventScroll: true }); window.scrollTo({ top: Math.max(0, m.getBoundingClientRect().top + scrollY - (isDrawer() ? $('#side').offsetHeight : 0)) }); });

/* =====================================================================
   DRAWER (narrow screens): managed focus, Esc, backdrop, inert
   ===================================================================== */
const isDrawer = () => getComputedStyle($('#nav-open')).display !== 'none';
function openNav() {
  if (!isDrawer()) return;
  document.body.classList.add('nav-is-open'); $('#nav-open').setAttribute('aria-expanded', 'true');
  $('.sheet').inert = true; $('#mast').inert = true;
  placeNav(false); $('#nav-close').focus();
}
function closeNav(returnFocus = true) {
  if (!document.body.classList.contains('nav-is-open')) return;
  document.body.classList.remove('nav-is-open'); $('#nav-open').setAttribute('aria-expanded', 'false');
  $('.sheet').inert = false; $('#mast').inert = false;
  if (returnFocus) $('#nav-open').focus();
}
$('#nav-open').addEventListener('click', openNav);
$('#nav-close').addEventListener('click', () => closeNav());
$('#nav-backdrop').addEventListener('click', () => closeNav());
$('#nav').addEventListener('click', e => { if (e.target.closest('a') && isDrawer()) closeNav(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-is-open')) { e.preventDefault(); closeNav(); } });
function syncBar() { document.documentElement.style.setProperty('--otp-top-js', (isDrawer() ? $('#side').offsetHeight : 0) + 'px'); }
addEventListener('resize', () => { if (!isDrawer()) closeNav(false); $('#nav').inert = shell.classList.contains('rail') && !isDrawer(); syncBar(); placeNav(false); tocMoved = false; placeToc(); });

/* =====================================================================
   SEARCH (⌘K / Ctrl K, also "/"): titles, sections and text of every page
   ===================================================================== */
const INDEX = (() => {
  const out = [], tpl = document.createElement('template');
  FLAT.forEach(pid => {
    const p = PAGES[pid]; out.push({ pid, sec: '', title: p.title, where: T.page, text: `${p.title} ${p.lead}`, rank: 4 });
    tpl.innerHTML = p.body(); let cur = { id: '', t: p.title };
    tpl.content.querySelectorAll('h2, h3, p, li, td, th, dd, dt').forEach(el => {
      if (el.closest('.adm-h,.code-h,.idx')) return;
      if (/^H[23]$/.test(el.tagName)) { cur = { id: el.id, t: el.textContent }; out.push({ pid, sec: el.id, title: el.textContent, where: p.title, text: el.textContent, rank: 3 }); return; }
      const text = el.textContent.replace(/\s+/g, ' ').trim(); if (text.length > 2) out.push({ pid, sec: cur.id, title: cur.t, where: p.title, text, rank: 1 });
    });
    $$('[data-dg]', tpl.content).forEach(m => { let h = m.closest('figure'); while (h && h.tagName !== 'H2') h = h.previousElementSibling;
      diagramItems(DIAGRAMS[m.dataset.dg]).forEach(n => out.push({ pid, sec: h ? h.id : '', title: n.title, where: `${p.title} · ${T.diagram.toLowerCase()}`, text: n.text, rank: 2 })); });
  });
  return out;
})();
const fd = $('#find'), fi = $('#find-in'), fr = $('#find-res');
let hits = [], hi = 0, findOpener = null;
const hl = (s, words) => { let h = esc(s); words.forEach(w => { h = h.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>'); }); return h; };
function snippet(text, w) { const i = text.toLowerCase().indexOf(w); if (i < 0) return text.slice(0, 110); const s = Math.max(0, i - 40); return (s ? '…' : '') + text.slice(s, s + 120) + (s + 120 < text.length ? '…' : ''); }
function find(q) {
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1 || /\d/.test(w));
  const seen = new Set();
  hits = words.length ? INDEX.map(x => { const t = x.text.toLowerCase(), ti = x.title.toLowerCase(); let s = 0; for (const w of words) { if (ti.includes(w)) s += 3; else if (t.includes(w)) s += 1; else return null; } return { ...x, s: s + x.rank }; })
    .filter(Boolean).sort((a, b) => b.s - a.s).filter(x => { const k = x.pid + '/' + x.sec + '/' + x.title; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8) : [];
  hi = 0; drawFind(q, words);
}
function drawFind(q, words = []) {
  fr.innerHTML = hits.length ? hits.map((h, i) => `<li role="option" id="fo${i}" aria-selected="${i === hi}"><a href="#/${h.pid}${h.sec ? '/' + h.sec : ''}" tabindex="-1"><span class="t">${hl(h.title, words)}</span><span class="w">${esc(h.where)}</span>${h.rank === 1 || h.rank === 2 ? `<span class="x">${hl(snippet(h.text, words[0] || ''), words)}</span>` : ''}</a></li>`).join('')
    : `<li class="find-empty" role="presentation">${q.trim() ? `${T.noResults} “${esc(q.trim())}”.` : T.typeAWord}</li>`;
  if (hits.length) fi.setAttribute('aria-activedescendant', 'fo' + hi); else fi.removeAttribute('aria-activedescendant');
  const o = $('#fo' + hi); if (o) { const lr = fr.getBoundingClientRect(), r = o.getBoundingClientRect(); if (r.bottom > lr.bottom) fr.scrollTop += r.bottom - lr.bottom + 8; else if (r.top < lr.top) fr.scrollTop -= lr.top - r.top + 8; }
}
function openFind() { if (fd.open) return; closeNav(false); findOpener = document.activeElement; fd.showModal(); fi.value = ''; find(''); fi.focus(); }
function closeFind() { if (fd.open) fd.close(); }
fd.addEventListener('close', () => { if (findOpener && document.contains(findOpener)) findOpener.focus({ preventScroll: true }); });
$('#search-open').addEventListener('click', openFind);
$('#find-x').addEventListener('click', closeFind);
fi.addEventListener('input', () => find(fi.value));
fi.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (hits.length) { hi = (hi + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length; const q = fi.value; drawFind(q, q.toLowerCase().split(/\s+/).filter(Boolean)); } }
  else if (e.key === 'Enter' && hits[hi]) { e.preventDefault(); findOpener = null; const h = hits[hi]; fd.close(); location.hash = `#/${h.pid}${h.sec ? '/' + h.sec : ''}`; }
});
fr.addEventListener('click', e => { if (e.target.closest('a')) { findOpener = null; fd.close(); } });
fd.addEventListener('click', e => { if (e.target === fd) closeFind(); });
document.addEventListener('keydown', e => {
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); fd.open ? closeFind() : openFind(); return; }
  if (e.key === '/' && !fd.open && !dlg.open && !e.target.closest('input,textarea,[contenteditable]')) { e.preventDefault(); openFind(); }
});


/* =====================================================================
   COLLAPSIBLE SIDEBAR RAIL (from 900px) and LIGHT/DARK THEME
   ===================================================================== */
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
const shell = $('.shell'), sideTog = $('#side-tog');
function setRail(on, { save = true, focus = false } = {}) {
  shell.classList.toggle('rail', on);
  $('#nav').inert = on && !isDrawer();
  sideTog.setAttribute('aria-expanded', String(!on));
  const t = on ? T.showSidebar : T.hideSidebar;
  sideTog.setAttribute('aria-label', t); sideTog.title = `${t} ( [ )`;
  if (save) store.set('guide.sidebar', on ? 'rail' : null);
  if (focus) sideTog.focus();
  if (!on) setTimeout(() => placeNav(false), reduced() ? 0 : 260);
}
sideTog.addEventListener('click', () => { setRail(!shell.classList.contains('rail')); announce(shell.classList.contains('rail') ? T.sidebarHidden : T.sidebarShown); });
document.addEventListener('keydown', e => {
  if (e.key !== '[' || e.altKey || e.ctrlKey || e.metaKey || fd.open || dlg.open || isDrawer()) return;
  if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
  e.preventDefault(); sideTog.click();
});
setRail(store.get('guide.sidebar') === 'rail', { save: false });

const darkQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $$('[role=switch].theme-btn, [role=switch].theme-bar').forEach(b => b.setAttribute('aria-checked', String(t === 'dark')));
}
$$('.theme-btn, .theme-bar').forEach(b => b.addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(t); store.set('guide.theme', t); announce(t === 'dark' ? T.darkOn : T.darkOff);
}));
darkQ.addEventListener('change', e => { if (!store.get('guide.theme')) applyTheme(e.matches ? 'dark' : 'light'); });
applyTheme(document.documentElement.dataset.theme || (darkQ.matches ? 'dark' : 'light'));

syncBar();
{ const r = parseRoute(); render(r.page, r.sec, { first: true }); }
document.fonts?.ready.then(() => { syncBar(); placeNav(false); tocMoved = false; placeToc(); });
