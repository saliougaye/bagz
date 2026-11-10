# The picker

The control that switches variants. Its appearance is not a design decision, because it sits on top of the thing being judged. Build the spec below and leave it alone.

## Deliberately outside the design system

Never style the picker with the project's tokens, fonts, or colors. One that looks native to the product becomes part of what you are looking at, and then you are judging the harness.

One dark neutral surface, the system font stack and no project variables. Dark reads as chrome over both light and dark pages, which is why it does not follow the theme.

## Behavior

- It sets a `variant` search param and reads the active variant back from it, so the URL is the source of truth and every variant a link.
- Left and right arrows step through the set. Number keys jump to one directly. `i` toggles the info panel and Escape closes it.
- Keyboard shortcuts are ignored while focus is in an input, a textarea, a select or an editable element, so the page under judgement stays usable.
- The active item carries `aria-current="true"`, and the container carries a label.
- Switching is instant. Flipping is the run's highest-frequency action, so give it no transition.
- It survives a resize, so you can hold a variant and drag the window rather than reloading per width.

## The info panel

The user looks at the screen, not at the chat, so the explanation travels with the proposal. The panel shows, for the active variant, its axis position, when it is right and what it costs, and whether it is the recommended one with one sentence on why. Below that, shared by all variants: the assumptions you made, what you did not cover, and the widths you judged at.

It is closed by default, so it never covers the piece under judgement, and follows the active variant while open. The recommended variant's button carries a small dot, so the recommendation is visible without opening anything.

## Structure

One button per variant, in the order they were named, then the info toggle. Add a replay button only where a variant has an entrance worth re-triggering. Inside the panel, show only the section whose `data-variant` matches the active variant, plus the shared section.

```html
<aside class="variant-info" id="variant-info" aria-label="About this variant" hidden>
  <section data-variant="quiet">
    <h2>Quiet <span class="variant-info-badge">Recommended</span></h2>
    <dl>
      <dt>Position</dt><dd>Lowest visual weight</dd>
      <dt>Right when</dt><dd>The page is used daily</dd>
      <dt>Costs</dt><dd>Least memorable</dd>
    </dl>
    <p>Recommended because the screen is opened many times a day.</p>
  </section>
  <section data-variant="editorial" hidden>…</section>
  <section data-variant="dense" hidden>…</section>
  <section class="variant-info-shared">
    <h3>Assumptions</h3>
    <ul><li>Desktop first; the list holds about 40 rows.</li></ul>
    <h3>Not covered</h3>
    <ul><li>Error state of the export.</li></ul>
    <p>Judged at 375px and 1440px.</p>
  </section>
</aside>

<nav class="variant-picker" aria-label="Variants">
  <button type="button" data-variant="quiet" data-recommended aria-current="true">Quiet</button>
  <button type="button" data-variant="editorial">Editorial</button>
  <button type="button" data-variant="dense">Dense</button>
  <button type="button" class="variant-info-toggle" aria-expanded="false" aria-controls="variant-info" aria-label="About this variant">i</button>
</nav>
```

## Placement and styling

Fixed, bottom centre, above everything the page can stack, with the info panel opening just above it. Keep both clear of the piece under judgement. Where the variants live at the bottom of the viewport, move the picker to top centre, open the panel below it, and say so.

```css
.variant-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  translate: -50% 0;
  z-index: 2147483647;
  display: flex;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgb(20 20 20 / 0.9);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1), 0 8px 24px rgb(0 0 0 / 0.25);
  font: 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  user-select: none;
}

.variant-picker button {
  padding: 7px 14px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: rgb(255 255 255 / 0.6);
  cursor: pointer;
}

.variant-picker button:hover {
  color: rgb(255 255 255 / 0.85);
}

.variant-picker button[aria-current="true"] {
  background: rgb(255 255 255 / 0.14);
  color: rgb(255 255 255);
}

.variant-picker button:focus-visible {
  outline: 2px solid rgb(255 255 255 / 0.7);
  outline-offset: 2px;
}

.variant-picker button[data-recommended]::after {
  content: "";
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-left: 6px;
  vertical-align: middle;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.8);
}

.variant-picker .variant-info-toggle {
  width: 27px;
  padding: 7px 0;
  font-style: italic;
  font-family: Georgia, serif;
}

.variant-picker .variant-info-toggle[aria-expanded="true"] {
  background: rgb(255 255 255 / 0.14);
  color: rgb(255 255 255);
}

.variant-info {
  position: fixed;
  bottom: 72px;
  left: 50%;
  translate: -50% 0;
  z-index: 2147483647;
  width: min(360px, calc(100vw - 32px));
  max-height: 50vh;
  overflow-y: auto;
  padding: 16px;
  border-radius: 14px;
  background: rgb(20 20 20 / 0.94);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1), 0 8px 24px rgb(0 0 0 / 0.25);
  color: rgb(255 255 255 / 0.85);
  font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.variant-info h2,
.variant-info h3 {
  margin: 0 0 8px;
  color: rgb(255 255 255);
  font-size: 13px;
  font-weight: 600;
}

.variant-info h3 {
  margin-top: 14px;
  color: rgb(255 255 255 / 0.6);
}

.variant-info dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 0 0 8px;
}

.variant-info dt {
  color: rgb(255 255 255 / 0.5);
}

.variant-info dd,
.variant-info p {
  margin: 0;
}

.variant-info ul {
  margin: 0;
  padding-left: 16px;
}

.variant-info-badge {
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.14);
  font-size: 11px;
  font-weight: 500;
}

.variant-info-shared {
  margin-top: 12px;
  padding-top: 4px;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}
```

In a framework, keep the class names and the structure and change only the rendering syntax. In In-place mode, the picker and the panel live in their own throwaway file and render only in development ([in-place.md](in-place.md)).
