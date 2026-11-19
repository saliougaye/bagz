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
/* Architecture (zones, no kinds): zones become columns read left to right, each with a category colour.
   Blocks stack in a column in x order (then array order); x/y/w/h in the spec only give that order. */
const isArch = s => (s.zones || []).length > 0 && !(s.kinds && Object.keys(s.kinds).length);
const zoneColor = (i, n) => n > 3 ? (i === 0 ? 'var(--k-step)' : `var(--c${Math.min(i, 3)})`) : `var(--c${i + 1})`;
function layoutColumns(s) {
  const NW = s.nodeW, NH = s.nodeH, PAD = 12, HEAD = 42, RG = 22, CG = 48, colW = NW + PAD * 2;
  const G = s.zones.map(z => s.nodes.map((n, k) => [n, k]).filter(([n]) => n.zone === z.id).sort((a, b) => (a[0].x ?? 0) - (b[0].x ?? 0) || a[1] - b[1]).map(([n]) => n));
  const max = Math.max(...G.map(g => g.length)), H = HEAD + max * (NH + RG) - RG + PAD, nodes = [];
  const zones = s.zones.map((z, i) => { const x = i * (colW + CG), off = (max - G[i].length) * (NH + RG) / 2;
    G[i].forEach((n, j) => nodes.push({ ...n, x: x + PAD, y: HEAD + off + j * (NH + RG) })); return { ...z, x, y: 0, w: colW, h: H }; });
  const col = Object.fromEntries(nodes.map(n => [n.id, s.zones.findIndex(z => z.id === n.zone)]));
  const edges = s.edges.map(({ fs, ts, ...e }) => { const d = col[e.to] - col[e.from]; return d > 0 ? { ...e, fs: 'r', ts: 'l' } : d < 0 ? { ...e, fs: 'l', ts: 'r' } : e; });
  return { ...s, zones, nodes, edges, w: s.zones.length * (colW + CG) - CG, h: H };
}
/* right-angle route between two ports, rounded corners; returns the path and its midpoint */
function orthoRoute(a, sa, b, sb) {
  const N = { t: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0] }, na = N[sa], nb = N[sb], G = 22;
  const va = na[0] === 0, vb = nb[0] === 0, A = [a.x + na[0] * G, a.y + na[1] * G], B = [b.x + nb[0] * G, b.y + nb[1] * G];
  let P;
  if (va && vb) { const my = (na[1] > 0 && nb[1] < 0 && b.y > a.y) || (na[1] < 0 && nb[1] > 0 && b.y < a.y) ? (a.y + b.y) / 2 : na[1] < 0 ? Math.min(A[1], B[1]) : Math.max(A[1], B[1]); P = [[a.x, a.y], [a.x, my], [b.x, my], [b.x, b.y]]; }
  else if (!va && !vb) { const mx = (na[0] > 0 && nb[0] < 0 && b.x > a.x) || (na[0] < 0 && nb[0] > 0 && b.x < a.x) ? (a.x + b.x) / 2 : na[0] < 0 ? Math.min(A[0], B[0]) : Math.max(A[0], B[0]); P = [[a.x, a.y], [mx, a.y], [mx, b.y], [b.x, b.y]]; }
  else if (va) P = (Math.sign(b.y - a.y) === na[1] && Math.sign(a.x - b.x) === nb[0]) ? [[a.x, a.y], [a.x, b.y], [b.x, b.y]] : [[a.x, a.y], [a.x, A[1]], [B[0], A[1]], [B[0], b.y], [b.x, b.y]];
  else P = (Math.sign(b.x - a.x) === na[0] && Math.sign(a.y - b.y) === nb[1]) ? [[a.x, a.y], [b.x, a.y], [b.x, b.y]] : [[a.x, a.y], [A[0], a.y], [A[0], B[1]], [b.x, B[1]], [b.x, b.y]];
  P = P.filter((p, i) => i === 0 || Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) > 0.5);
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 1; i < P.length - 1; i++) { const [p0, p1, p2] = [P[i - 1], P[i], P[i + 1]];
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), r = Math.min(12, l1 / 2, l2 / 2);
    const u = [(p1[0] - p0[0]) / l1, (p1[1] - p0[1]) / l1], w = [(p2[0] - p1[0]) / l2, (p2[1] - p1[1]) / l2];
    d += ` L${p1[0] - u[0] * r},${p1[1] - u[1] * r} Q${p1[0]},${p1[1]} ${p1[0] + w[0] * r},${p1[1] + w[1] * r}`; }
  d += ` L${P.at(-1)[0]},${P.at(-1)[1]}`;
  const seg = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1])); let half = seg.reduce((x, y) => x + y, 0) / 2, mx = P[0][0], my = P[0][1];
  for (let i = 0; i < seg.length; i++) { if (half <= seg[i]) { const t = seg[i] ? half / seg[i] : 0; mx = P[i][0] + (P[i + 1][0] - P[i][0]) * t; my = P[i][1] + (P[i + 1][1] - P[i][1]) * t; break; } half -= seg[i]; }
  return { d, mx, my };
}

function createDiagram(host, spec, opts = {}) {
  if (spec.type && spec.type !== 'nodes') return createPanelDiagram(host, spec);
  const arch = isArch(spec); if (arch) spec = layoutColumns(spec);
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
    return E.map(o => ({ e: o.e, ...orthoRoute(o.a, o.sa, o.b, o.sb) }));
  })();

  const body = n => `<p>${esc(n.what)}</p>${n.zone ? `<dl class="pn-f"><div><dt>${T.zone}</dt><dd>${esc(zoneT[n.zone])}</dd></div>${(n.fields || []).map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>` : (n.fields || []).length ? `<dl class="pn-f">${n.fields.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>` : ''}`;
  const conns = n => { const i = edges.filter(e => e.to === n.id), o = edges.filter(e => e.from === n.id);
    const li = (e, other) => `<li><button type="button" data-go="${other}">${esc(byId[other].title)}</button>${e.text ? `: ${esc(e.text)}` : e.label ? ` (${esc(e.label)})` : ''}</li>`;
    return `${i.length ? `<h5 class="pn-ct">${T.receivesFrom}</h5><ul class="pn-c">${i.map(e => li(e, e.from)).join('')}</ul>` : ''}${o.length ? `<h5 class="pn-ct">${T.goesTo}</h5><ul class="pn-c">${o.map(e => li(e, e.to)).join('')}</ul>` : ''}`; };
  const kg = k => `<svg class="kg" viewBox="0 0 16 16" aria-hidden="true" style="--k:var(--k-${k})">${ICON.shape[k]}</svg>`;

  host.innerHTML = `<div class="dg${full ? ' is-full' : ''}${arch ? ' dg-arch' : ''}" id="${uid}">
  <div class="dg-bar" role="group" aria-label="${T.diagramControls}">
    <div class="dg-grp"><button type="button" class="dg-btn" data-a="out" aria-label="${T.zoomOut}">−</button><span class="dg-zoom" aria-hidden="true">100%</span><button type="button" class="dg-btn" data-a="in" aria-label="${T.zoomIn}">+</button><button type="button" class="dg-btn" data-a="fit">${T.fit}</button></div>
    ${full ? '' : `<div class="dg-grp dg-right"><button type="button" class="dg-btn" data-a="full">${ICON.full}${T.fullScreen}</button></div>`}
  </div>
  <div class="dg-body">
    <div class="dg-vp" tabindex="0" role="group" aria-label="${T.diagramCanvas}: ${esc(spec.title)}" aria-describedby="${uid}-h">
      <div class="dg-world" style="width:${W}px;height:${H}px">
        ${(spec.zones || []).map((z, i) => `<div class="dg-zone" style="left:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px${arch ? `;--zc:${zoneColor(i, spec.zones.length)}` : ''}" aria-hidden="true"><span class="dg-zl">${esc(z.title)}</span></div>`).join('')}
        <svg class="dg-edges" width="${W}" height="${H}" aria-hidden="true"><defs><marker id="${uid}-a" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path class="dg-ar" d="M0,0 L10,4 L0,8z"/></marker><marker id="${uid}-b" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path class="dg-ar-on" d="M0,0 L12,5 L0,10z"/></marker></defs>
          ${routes.map(r => `<path class="dg-e" data-f="${r.e.from}" data-t="${r.e.to}" d="${r.d}" marker-end="url(#${uid}-a)"/>${r.e.label ? `<text class="dg-el" data-f="${r.e.from}" data-t="${r.e.to}" x="${r.mx}" y="${r.my}">${esc(r.e.label)}</text>` : ''}`).join('')}</svg>
        ${order.map(id => { const n = byId[id]; return `<button type="button" class="dg-n${n.kind ? ' has-k k-' + n.kind : ''}" data-id="${id}" aria-pressed="false" aria-describedby="${uid}-d-${id}" style="left:${n.x}px;top:${n.y}px;width:${NW}px;height:${NH}px${n.kind ? `;--k:var(--k-${n.kind})` : ''}${arch ? `;--zc:${zoneColor(spec.zones.findIndex(z => z.id === n.zone), spec.zones.length)}` : ''}"><span class="dg-t">${kind(n) ? kg(n.kind) : ''}${esc(n.title)}</span>${n.sub ? `<span class="dg-s">${esc(n.sub)}</span>` : ''}<span class="sr" id="${uid}-d-${id}">${esc((kind(n) ? kind(n).label + '. ' : '') + (n.zone ? (T.zone + ': ') + zoneT[n.zone] + '. ' : '') + nbr(n))}</span></button>`; }).join('')}
      </div>
    </div>
    <aside class="dg-panel" hidden aria-label="${T.details}"></aside>
  </div>
  <div class="dg-foot"><span class="dg-leg"><span>${nodes.length} ${unit}</span>${Object.entries(kinds).map(([id, k]) => `<span class="it">${kg(id)}${esc(k.label)}</span>`).join('')}</span><span class="dg-hint" id="${uid}-h">${esc(spec.hint)}</span></div></div>`;

  const root = $('.dg', host), vp = $('.dg-vp', root), world = $('.dg-world', root), panel = $('.dg-panel', root), zoomL = $('.dg-zoom', root);
  const nodeEl = id => $(`.dg-n[data-id="${id}"]`, root);
  let tx = 0, ty = 0, sc = 1, userMoved = false, selected = null, dragged = false;
  const apply = (anim = false) => {
    world.classList.toggle('is-anim', anim && !reduced());
    world.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`;
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
  vp.addEventListener('click', e => { if ((e.target === vp || e.target === world || e.target.closest('.dg-zone')) && !dragged && selected) closePanel(); });

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
   SEQUENCE, TIMELINE, COMPARISON, ISO: fit-to-width diagrams. Items are
   buttons; selecting one opens a details panel under the drawing.
   DIAGRAMS.x = { type: 'sequence' | 'timeline' | 'compare' | 'iso', … }
   A type may add mount(root, spec) after drawing and onOpen(root, spec, i | null).
   ===================================================================== */
const VERDICT = { good: 'good', mid: 'warning', bad: 'critical' };
const VERDICT_WORD = { good: () => T.strong, mid: () => T.soso, bad: () => T.weak };
const cmpValue = c => c[2] || VERDICT_WORD[c[0]]();
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
    /* cells[option] = [verdict, why, value]: the value (Alto, Dopo 3 settimane) leads, the why sits under it */
    items: s => s.rows.map(r => ({ title: r.label, text: `${r.label} ${r.what || ''} ${s.options.map(o => `${r.cells[o.id][2] || ''} ${r.cells[o.id][1]}`).join(' ')}` })),
    html(s) {
      const O = s.options, n = O.length;
      const head = o => `<div class="cp-h${s.recommend === o.id ? ' rec' : ''}">${s.recommend === o.id ? `<em class="cp-rec">${T.recommended}</em>` : ''}<b>${esc(o.label)}</b>${o.sub ? `<span>${esc(o.sub)}</span>` : ''}</div>`;
      const cell = c => `<span class="cp-c cp-${c[0]}"><span class="cp-val">${chartMark(VERDICT[c[0]])}${esc(cmpValue(c))}<span class="sr"> (${VERDICT_WORD[c[0]]()})</span></span><span class="cp-why">${esc(c[1])}</span></span>`;
      const grid = `<div class="cp-grid" style="--n:${n}"><div></div>${O.map(head).join('')}${s.rows.map((r, i) => `${dvBtn(i, `${r.label}: ${T.details.toLowerCase()}`, 'cp-r')}<span class="cp-l">${esc(r.label)}</span>${O.map(o => cell(r.cells[o.id])).join('')}</button>`).join('')}${s.when ? `<div class="cp-r cp-when"><span class="cp-l">${T.whenToChoose}</span>${O.map(o => `<span class="cp-c"><span class="cp-why">${esc(s.when[o.id] || '')}</span></span>`).join('')}</div>` : ''}</div>`;
      const cards = `<div class="cp-cards">${O.map(o => `<section class="cp-card${s.recommend === o.id ? ' rec' : ''}">${head(o)}${s.rows.map((r, i) => `${dvBtn(i, `${o.label}, ${r.label}`, 'cp-cr')}<span class="cp-k">${esc(r.label)}</span>${cell(r.cells[o.id])}</button>`).join('')}${s.when ? `<p class="cp-w"><span class="cp-k">${T.whenToChoose}</span>${esc(s.when[o.id] || '')}</p>` : ''}</section>`).join('')}</div>`;
      return grid + cards;
    },
    detail(s, i) { const r = s.rows[i]; return { k: `${T.criterion} ${i + 1} ${T.of} ${s.rows.length}`, t: r.label, body: `${r.what ? `<p>${esc(r.what)}</p>` : ''}<dl class="pn-f">${s.options.map(o => { const c = r.cells[o.id]; return `<div><dt>${esc(o.label)}</dt><dd class="cp-dd"><span class="cp-v">${chartMark(VERDICT[c[0]])}<span>${esc(cmpValue(c))}</span></span><span>${esc(c[1])}</span></dd></div>`; }).join('')}</dl>` }; }
  }
};
/* =====================================================================
   ISO: a system map in isometric view, rising from bottom left to top right.
   Top-level zones sit on the floor, left to right; a zone that other zones
   are `in` is a machine (a platform) and those zones are coloured groups on it.
   Each block is a low shape that says its kind, with a pictogram printed on
   top and an upright name card above. Fits the width, details under it.
   DIAGRAMS.x = { type: 'iso', title, zones: [...], nodes: [...], edges: [...] }
   ===================================================================== */
/* pictograms on a 24-unit grid, generic on purpose: no product logos */
const ISO_ICONS = {
  app: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z M4 7.5l8 4.5 8-4.5 M12 12v9',
  server: 'M4 4h16v6H4z M4 14h16v6H4z M8 7h.01 M8 17h.01',
  db: 'M5 6a7 3 0 1 0 14 0a7 3 0 1 0-14 0 M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6 M5 12c0 1.7 3 3 7 3s7-1.3 7-3',
  disk: 'M3 8h18v8H3z M7 12h.01 M17 12h-6',
  drive: 'M5 4h14v16H5z M9 8h6 M9 12h6 M12 17h.01',
  cloud: 'M7 18h10a4 4 0 0 0 0-8a6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 18z',
  network: 'M6 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M18 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M18 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M8 11l8-4 M8 13l8 4',
  gateway: 'M5 20V9a7 7 0 0 1 14 0v11 M2 20h20 M9 14h6 M13 12l2 2-2 2',
  globe: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
  laptop: 'M4 6h16v10H4z M2 19h20',
  phone: 'M8 3h8v18H8z M11 18h2',
  desktop: 'M3 4h18v12H3z M8 20h8 M12 16v4',
  user: 'M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M4 21c1-5 15-5 16 0',
  chip: 'M7 7h10v10H7z M10 3v4 M14 3v4 M10 17v4 M14 17v4 M3 10h4 M3 14h4 M17 10h4 M17 14h4',
  media: 'M3 5h18v14H3z M10 9l5 3-5 3z',
  photo: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 5 M16 9h.01',
  doc: 'M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h7',
  code: 'M9 7l-5 5 5 5 M15 7l5 5-5 5',
  api: 'M9 4c-3 0-3 2-3 4s-1 4-3 4c2 0 3 2 3 4s0 4 3 4 M15 4c3 0 3 2 3 4s1 4 3 4c-2 0-3 2-3 4s0 4-3 4',
  terminal: 'M3 5h18v14H3z M7 10l3 2-3 2 M12 15h5',
  pulse: 'M2 12h5l3-7 4 14 3-7h5',
  dashboard: 'M3 4h18v12H3z M8 20h8 M6 12l3-3 3 2 4-4',
  chart: 'M3 21h18 M6 21v-7 M11 21V9 M16 21v-5',
  map: 'M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z M12 10h.01',
  person: 'M5 3h14v18H5z M9.5 9a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0 M8 17c1-3 7-3 8 0',
  search: 'M4 10a6 6 0 1 0 12 0a6 6 0 1 0-12 0 M15 15l6 6',
  lock: 'M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4 M12 15v2',
  key: 'M3 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M11 12h10 M18 12v3 M21 12v2',
  mail: 'M3 6h18v12H3z M3 6l9 7 9-7',
  queue: 'M3 8h4v8H3z M10 8h4v8h-4z M17 8h4v8h-4z',
  cache: 'M13 3 5 13h6l-1 8 8-10h-6z',
  gear: 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9 7 7 M17 17l2.1 2.1 M4.9 19.1 7 17 M17 7l2.1-2.1',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z M10 21h4',
  home: 'M3 11l9-7 9 7 M6 9v11h12V9'
};
/* kind → shape: the shape tells what a block is, the colour where it runs */
const ISO_KINDS = { service: { shape: 'slab', icon: 'app' }, data: { shape: 'stack', icon: 'db' }, network: { shape: 'puck', icon: 'network' }, device: { shape: 'thin', icon: 'laptop' } };
const ISO_KIND_T = { service: () => T.isoService, data: () => T.isoData, network: () => T.isoNetwork, device: () => T.isoDevice };
const ISO_KG = {
  service: '<path d="M2 8l7-3.5 7 3.5-7 3.5z M2 8v3l7 3.5 7-3.5V8"/>',
  data: '<path d="M2 5.5l7-3.5 7 3.5-7 3.5z M2 9l7 3.5 7-3.5 M2 12.5l7 3.5 7-3.5"/>',
  network: '<ellipse cx="9" cy="7.5" rx="7" ry="3.5"/><path d="M2 7.5v3c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5v-3"/>',
  device: '<path d="M2 9l7-3.5 7 3.5-7 3.5z M2 9v1.5l7 3.5 7-3.5V9"/>'
};
const ISO = { BW: 84, BD: 84, PX: 120, PY: 142, M: 26, MF: 60, TG: 90, ZG: 84, AX: [0.866, -0.5], AY: [0.866, 0.5] };
const isoP = (x, y, z) => [x * ISO.AX[0] + y * ISO.AY[0], x * ISO.AX[1] + y * ISO.AY[1] - z];
const isoPts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const isoArea = q => q.reduce((s, p, i) => { const n = q[(i + 1) % q.length]; return s + p[0] * n[1] - n[0] * p[1]; }, 0) / 2;
function isoHull(P0) {
  const p = [...P0].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/* a box: the sides that face the viewer (same winding as the top), then the top */
function isoBox({ x, y, z, w, d, h }) {
  const zt = z + h, g = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]], top = g.map(q => isoP(...q, zt)), sT = Math.sign(isoArea(top));
  const sides = g.map((a, i) => { const c = g[(i + 1) % 4], p = [isoP(...a, z), isoP(...c, z), isoP(...c, zt), isoP(...a, zt)]; return { p, ar: isoArea(p), cx: p.reduce((m, q) => m + q[0], 0) / 4 }; })
    .filter(s => Math.sign(s.ar) === sT && Math.abs(s.ar) > .5).sort((m, n) => m.cx - n.cx);
  return { svg: sides.map((s, i) => `<polygon class="is-f ${i ? 'is-r' : 'is-l'}" points="${isoPts(s.p)}"/>`).join('') + `<polygon class="is-f is-top" points="${isoPts(top)}"/>`, pts: g.map(q => isoP(...q, z)).concat(top) };
}
function isoCyl(cx, cy, r, z, h) {
  const ring = zz => Array.from({ length: 49 }, (_, i) => { const a = i / 48 * Math.PI * 2; return isoP(cx + r * Math.cos(a), cy + r * Math.sin(a), zz); });
  const top = ring(z + h), all = ring(z).concat(top), mid = isoP(cx, cy, z)[0];
  return { svg: `<polygon class="is-f is-r" points="${isoPts(isoHull(all))}"/><polygon class="is-f is-l" points="${isoPts(isoHull(all.filter(p => p[0] <= mid + .01)))}"/><polygon class="is-f is-top" points="${isoPts(top)}"/>`, pts: all };
}
/* the pictogram lies flat on the top face: icon x along world x, icon y along world y */
function isoIcon(name, cx, cy, zt, s) {
  const k = s / 24, o = isoP(cx - s / 2, cy - s / 2, zt), m = [ISO.AX[0] * k, ISO.AX[1] * k, ISO.AY[0] * k, ISO.AY[1] * k].map(v => v.toFixed(4)).join(' ');
  return `<g transform="matrix(${m} ${o[0].toFixed(1)} ${o[1].toFixed(1)})"><path class="is-ico" d="${ISO_ICONS[name]}" vector-effect="non-scaling-stroke"/></g>`;
}
function isoShape(n, b) {
  const k = ISO_KINDS[n.kind || 'service'], icon = n.icon || k.icon, cx = b.x + b.w / 2, cy = b.y + b.d / 2, s = Math.min(b.w, b.d);
  if (k.shape === 'puck') { const c = isoCyl(cx, cy, s / 2, b.z, 14); return { svg: c.svg + isoIcon(icon, cx, cy, b.z + 14, s * .52), pts: c.pts, top: b.z + 14 }; }
  if (k.shape === 'stack') {
    let svg = '', pts = [];
    for (let i = 0; i < 3; i++) { const o = isoBox({ ...b, z: b.z + i * 10, h: 7 }); svg += o.svg; pts = pts.concat(o.pts); }
    return { svg: svg + isoIcon(icon, cx, cy, b.z + 27, s * .56), pts, top: b.z + 27 };
  }
  const h = k.shape === 'thin' ? 7 : 16, o = isoBox({ ...b, h });
  return { svg: o.svg + isoIcon(icon, cx, cy, b.z + h, s * .56), pts: o.pts, top: b.z + h };
}
function isoCheck(s) {
  const zones = new Set(s.zones.map(z => z.id));
  s.zones.forEach(z => { if (z.in && !zones.has(z.in)) throw new Error(`iso "${s.title}": zone "${z.id}" is in "${z.in}", which is not a zone.`); });
  s.nodes.forEach(n => {
    if (!zones.has(n.zone)) throw new Error(`iso "${s.title}": node "${n.id}" has zone "${n.zone}", which is not a zone.`);
    if (n.kind && !ISO_KINDS[n.kind]) throw new Error(`iso "${s.title}": node "${n.id}" has kind "${n.kind}". Use ${Object.keys(ISO_KINDS).join(', ')}.`);
    if (n.icon && !ISO_ICONS[n.icon]) throw new Error(`iso "${s.title}": node "${n.id}" has icon "${n.icon}". Use one of: ${Object.keys(ISO_ICONS).join(', ')}.`);
  });
  const ids = new Set(s.nodes.map(n => n.id));
  s.edges.forEach(e => { if (!ids.has(e.from) || !ids.has(e.to)) throw new Error(`iso "${s.title}": edge ${e.from} → ${e.to} names a node that does not exist.`); });
}
/* layout in world units: x runs along the zones, y is depth, z goes up */
function isoLayout(s) {
  isoCheck(s);
  const { BW, BD, PX, PY, M, MF, TG, ZG } = ISO;
  const zone = Object.fromEntries(s.zones.map(z => [z.id, z])), kids = id => s.zones.filter(z => z.in === id);
  const inZone = id => s.nodes.filter(n => n.zone === id), tops = s.zones.filter(z => !z.in);
  const grid = (n, cols) => { cols = Math.max(1, Math.min(cols || n, n)); return { cols, rows: Math.ceil(n / cols) || 1 }; };
  const mach = {};
  tops.forEach(z => {
    const G = kids(z.id); if (!G.length) return;
    const L = inZone(z.id), x0 = L.length ? M + PX - 4 : M, gr = G.map(t => grid(inZone(t.id).length, t.cols || 4));
    const tw = Math.max(...gr.map(q => (q.cols - 1) * PX + BW + 28));
    let y = M; const groups = G.map((t, i) => { const d = (gr[i].rows - 1) * PY + BD + 28, r = { z: t, x: x0, y, w: tw, d, cols: gr[i].cols }; y += d + TG; return r; });
    mach[z.id] = { groups, L, w: x0 + tw + M, d: y - TG + MF };
  });
  const D = Math.max(0, ...Object.values(mach).map(m => m.d));
  const blocks = [], plats = [], labels = [], area = {};
  let cx = 0;
  tops.forEach(z => {
    const m = mach[z.id];
    if (m) {
      const X = cx, Y = (D - m.d) / 2;
      area[z.id] = { x: X, y: Y, w: m.w, d: m.d, machine: true };
      plats.push({ x: X, y: Y, z: 0, w: m.w, d: m.d, h: 16, tone: z.tone || 'n', cls: 'is-plat' });
      labels.push({ t: z.title, at: [X + 10, Y + 16, 16], along: 'y' });
      m.groups.forEach(g => {
        plats.push({ x: X + g.x, y: Y + g.y, z: 16, w: g.w, d: g.d, h: 8, tone: g.z.tone || 'n', cls: 'is-tray' });
        labels.push({ t: g.z.title, at: [X + g.x + 34, Y + g.y + g.d + 24, 16] });
        area[g.z.id] = { x: X + g.x, y: Y + g.y, w: g.w, d: g.d };
        inZone(g.z.id).forEach((n, i) => blocks.push({ n, tone: g.z.tone || 'n', x: X + g.x + 14 + (i % g.cols) * PX, y: Y + g.y + 14 + Math.floor(i / g.cols) * PY, z: 24 }));
      });
      m.L.forEach((n, i) => blocks.push({ n, tone: z.tone || 'n', x: X + M, y: Y + (i + .5) * m.d / m.L.length - BD / 2, z: 16 }));
      cx += m.w + ZG;
    } else {
      const N = inZone(z.id), g = grid(N.length, z.cols || 1), Dz = Math.max(D, g.rows * PY);
      area[z.id] = { x: cx, y: 0, w: (g.cols - 1) * PX + BW, d: Dz };
      const yAt = r => (r + .5) * Dz / g.rows - BD / 2;
      N.forEach((n, i) => blocks.push({ n, tone: z.tone || 'n', x: cx + (i % g.cols) * PX, y: yAt(Math.floor(i / g.cols)), z: 0 }));
      labels.push({ t: z.title, at: [cx - 24, yAt(0) + 4, 0], along: 'y' });
      cx += area[z.id].w + ZG;
    }
  });
  blocks.forEach(b => { b.w = BW; b.d = BD; });
  /* drawn links: inside one machine they only light up; to a block in a group they stop at the machine's edge */
  const topOf = id => { let z = zone[id]; while (z.in) z = zone[z.in]; return z.id; };
  const B = Object.fromEntries(blocks.map(b => [b.n.id, b])), order = Object.fromEntries(tops.map((z, i) => [z.id, i]));
  const base = b => [b.x + BW / 2, b.y + BD / 2, b.z], links = {};
  s.edges.forEach(e => {
    const a = B[e.from], b = B[e.to], ta = topOf(a.n.zone), tb = topOf(b.n.zone);
    if (ta === tb && area[ta].machine) return;
    /* the line meets the machine's edge level with the other block, kept within the block's group */
    const end = (p, tp, q, tq) => { if (!zone[p.n.zone].in) return base(p); const R = area[tp], G = area[p.n.zone], qy = base(q)[1];
      return [order[tq] > order[tp] ? R.x + R.w - 6 : R.x + 6, Math.max(G.y + 24, Math.min(G.y + G.d - 24, qy)), 0]; };
    const pa = end(a, ta, b, tb), pb = end(b, tb, a, ta), key = [...pa, ...pb].map(v => Math.round(v)).join(',');
    const L = links[key] ||= { a: pa, b: pb, ids: new Set(), dash: true };
    L.ids.add(e.from); L.ids.add(e.to); if (!a.n.dashed && !b.n.dashed) L.dash = false;
  });
  return { blocks, plats, labels, links: Object.values(links) };
}

PANEL_TYPES.iso = {
  items: s => s.nodes.map(n => ({ title: n.title, text: `${n.title} ${n.sub || ''} ${n.what || ''}` })),
  html(s) {
    const L = isoLayout(s), ix = Object.fromEntries(s.nodes.map((n, i) => [n.id, i])), zt = Object.fromEntries(s.zones.map(z => [z.id, z.title]));
    const depth = b => isoP(b.x + b.w / 2, b.y + b.d / 2, 0)[1];
    const links = L.links.map(l => { const a = isoP(...l.a), b = isoP(...l.b);
      return `<path class="is-lk${l.dash ? ' dash' : ''}" data-ids="${[...l.ids].join(' ')}" d="M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}"/>`; }).join('');
    const plats = L.plats.map(p => `<g class="${p.cls} tone-${p.tone}">${isoBox(p).svg}</g>`).join('');
    const blocks = [...L.blocks].sort((a, b) => depth(a) - depth(b)).map(b => {
      const n = b.n, sh = isoShape(n, b), hull = isoHull(sh.pts), top = Math.min(...hull.map(q => q[1])), c = isoP(b.x + b.w / 2, b.y + b.d / 2, sh.top);
      const label = `${n.title}${n.sub ? ', ' + n.sub : ''} · ${ISO_KIND_T[n.kind || 'service']()} · ${zt[n.zone]}${n.dashed ? ' · ' + T.isoOnDemand : ''}`;
      return `<g class="dv-item is-b tone-${b.tone}${n.dashed ? ' is-dash' : ''}" data-i="${ix[n.id]}" data-id="${esc(n.id)}" data-cx="${c[0].toFixed(1)}" data-cy="${c[1].toFixed(1)}" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(label)}"><g class="is-lift">${sh.svg}<polygon class="is-ring" points="${isoPts(hull)}"/><g class="is-card"><rect class="is-cd" rx="6"/><text class="is-ct" x="${c[0].toFixed(1)}" data-y="${(top + 10).toFixed(1)}">${esc(n.title)}</text></g></g></g>`;
    }).join('');
    const labels = L.labels.map(l => { const p = isoP(...l.at), m = l.along === 'y' ? [...ISO.AY, -ISO.AX[0], -ISO.AX[1]] : [...ISO.AX, ...ISO.AY];
      return `<g transform="matrix(${m.join(' ')} ${p[0].toFixed(1)} ${p[1].toFixed(1)})"><text class="is-zl">${esc(l.t)}</text></g>`; }).join('');
    /* legend: coloured zones, dashed blocks, and the shapes in use */
    const kinds = Object.keys(ISO_KINDS).filter(k => s.nodes.some(n => (n.kind || 'service') === k)), sw = t => `<i class="is-sw tone-${t}" aria-hidden="true"></i>`;
    const leg = [...s.zones.filter(z => z.tone && z.tone !== 'n').map(z => `<span>${sw(z.tone)}${esc(z.title)}</span>`),
      ...(s.nodes.some(n => n.dashed) ? [`<span><i class="is-sw dash" aria-hidden="true"></i>${T.isoOnDemand}</span>`] : []),
      ...(kinds.length > 1 ? kinds.map(k => `<span class="is-k"><svg class="is-kg" viewBox="0 0 18 18" aria-hidden="true">${ISO_KG[k]}</svg>${ISO_KIND_T[k]()}</span>`) : [])].join('');
    const groups = s.zones.filter(z => s.nodes.some(n => n.zone === z.id));
    const list = groups.map(z => `<h5>${sw(z.tone || 'n')}${esc(z.title)}</h5><ul>${s.nodes.filter(n => n.zone === z.id).map(n => `<li>${dvBtn(ix[n.id], `${n.title}${n.dashed ? ' (' + T.isoOnDemand + ')' : ''}`, n.dashed ? 'dash' : '')}${esc(n.title)}</button></li>`).join('')}</ul>`).join('');
    return `${leg ? `<div class="is-leg">${leg}</div>` : ''}<svg class="iso" role="group" aria-label="${esc(s.title)}"><g class="is-links">${links}</g><g aria-hidden="true">${plats}</g><g>${blocks}</g><g aria-hidden="true">${labels}</g></svg><div class="is-list">${list}</div>`;
  },
  detail(s, i) {
    const n = s.nodes[i], ix = Object.fromEntries(s.nodes.map((m, j) => [m.id, j])), byId = Object.fromEntries(s.nodes.map(m => [m.id, m]));
    const zt = s.zones.find(z => z.id === n.zone).title;
    const from = s.edges.filter(e => e.to === n.id), to = s.edges.filter(e => e.from === n.id);
    const li = (e, o) => `<li><button type="button" data-go="${ix[o]}">${esc(byId[o].title)}</button>${e.text ? `: ${esc(e.text)}` : ''}</li>`;
    return { k: `${zt} · ${ISO_KIND_T[n.kind || 'service']()}${n.dashed ? ' · ' + T.isoOnDemand : ''}`, t: n.title, ts: n.sub,
      body: `<p>${esc(n.what || '')}</p>${(n.fields || []).length ? `<dl class="pn-f">${n.fields.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>` : ''}${from.length ? `<h5 class="pn-ct">${T.receivesFrom}</h5><ul class="pn-c">${from.map(e => li(e, e.from)).join('')}</ul>` : ''}${to.length ? `<h5 class="pn-ct">${T.goesTo}</h5><ul class="pn-c">${to.map(e => li(e, e.to)).join('')}</ul>` : ''}` };
  },
  /* text keeps a readable size on screen whatever the scale of the drawing; cards are sized after their text */
  mount(root, s) {
    const svg = $('.iso', root); let vb = null;
    const text = k => {
      $$('.is-zl', svg).forEach(t => { t.style.fontSize = 13 * k + 'px'; });
      $$('.is-card', svg).forEach(c => {
        const t = $('.is-ct', c), r = $('.is-cd', c), fs = 14.5 * k, px = 8 * k, h = fs * 1.75, x = +t.getAttribute('x'), y = +t.dataset.y;
        t.style.fontSize = fs + 'px'; const w = t.getComputedTextLength();
        t.setAttribute('y', (y - h / 2 + fs * .36).toFixed(1));
        r.setAttribute('x', (x - w / 2 - px).toFixed(1)); r.setAttribute('y', (y - h).toFixed(1)); r.setAttribute('width', (w + 2 * px).toFixed(1)); r.setAttribute('height', h.toFixed(1));
      });
    };
    const fit = first => {
      if (!svg.isConnected) return;
      if (first || !vb) { text(1.45); const b = svg.getBBox(), p = 24; vb = [b.x - p, b.y - p, b.width + 2 * p, b.height + 2 * p]; svg.setAttribute('viewBox', vb.map(v => v.toFixed(1)).join(' ')); }
      const w = svg.getBoundingClientRect().width, narrow = root.clientWidth <= 600;
      if (w) text(Math.min(1.45, Math.max(1, vb[2] / w)));
      $$('.is-b', svg).forEach(g => g.setAttribute('tabindex', narrow ? '-1' : '0'));
      svg.setAttribute('aria-hidden', String(narrow));
    };
    fit(true); document.fonts?.ready.then(() => fit(true));
    const ro = new ResizeObserver(() => { if (!root.isConnected) { ro.disconnect(); return; } fit(false); }); ro.observe(root);
    /* keyboard: Enter and Space select, arrows move to the nearest block in that direction */
    svg.addEventListener('keydown', e => {
      const g = e.target.closest('.is-b'); if (!g) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
      const d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key]; if (!d) return;
      e.preventDefault(); let best = null, bs = Infinity;
      $$('.is-b', svg).forEach(o => { if (o === g) return; const dx = o.dataset.cx - g.dataset.cx, dy = o.dataset.cy - g.dataset.cy, along = dx * d[0] + dy * d[1]; if (along <= 4) return;
        const sc = along + Math.abs(dx * d[1] - dy * d[0]) * 2.2; if (sc < bs) { bs = sc; best = o; } });
      best?.focus();
    });
  },
  /* selecting a block lights it, its neighbours and the links it uses */
  onOpen(root, s, i) {
    const svg = $('.iso', root), id = i === null ? null : s.nodes[i].id, near = new Set(id ? [id] : []);
    s.edges.forEach(e => { if (e.from === id) near.add(e.to); if (e.to === id) near.add(e.from); });
    svg.classList.toggle('has-hl', !!id);
    $$('.is-b', svg).forEach(g => g.classList.toggle('is-on', near.has(g.dataset.id)));
    $$('.is-lk', svg).forEach(l => l.classList.toggle('is-on', !!id && l.dataset.ids.split(' ').includes(id)));
  }
};

const diagramItems = spec => PANEL_TYPES[spec.type] ? PANEL_TYPES[spec.type].items(spec) : spec.nodes.map(n => ({ title: n.title, text: `${n.title} ${n.sub || ''} ${n.what}` }));

function createPanelDiagram(host, spec) {
  const type = PANEL_TYPES[spec.type];
  if (!type) throw new Error(`Unknown diagram type "${spec.type}". Use sequence, timeline, compare, iso, or omit type for a node diagram.`);
  host.innerHTML = `<div class="dv dv-${spec.type}" role="group" aria-label="${esc(spec.title)}"><div class="dv-art">${type.html(spec)}</div><aside class="dv-pn" hidden aria-label="${T.details}"></aside><div class="dg-foot"><span>${T.selectForDetails}</span><span class="dg-hint">${T.escCloses}</span></div></div>`;
  const root = host.firstElementChild, pn = $('.dv-pn', root), items = () => $$('.dv-item', root);
  const shown = b => b.getClientRects().length > 0 && b.getAttribute('tabindex') !== '-1';
  let sel = null;
  function open(i, focus = true) {
    if (i === null || i === sel) {
      const was = sel; sel = null; pn.hidden = true; pn.innerHTML = '';
      items().forEach(b => b.setAttribute('aria-pressed', 'false'));
      type.onOpen?.(root, spec, null);
      if (was !== null && focus) items().find(b => +b.dataset.i === was && shown(b))?.focus();
      return;
    }
    const d = type.detail(spec, i); sel = i;
    pn.innerHTML = `<div class="pn-h"><div><p class="pn-kind">${esc(d.k)}</p><h4 class="pn-t" tabindex="-1">${esc(d.t)}${d.ts ? ` <span class="pn-ts">${esc(d.ts)}</span>` : ''}</h4></div><button type="button" class="pn-x" aria-label="${T.closeDetails}">${ICON.x}</button></div><div class="pn-body">${d.body}</div>`;
    pn.hidden = false; items().forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    type.onOpen?.(root, spec, i);
    if (focus) $('.pn-t', pn).focus({ preventScroll: true });
    announce(`${T.details}: ${d.t}`);
  }
  root.addEventListener('click', e => { if (e.target.closest('.pn-x')) { open(null); return; } const go = e.target.closest('[data-go]'); if (go) { open(+go.dataset.go); return; } const b = e.target.closest('.dv-item'); if (b) open(+b.dataset.i); });
  type.mount?.(root, spec);
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
const HOME = Object.keys(PAGES).find(k => PAGES[k].home) || FLAT[0];
const parseRoute = () => { const [p, s] = location.hash.replace(/^#\/?/, '').split('/'); return { page: PAGES[p] ? p : HOME, sec: s || null }; };
$('.brand').setAttribute('href', `#/${HOME}`);
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

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $$('[role=switch].theme-btn, [role=switch].theme-bar').forEach(b => b.setAttribute('aria-checked', String(t === 'dark')));
}
$$('.theme-btn, .theme-bar').forEach(b => b.addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(t); store.set('guide.theme', t); announce(t === 'dark' ? T.darkOn : T.darkOff);
}));
applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'); /* light unless the reader chose dark */

syncBar();
{ const r = parseRoute(); render(r.page, r.sec, { first: true }); }
document.fonts?.ready.then(() => { syncBar(); placeNav(false); tocMoved = false; placeToc(); });
