# Diagrams

Five types, all placed with `${figure('id', 'Title', 'Description')}` and defined in `DIAGRAMS`:

| Type | Use it for | `type` |
|---|---|---|
| Architecture | where things are: blocks grouped in zones | (none) |
| Flow | steps and decisions in order | (none, with `kinds`) |
| Sequence | who talks to whom, in order (client → server → database) | `'sequence'` |
| Timeline | events or phases in order (history, roadmap, lifecycle) | `'timeline'` |
| Comparison | two or three options judged on the same criteria | `'compare'` |

A plain list of items is not a diagram. Pick a diagram only when the shape adds something the text cannot.

Architecture and flow are **node diagrams**: pan, zoom, full screen, a details panel over the canvas. Sequence, timeline and comparison **fit the width**: no pan or zoom, every item is a button, and the details panel opens under the drawing.

# Node diagrams (architecture, flow)

## Spec

```js
const DIAGRAMS = {
  arch: {
    title: 'The main blocks of a web application',
    nodeW: 204, nodeH: 74,          // every node has the same size
    w: 856, h: 472,                 // size of the drawing (world), in px
    hint: 'Drag to move · Ctrl or ⌘ + scroll to zoom · Tab and arrow keys to move between blocks',
    zones: [                        // optional horizontal bands with a label on the left
      { id: 'client', title: 'Client', x: 0, y: 0, w: 856, h: 106 }
    ],
    nodes: [
      { id: 'browser', zone: 'client', x: 384, y: 16,
        title: 'Browser', sub: 'Shows the page',              // sub: optional, one short line
        what: 'Two or three sentences for the details panel.',
        fields: [['Keeps data', 'A copy of files, for a short time.']] }   // optional key/value rows
    ],
    edges: [
      { from: 'browser', to: 'dns', text: 'asks for the IP address' }   // text: shown in the panel
    ]
  }
};
```

Flow diagrams add `kinds` and give each node a `kind`:

```js
kinds: { start: { label: 'Start' }, step: { label: 'Step' }, decision: { label: 'Decision' }, end: { label: 'End' } },
nodes: [{ id: 's1', kind: 'start', x: 270, y: 0, title: '…', what: '…' }, …],
edges: [{ from: 'd1', to: 'hit', label: 'yes', fs: 'l', ts: 't' }]
```

- Only these four kinds exist: each has a fixed shape and colour (start green, decision orange, end blue, step neutral). Translate the `label`, keep the keys.
- `label` on an edge is drawn on the arrow (use it for decision branches: yes/no, sì/no). `text` is only in the panel.
- `fs` / `ts` force the side where an edge leaves / arrives: `t`, `b`, `l`, `r`. Without them the engine picks the side from the positions.
- The panel lists "Receives from" and "Goes to" automatically from the edges.

## Layout

Coordinates are absolute, top-left of each node. Place nodes on a grid; the engine draws curved edges between ports.

- **Architecture**: zones as full-width bands, `h ≈ nodeH + 32`, 16 px gap between bands. Nodes 40 px apart horizontally (`x` step = `nodeW + 40`); leave ~130 px on the left of each band for the zone label. Example: `nodeW 204`, columns at `x = 140, 384, 628`, band `y = 0, 122, 244, 366`, node `y = band y + 16`.
- **Flow**: one column for the main path, branches to the left and right. `nodeW 240`, `nodeH 82`, vertical step 112 (`nodeH + 30`), branch columns at `x = 0` and `x = 540` with the main column at `x = 270`. Branches rejoin into the next main node with `fs: 'b'` and `ts: 'l'` / `'r'`.
- `w` / `h` = right / bottom edge of the furthest node or zone.
- Keep titles short (they wrap to two lines in the node). Put detail in `what`.
- 5–12 nodes per diagram. More than that: split into two diagrams or move detail to text.
- On phones the diagram opens at a readable zoom, centred on the first node; the reader drags or uses Full screen. Check the 375 px screenshot: the first node must be visible and readable.

## Colour

Colour in diagrams means a node **kind** and nothing else. Architecture zones stay neutral: their label and position say which zone a block is in. Do not invent new kind colours: three tints is the limit for colours that stay distinguishable for colour-blind readers, and the neutral step keeps the exceptions visible.

# Sequence

```js
'seq-app': {
  type: 'sequence', title: 'One request inside the application server',
  parts: [{ id: 'br', label: 'Browser' }, { id: 'app', label: 'Application server', sub: 'optional second line' }, …],
  msgs: [
    { from: 'br', to: 'app', text: 'GET /orders/1042', what: 'Details for the panel.' },
    { from: 'cache', to: 'app', text: 'not found', reply: true, what: '…' },   // reply: dashed arrow
    { from: 'app', to: 'app', text: 'makes the page', what: '…' }            // same from/to: self message
  ]
}
```

- 2–5 participants, left to right in the order the reader meets them. Messages are numbered automatically.
- Keep `text` short (it sits on one line above the arrow and is cut with "…" if too long); explain in `what`.

# Timeline

```js
'cache-life': {
  type: 'timeline', title: 'The life of one copy in the cache',
  items: [
    { date: '0 s', title: 'Copy written', what: 'Details for the panel.' },
    { date: 'Today', title: 'Core + ansible package', now: true, what: '…' }   // now: current phase, empty ring + "in progress"
  ]
}
```

- 3–8 items fit on one row on a laptop; titles wrap to two or three lines, so keep them short.
- `date` is free text: a year, a time, "Phase 2", "Today".

# Comparison

```js
stores: {
  type: 'compare', title: 'Where to keep data',
  options: [{ id: 'db', label: 'Database', sub: 'the main copy' }, …],          // 2 or 3 options
  rows: [
    { label: 'Speed', what: 'What the criterion means.', cells: {
      db: ['mid', 'Fast, but slower than memory.'], cache: ['good', '…'], queue: ['good', '…'] } }
  ],
  when: { db: 'The main copy of your data.', … }                               // optional last row
}
```

- Each cell is `[verdict, text]` with verdict `'good'`, `'mid'` or `'bad'`: the table shows icon + word, the panel shows the text for every option side by side.
- Phrase each criterion so that "good" is good for the reader (write "Speed", not "Latency").
- 3–6 criteria. More than that: split the comparison or use a table.
