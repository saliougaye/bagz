# House style · Clear + Lexend

Source of truth: `assets/template/style.css`. This file sums up its tokens and rules; if you change the style, update both.

## Principles

- One HTML file, zero network requests: fonts embedded as base64 WOFF2 (Latin), no CDN.
- Warm monochrome: the accent is the ink. Colour appears only for **categories** (node kinds, chart series) and **states** (notices, outcomes).
- Colour never carries meaning alone: always with a shape and a word.
- Light theme by default, always, whatever the system setting: it reads best for long text. Dark only when the reader turns it on with the switch, which remembers the choice (`localStorage "guide.theme"`, attribute `html[data-theme]`). Dark is "black in layers": pure black frame, a sheet one step lighter, near-white ink (not #fff, to cut halation) and more leading.
- `prefers-reduced-motion`: only state changes remain.
- Readable at 1440, 375 and 320 px, nothing clipped.

## Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Headings (h1–h3, guide name, captions, panel title) | Lexend | 600 | negative tracking; the guide name stands alone in the sidebar, no logo |
| Text and UI | Atkinson Hyperlegible Next | 400 · 500 · 600 · 650 | slashed zero |
| Code | Atkinson Hyperlegible Mono | 400 | |

Weights 400–700 only. Licence: SIL OFL 1.1 (texts in `assets/template/fonts/`).

| Token | Value |
|---|---|
| `--fs-h1` | `clamp(2.125rem, 1.65rem + 1.25vw, 2.5rem)` (phone `1.9375rem`), line height 1.14, tracking −0.025em |
| `--fs-h2` | `1.625rem`, tracking −0.015em |
| `--fs-h3` | `1.1875rem` |
| `--fs-lead` | `1.3125rem`, line height 1.45, colour `--muted` |
| `--fs-body` | `1.125rem` (18 px), line height 1.62 (dark 1.68) |
| `--fs-ui` / `--fs-small` | `1rem` / `.9375rem` |
| `--fs-code` | `.9375rem`, line height 1.6 |
| Measure | `--measure: 40rem` for text · page `--page-w: 54rem`: tables, diagrams and charts use the full page width |

## Colour

| Role | Light | Dark |
|---|---|---|
| Frame and sidebar `--bg-frame` | `#f1f0ec` | `#000000` |
| Sheet `--bg-sheet` | `#fdfdfc` | `#0f0f0f` |
| Panels `--bg-panel` | `#f1f0ec` | `#1a1a1a` |
| Hover, current `--bg-hover` | `#e8e7e2` | `#1f1f1f` |
| Ink `--ink` (= accent, link, focus) | `#1b1a18` | `#f2f2f2` |
| Secondary `--muted` | `#5c5a55` | `#a6a6a6` |
| Hairline `--line` | `#e3e1dc` | `#2a2a2a` |
| Strong hairline `--line-strong` | `#8a8780` | `#737373` |
| CAUTION notice (background / text) | `#f8ecc9` / `#4d3800` | `#30260a` / `#f3da95` |
| WARNING notice (background / text) | `#fae1dc` / `#7b1a10` | `#36110e` / `#f5c1bb` |

Contrast: text 15.3:1, secondary 6.0:1 (light); text 17.1:1, secondary 7.9:1 (dark). Dark is neutral black and white, with no warm or cool tint: the sidebar is pure black and the page sits one step above it, so the two stay apart as in light.

**Notices** (STE style): symbol + word + colour. `▲ WARNING`, `◆ CAUTION`, `● NOTE` (translated with the UI language).

## Shape and space

- Radii: sheet 16 · figure 14 · boxes and tables 12 · controls 10 · nodes 10 · menu items 8 · keys 6.
- No shadows, except on what really floats (search, drawer, drop-down menus).
- Hairlines only in tables, the page header, and the borders of boxes and code.
- Sidebar group titles: 12 px, bold, uppercase, tracking 0.07em, in ink, with a hairline under them.
- Three-column layout: sidebar 288 px (collapses to a 64 px rail, key `[`) · content · "On this page" 248 px. Below 1200 px "On this page" becomes a menu at the top; below 900 px the sidebar becomes a drawer.
- Content padding: 72 px top, 48 px sides (phone 20 / 18).

## Node diagrams

- Canvas: the sheet, no grid. Edges are right-angle with 12 px rounded corners.
- Architecture: zones are columns, read left to right. Each column is tinted with its zone colour (7%), has a 5 px top bar in that colour and an uppercase 13 px title in ink at the top; its blocks get a 4 px top edge in the same colour. Zone colours = categorical c1, c2, c3 (neutral `--k-step` for the first of four).
- Flow: no zones; kinds as below.
- Node: background `--node-bg`, 1 px border `--node-line`, radius 10, title 17 px / 650, subtitle 14.5 px `--muted`.
- **Node kinds**: SVG shape + colour + name, the same in node, legend and panel.

| Kind | Shape | Light | Dark | In the node |
|---|---|---|---|---|
| Start | triangle | `#1baf7a` | `#199e70` | 6 px left border + 11% tinted background |
| Step | square | `#8a8780` | `#75726b` | neutral, no tint |
| Decision | diamond | `#eb6834` | `#d95926` | 6 px left border + 11% tinted background |
| End | circle | `#2a78d6` | `#3987e5` | 6 px left border + 11% tinted background |

  Tints = categorical slots 3, 2, 1 of the validated palette (all pairs distinguishable, colour-blind included). In light mode green and orange are below 3:1 on the background: shape and name compensate.
- Edges 2 px `--edge`; highlighted 3 px `--edge-on`. Selection: 3 px ring `--edge-on`, the rest dims.
- At most three categorical tints per diagram; beyond that, rely on shape and name.
- Controls: zoom − / + / Fit, Full screen. No list view: on phones the canvas opens centred on the first node.
- Keyboard: Tab between nodes, arrows to the nearest node, Enter opens the details, Esc closes.

## Sequence, timeline, comparison

- Fit to the width, no pan or zoom. Every item is a button; selecting one opens the details panel **under** the drawing (it never covers it). Esc closes it.
- Same frame, canvas and panel as node diagrams; selection ring 2 px `--edge-on`.
- Sequence: participants as nodes, dashed lifelines, numbered messages; requests solid, replies dashed.
- Timeline: horizontal with dots; the current phase is an empty ring with the word "in progress".
- Comparison: each cell leads with its value in bold (17 px) with the state icon, the reason under it in `--muted`; the cell is tinted with the state colour (good 11%, warning 16%, critical 11% over the sheet); the verdict word is for screen readers only. A recommended option gets a 2 px ink ring and an ink chip "Recommended". Under 640 px of container: one card per option.
- Below 600 px of container: the sequence becomes a numbered list with "from → to", the timeline turns vertical.

## Charts

- Component: `chart()` in `assets/template/helpers.js` (horizontal bars, legend, values, tooltip, table view). Tokens: `--c1`…`--c3`, `--good`, `--warning`, `--critical`.
- Form first, then colour. One y axis only.
- Categorical series in fixed order: blue `#2a78d6`, orange `#eb6834`, aqua `#1baf7a` (dark `#3987e5`, `#d95926`, `#199e70`). At most three series together.
- States (e.g. ok / changed / failed): `#0ca30c` good, `#fab219` warning, `#d03b3b` critical (same in both themes), always with icon + word. Do not mix categories and states in one chart.
- Thin marks, 4 px rounded ends, 2 px gap between segments, hairline grid `--line`.
- Text in `--ink` / `--muted`, never in the series colour.
- Legend from two series, direct value labels, hover tooltip, equivalent table.
- Data that is not measured: visible `EXAMPLE` tag (`illustrative: true`).

## Motion

- Easing: `cubic-bezier(0.23,1,0.32,1)` (out), drawer `cubic-bezier(0.32,0.72,0,1)`.
- Durations: 140–280 ms. Sidebar and "On this page" indicators slide; a page enters with a fade + 8 px.

## Accessibility floor

Skip link, visible 2 px focus `--focus`, everything by keyboard, accessible names, `aria-live` announcements, no meaning by colour alone, `inert` on what sits behind drawers and the rail.
