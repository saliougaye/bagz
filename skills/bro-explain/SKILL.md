---
name: bro-explain
description: Explain a topic or analyse a decision as an offline HTML guide in the user's house style, with sidebar, search, diagrams and charts. Use when the user asks for a guide, an explainer, an analysis, or "explain X" as a page to read or present.
---

# bro-explain

You are turning a topic into a guide the user will read on a laptop, check on a phone, or put on a projector. The look is already decided: it is the user's house style, and every guide shares it. So your whole job is the part only you can do well: understanding what the user wants to know, getting the facts right, and organising them so they are easy to find and easy to read.

## The reader

The reader is the user, learning something or looking it up for themself. Read the request for what they already know and skip it. Go straight to the point; do not pad the guide for an imagined beginner.

The depth comes from the request too. "Give me the big picture of Kubernetes" wants concepts and how the pieces connect. "How do I set up a reverse proxy" wants steps and commands to copy. "Explain how TLS works" may want only theory. When the request leaves a real gap, ask one to three short questions rather than guessing.

Sometimes the user does not want to learn a topic but to reach a decision: "analyse whether I should move my homelab to Proxmox", "which backup tool fits my setup", "is this architecture going to hold". That is an analysis, and it reads differently from a guide. Put the conclusion first: on the home page, say what you recommend and why in a few sentences, so the user could stop there. Then show the work: the criteria that matter for *their* situation, the options judged against them, the trade-offs, the risks, and what would change your answer. Say which assumptions you made about their context and ask about the ones that would flip the conclusion. A comparison diagram or a chart often earns its place here. Stay honest about uncertainty: an analysis that sounds surer than the evidence is worse than no analysis.

Write in the language the user is writing to you in, unless they ask for another one.

## Facts

Your sources are usually your own knowledge plus web research; local files only when the user points to them. Things that change over time (versions, commands, flags, defaults, limits, prices) are where guides go wrong, so check them on the web. The guide does not cite its sources, which makes getting things right your responsibility. When something stays uncertain, say so in the text instead of smoothing it over.

## Agree on the structure first

Before writing, show the user a short plan and wait for their yes: whether it is a guide or an analysis, the depth and language you understood, the pages grouped as they will appear in the sidebar with their main sections, where a diagram or a chart helps and what it shows, and where the files will go. A minute spent here saves rewriting a whole guide.

Some things that make a structure work:

- A home page that says what the guide covers and how to read it, ending with the contents index.
- As many pages as the topic needs, one per idea the reader would look up on its own. A small topic can be a home page and two pages; a large one can have dozens. Group pages by what the reader is trying to do.
- Sections short enough to scan. Headings are what the reader sees in "On this page" and in search, so make them say something.
- A diagram only when it shows something text cannot: an architecture (blocks in zones), a flow (steps and decisions), a sequence (who talks to whom, in order), a timeline (events or phases in order), or a comparison (two or three options judged on the same criteria). A chart only for a real comparison of a few numbers. Neither is decoration.

## Voice

Talk to the reader directly and informally, in the second person ("open the file", "apri il file"), but stay sober: no jokes, no hype, no emoji. Keep sentences short and active while still reading naturally; ASD-STE100 is the inspiration, not a rulebook. Use one term for one thing, define it once, and do not switch to synonyms. Lead with what the reader needs: what it is, why it matters, what to do. Procedures are numbered steps with one action each. Risks go in WARNING / CAUTION / NOTE notices. Any invented or estimated number is marked as an example, never presented as a measurement.

## The house style is fixed

Do not restyle a guide: no new colours, fonts, shadows or layout. Consistency across the user's guides is the point. If a guide truly needs something the template cannot do, build it with the existing tokens (`references/style.md`) and tell the user, so the template grows on purpose rather than by accident.

## Generating the HTML

The engine (layout, search, sidebar, diagrams, charts, theme, translations) is built and tested. You write one file, `content.js`, and two scripts do the rest.

1. **Pick the output folder.** Next to the sources when the guide explains a repo or a folder (for example `docs/<guide-name>/`), otherwise a `<guide-name>/` subfolder of the current working directory.
2. **Write `<out>/content.js`.** Copy `assets/example/content.js` and replace its content, keeping the shape. Read `references/content.md` first: it has the contract (`GUIDE`, `PAGES`, `NAV`, `DIAGRAMS`) and every building block (steps, notices, code, tables, charts). Read `references/diagrams.md` when there is a diagram. Set `GUIDE.lang` to the guide's language; if `assets/template/i18n.json` has no block for it, add one with the same keys as `en`.
3. **Build:**
   ```bash
   python3 <skill>/scripts/build.py <out>/content.js -o <out>/index.html
   ```
4. **Check:**
   ```bash
   node <skill>/scripts/check.mjs <out>/index.html --shots <out>/.shots
   ```
   It loads every page at 1440, 375 and 320 px in light and dark, and fails on console errors, overflow, clipped content, network requests, or a diagram that does not open its details. Fix until it prints `OK`. Then look at a few screenshots yourself: the checker cannot see a crowded diagram or an awkward page. Delete `.shots` afterwards.
5. **Deliver.** Open the guide in the browser (`open` on macOS, `xdg-open` on Linux) and tell the user the path in a line or two, plus anything the check could not cover.

To update a guide later, edit its `content.js`, rebuild, check, and update `GUIDE.updated`.

## Files

| Path | What it is |
|---|---|
| `assets/example/content.js` | Complete example guide: 10 pages, all five diagram types, tables, a chart. |
| `assets/template/` | The engine: `style.css`, `shell.html`, `helpers.js`, `engine.js`, `i18n.json`, `fonts/`. |
| `scripts/build.py` | `content.js` + template → one HTML file with embedded fonts, no network requests. |
| `scripts/check.mjs` | Headless Chrome checks (Node 22+, Google Chrome; `CHROME=/path` to override). |
| `references/content.md` | Content contract and building blocks. Read before writing. |
| `references/diagrams.md` | Diagram specs and layout. Read when the guide has a diagram. |
| `references/style.md` | House style tokens and rules. Read when extending a component. |
