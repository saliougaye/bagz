/* Building blocks for content.js: ICON, esc, adm(), code(), figure(), chart(), EXAMPLE. */
const ICON = {
  chev: '<svg class="i chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  left: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>',
  right: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  lines: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h13"/></svg>',
  copy: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  x: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  full: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  shape: { start: '<path d="M3.5 1.8v12.4L14.2 8z"/>', step: '<rect x="2" y="2" width="12" height="12" rx="2.5"/>', decision: '<path d="M8 .9 15.1 8 8 15.1.9 8z"/>', end: '<circle cx="8" cy="8" r="6.6"/>' }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ADM = { warning: ['▲', T.warning], caution: ['◆', T.caution], note: ['●', T.note] };
const adm = (k, ...ps) => `<div class="adm adm-${k}" role="note" aria-label="${ADM[k][1]}"><p class="adm-h"><span class="adm-g" aria-hidden="true">${ADM[k][0]}</span>${ADM[k][1]}</p><div class="adm-b">${ps.map(p => `<p>${p}</p>`).join('')}</div></div>`;
const code = (label, src) => `<div class="code"><div class="code-h"><span>${label}</span><button type="button" class="copy" aria-label="${T.copy}: ${esc(label)}">${ICON.copy}${T.copy}</button></div><pre tabindex="0" aria-label="${esc(label)}"><code>${src}</code></pre></div>`;
const figure = (id, title, desc) => `<figure class="fig wide" aria-labelledby="cap-${id}"><div class="dg-mount" data-dg="${id}"></div><figcaption id="cap-${id}"><span class="fig-t">${title}</span><span>${desc}</span></figcaption></figure>`;
const EXAMPLE = `<span class="ex">${T.example}</span>`;


/* Horizontal bar chart (stacked when there are several series). For simple comparisons of a few rows.
   chart({ title, desc, unit, illustrative, series: [{ key, label, color }], rows: [{ label, values: { key: n } }] })
   color: 'c1' | 'c2' | 'c3' (categories, in this order) or 'good' | 'warning' | 'critical' (states, with an icon). */
const ST_ICON = { good: '<path d="M3.5 8.5l3 3 6-7"/>', warning: '<path d="M8 3.5v5.5M8 12.2v.3"/>', critical: '<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>' };
const chartMark = c => ST_ICON[c]
  ? `<svg class="ch-st" viewBox="0 0 16 16" aria-hidden="true" style="--c:var(--${c})"><rect x="1" y="1" width="14" height="14" rx="4"/>${ST_ICON[c]}</svg>`
  : `<span class="ch-sw" aria-hidden="true" style="--c:var(--${c})"></span>`;
let CHART_N = 0;
function chart({ title, desc = '', unit = '', illustrative = false, series, rows }) {
  const id = 'ch' + (++CHART_N), u = unit ? ' ' + unit : '';
  const tot = r => series.reduce((s, x) => s + (r.values[x.key] || 0), 0), max = Math.max(...rows.map(tot)) || 1;
  const fmt = n => n.toLocaleString(document.documentElement.lang || 'en');
  const legend = series.length > 1 ? `<div class="ch-leg">${series.map(s => `<span>${chartMark(s.color)}${esc(s.label)}</span>`).join('')}</div>` : '';
  const row = r => `<div class="ch-row"><span class="ch-l">${esc(r.label)}</span><div class="ch-bar" aria-hidden="true">${series.filter(s => r.values[s.key]).map(s =>
      `<span class="ch-seg" style="--c:var(--${s.color});width:${(r.values[s.key] / max * 100).toFixed(2)}%" title="${esc(s.label)}: ${fmt(r.values[s.key])}${u}"></span>`).join('')}</div>
    <span class="ch-v">${series.length > 1 ? series.map(s => `<span>${chartMark(s.color)}${fmt(r.values[s.key] || 0)} ${esc(s.label.toLowerCase())}</span>`).join('') + `<span class="ch-tot">${T.total} ${fmt(tot(r))}${u}</span>` : `<span>${fmt(tot(r))}${u}</span>`}</span></div>`;
  const table = `<details class="ch-tbl"><summary>${T.showTable}</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col"></th>${series.map(s => `<th scope="col" class="num">${esc(s.label)}${u}</th>`).join('')}${series.length > 1 ? `<th scope="col" class="num">${T.total}${u}</th>` : ''}</tr></thead><tbody>${rows.map(r => `<tr><th scope="row">${esc(r.label)}</th>${series.map(s => `<td class="num">${fmt(r.values[s.key] || 0)}</td>`).join('')}${series.length > 1 ? `<td class="num">${fmt(tot(r))}</td>` : ''}</tr>`).join('')}</tbody></table></div></details>`;
  return `<figure class="chart wide" aria-labelledby="${id}-t"><figcaption class="ch-h">${illustrative ? EXAMPLE : ''}<span class="ch-t" id="${id}-t">${esc(title)}</span>${desc ? `<span class="ch-d">${esc(desc)}</span>` : ''}</figcaption>${legend}<div class="ch-rows">${rows.map(row).join('')}</div>${table}</figure>`;
}
