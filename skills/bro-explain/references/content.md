# content.js: the contract

`content.js` is plain JavaScript run in the page, after the helpers and before the engine. It must define four constants: `GUIDE`, `PAGES`, `NAV`, `DIAGRAMS`. Everything else is optional.

## GUIDE

```js
const GUIDE = {
  title: 'Ansible sul Mac mini',      // sidebar brand, <title>, home h1 if the home page uses it
  lang: 'it',                          // language of the guide and its UI = the user's language
  updated: '8 novembre 2026',          // shown as text
  updatedISO: '2026-11-08',            // for <time datetime>
  meta: ['Base, niente codice', '20 minuti']   // optional chips under the home lead
};
```

## PAGES

An object keyed by page id. The id appears in URLs (`#/page-id/section-id`), so use short kebab-case ids.

```js
const PAGES = {
  introduction: {
    title: 'How a web application works',  // h1
    nav: 'Introduction',                   // optional shorter label for sidebar, prev/next
    line: 'What this guide is and how to read it.',  // one sentence for the home contents index
    lead: 'One or two sentences under the title.',
    home: true,                            // exactly one page; it gets meta chips and a "Start with…" button
    body: () => `
<h2 id="about">About this guide</h2>
<p>…</p>
<h2 id="contents">Contents</h2>
${contentsIndex()}`
  },
  // more pages…
};
```

- `body` is a function returning an HTML string (a template literal). It runs at render time and for the search index.
- Every `h2`/`h3` needs a unique `id` within the page. Only direct children of the body count for "On this page".
- Text inside the template literal is HTML: escape `<`, `>` and `&` in prose and code (`&lt;`), and never write `</script` (use `<\/script`).
- The home page should end with `${contentsIndex()}`: it lists every page with its `line`, grouped as in the sidebar.

## NAV

Sidebar order. Groups contain pages and folders; folders may nest one more level.

```js
const NAV = [
  { group: 'Start here', items: [{ page: 'introduction' }] },
  { group: 'In detail', items: [
    { page: 'edge' },
    { folder: 'Data', id: 'data', open: true, items: [
      { page: 'database' },
      { folder: 'Temporary data', id: 'temp', items: [{ page: 'cache' }] } ] } ] }
];
```

The reading order (prev/next, "Start with…") follows NAV top to bottom. Every page in PAGES must appear in NAV exactly once.

## DIAGRAMS

An object keyed by diagram id, `{}` when the guide has none. Five types: node diagrams (architecture, flow), `sequence`, `timeline`, `compare`. Spec formats: `references/diagrams.md`. Place a diagram with `${figure('arch', 'Title', 'One sentence: what it shows and what to select.')}`.

## Building blocks

All of these are already styled. Use them as written; do not add inline styles.

| Need | Write |
|---|---|
| Paragraphs, lists | `<p>`, `<ul>`, `<ol>` |
| A procedure | `<ol class="steps"><li>One action.</li>…</ol>` (numbered circles) |
| Risk or tip | `${adm('warning', 'Text.', 'Second paragraph.')}`: kinds `warning` (people), `caution` (equipment, data), `note` (help). Label and symbol come from the UI language. |
| Code or terminal | `` ${code('Terminal', `<span class="c">$</span> ansible-playbook site.yml`)} ``: escaped HTML; `<span class="c">` greys prompts and comments; a leading `$ ` is dropped on copy. |
| Inline code | `<code>site.yml</code>` |
| Table | see below |
| Key facts (home) | `<dl class="meta"><div><dt>Level</dt><dd>Beginner</dd></div>…</dl>` |
| Term list with symbol | `<dl class="kinds"><div><dt><span aria-hidden="true">▲</span>WARNING</dt><dd>…</dd></div>…</dl>` |
| Diagram | `${figure('id', 'Title', 'Description')}` |
| Bar chart | `${chart({…})}`, see below |
| Invented numbers | `${EXAMPLE}` tag (in table captions), `illustrative: true` in charts |

### Table

```html
<div class="tbl-wrap"><table class="tbl">
<caption>${EXAMPLE}<b>Time for each part</b>One sentence that says what the table shows.</caption>
<thead><tr><th scope="col">Part</th><th scope="col" class="num">Time</th></tr></thead>
<tbody>
<tr><th scope="row">DNS</th><td class="num">20 ms</td></tr>
<tr><th scope="row">Cache</th><td class="num na"><span aria-hidden="true">—</span><span class="sr">not used</span></td></tr>
</tbody>
<tfoot><tr><td>Total</td><td class="num">72 ms</td></tr></tfoot>
</table></div>
```

`class="num"` right-aligns numbers with tabular figures. An empty cell is a dash for the eye and words for screen readers. Wide tables scroll inside `.tbl-wrap`; they never break the page.

### Chart

Horizontal bars, stacked when there are several series. Use it for a comparison of a few rows (2–6), never for a time series or many categories (use a table).

```js
${chart({
  title: 'Prima e seconda esecuzione',
  desc: 'Esito degli 11 task di site.yml.',
  unit: '',                 // appended to values: 'ms', 'GB'…
  illustrative: true,       // shows the EXAMPLE tag; required for invented numbers
  series: [
    { key: 'ok', label: 'Ok', color: 'good' },
    { key: 'changed', label: 'Changed', color: 'warning' },
    { key: 'failed', label: 'Failed', color: 'critical' }
  ],
  rows: [
    { label: '1ª esecuzione', values: { ok: 2, changed: 9, failed: 0 } },
    { label: '2ª esecuzione', values: { ok: 11, changed: 0, failed: 0 } }
  ]
})}
```

- Colours: `c1`, `c2`, `c3` for categories, always in this order and at most three. `good`, `warning`, `critical` for states (they get an icon). Do not mix the two families in one chart.
- The chart writes the legend, a value line under each bar, a native tooltip per segment and a "Show as a table" view. Text never takes the series colour.

## Language

- Write the guide in the language the user writes to you in. `GUIDE.lang` sets the UI strings and `<html lang>` to match.
- A language missing from `assets/template/i18n.json`: add a block with the same keys as `en` before building.
- The plain-language rules apply in every language: short sentences, active voice, one term per concept. Keep the technical words the reader will see on screen (`playbook`, `task`, `changed`) and explain them once.
