# House style · Clear + Lexend

Source of truth: `assets/template/style.css`. This file sums up its tokens and rules; if you change the style, update both.

## Principles

- One HTML file, zero network requests: fonts embedded as base64 WOFF2 (Latin), no CDN.
- Warm monochrome: the accent is the ink. Colour appears only for **categories** (node kinds, chart series) and **states** (notices, outcomes).
- Colour never carries meaning alone: always with a shape and a word.
- Light and dark theme: starts from `prefers-color-scheme`, the switch then fixes it (`localStorage "guide.theme"`, attribute `html[data-theme]`).
- `prefers-reduced-motion`: only state changes remain.
- Readable at 1440, 375 and 320 px, nothing clipped.

## Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Headings (h1–h3, guide name, captions, panel title) | Lexend | 600 | negative tracking |
| Text and UI | Atkinson Hyperlegible Next | 400 · 500 · 600 · 650 | slashed zero |
| Code | Atkinson Hyperlegible Mono | 400 | |

Weights 400–700 only. Licence: SIL OFL 1.1 (texts in `assets/template/fonts/`).

| Token | Value |
|---|---|
| `--fs-h1` | `clamp(2.125rem, 1.65rem + 1.25vw, 2.5rem)` (phone `1.9375rem`), line height 1.14, tracking −0.025em |
| `--fs-h2` | `1.625rem`, tracking −0.015em |
| `--fs-h3` | `1.1875rem` |
| `--fs-lead` | `1.3125rem`, line height 1.45, colour `--muted` |
| `--fs-body` | `1.125rem` (18 px), line height 1.62 |
| `--fs-ui` / `--fs-small` | `1rem` / `.9375rem` |
| `--fs-code` | `.9375rem`, line height 1.6 |
| Measure | `--measure: 40rem` · page `--page-w: 46rem` |

## Colour

| Role | Light | Dark |
|---|---|---|
| Frame and sidebar `--bg-frame` | `#f1f0ec` | `#121211` |
| Sheet `--bg-sheet` | `#fdfdfc` | `#1b1b19` |
| Panels, code `--bg-panel` | `#f1f0ec` | `#242422` |
| Hover, current `--bg-hover` | `#e8e7e2` | `#262624` |
| Ink `--ink` (= accent, link, focus) | `#1b1a18` | `#eceae5` |
| Secondary `--muted` | `#5c5a55` | `#a9a69f` |
| Hairline `--line` | `#e3e1dc` | `#2f2e2b` |
| Strong hairline `--line-strong` | `#8a8780` | `#75726b` |
| CAUTION notice (background / text) | `#f8ecc9` / `#4d3800` | `#3a2e0e` / `#f6dfa0` |
| WARNING notice (background / text) | `#fae1dc` / `#7b1a10` | `#41180f` / `#f8c7bd` |

Contrast: text 15.3:1, secondary 6.0:1 (light).

**Notices** (STE style): symbol + word + colour. `▲ WARNING`, `◆ CAUTION`, `● NOTE` (translated with the UI language).

## Shape and space

- Radii: sheet 16 · figure 14 · boxes and tables 12 · controls 10 · nodes 10 · menu items 8 · keys 6.
- No shadows, except on what really floats (search, drawer, drop-down menus).
- Hairlines only in tables, the page header, and the borders of boxes and code.
- Three-column layout: sidebar 288 px (collapses to a 64 px rail, key `[`) · content · "On this page" 248 px. Below 1200 px "On this page" becomes a menu at the top; below 900 px the sidebar becomes a drawer.
- Content padding: 72 px top, 48 px sides (phone 20 / 18).

## Node diagrams

- Canvas `--canvas` with a dot grid `--dot`; zones on `--zone-bg` with the label on the left.
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
- Zones stay neutral (position + label). At most three categorical tints per diagram; beyond that, rely on shape and name.
- Controls: zoom − / + / Fit, Full screen. No list view: on phones the canvas opens centred on the first node.
- Keyboard: Tab between nodes, arrows to the nearest node, Enter opens the details, Esc closes.

## Sequence, timeline, comparison

- Fit to the width, no pan or zoom. Every item is a button; selecting one opens the details panel **under** the drawing (it never covers it). Esc closes it.
- Same frame, canvas and panel as node diagrams; selection ring 2 px `--edge-on`.
- Sequence: participants as nodes, dashed lifelines, numbered messages; requests solid, replies dashed.
- Timeline: horizontal with dots; the current phase is an empty ring with the word "in progress".
- Comparison: verdicts use the state colours with icon + word (strong point / so-so / weak point).
- Below 600 px of container: the sequence becomes a numbered list with "from → to", the timeline turns vertical, the comparison becomes one card per option.

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
