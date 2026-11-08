---
name: swag-it-out
description: Propose an HTML mockup of a UI for a project or a feature, with several variants to choose from. Use when the user asks for a mockup, a UI proposal or a screen sketch.
---

# swag-it-out

The user wants to see an idea before it gets built. Your job is to turn a project or a feature into an HTML mockup they can open, look at, compare and react to. A mockup is a question put in visual form: "is this the direction?". Make it concrete enough that the answer is easy, and cheap enough to throw away.

It usually comes up in two situations. In a project that is already running, the user needs a UI proposal for one feature. For a new project, the user wants to see proposals for the complete flow of the app.

## Work with the user's skills

The user always asks for the same set of skills when they want a mockup. This skill exists so they do not have to repeat it. Load them with the Skill tool at the start, because each one covers something you should not improvise:

- **`design-taste-frontend`, `better-ui` and, for web projects, `web-design-engineer`** drive the UI and UX. They overlap, and which ones fit depends on the situation: a look created from scratch, a redesign, a feature that must sit inside an existing design system. Decide from what you see and use one or several; do not ask the user.
- **`emil-design-eng`** drives the animations and the small details that make an interface feel good. Motion belongs in the mockup, because how something moves is part of what the user is judging.

Variants are covered by [references/variants.md](references/variants.md). Read it before you plan them, together with [references/picker.md](references/picker.md) when you build the switcher.

These skills bring craft, not process. This skill decides the goal, the single interview and the format of the output; if another skill wants to run its own questions or its own workflow, let it inform your choices instead of repeating them to the user.

Mobile apps have no dedicated skill yet. For those, lean on the skills above where they still apply, design for a phone-sized viewport and touch, and say plainly that no mobile-specific skill was used.

If one of these skills is not installed or cannot be loaded, do not stop: carry on with the others, do the missing part by your own judgement, and tell the user which one was missing.

## Understand before drawing

Look at what the request gives you. If it is about an existing project, read enough of it to find its real shape: the stack, the design tokens or the CSS it already has, the components, the copy and the language it speaks, the data it would show. A mockup that ignores these looks nice and is useless, because the user cannot judge whether it fits. If it is a new project, the idea and the audience are all you have, so use them well.

## Interview the user when something is not clear

If the request leaves a gap that would change the design, stop and interview the user before you draw. Typical gaps: who the screen is for, what the one thing it must do is, web or mobile (and for mobile, iOS, Android or both), whether it must match an existing style, which constraints exist (brand, density, devices), what they already dislike. Do not ask what you can find by reading the project, and do not interview for the sake of it: a clear request goes straight to the mockup.

Make the interview easy to answer. Ask the few questions that matter together, not one at a time, and when you can, offer concrete options with your recommendation first (use the `AskUserQuestion` tool if you have it). Keep it short: one round is usually enough, a second only if the answers opened a new gap. For smaller doubts, pick a sensible default and say which one you picked.

## The mockup itself

Output is plain HTML, CSS and a little JavaScript, self-contained so it opens from a file with no build and no network. Variants live in one file behind a switcher by default; separate files work when they are too different to share anything. Choose what makes comparison easiest.

Make it feel real. Use plausible names, numbers and sentences from the user's domain, and mark invented data as an example if it could be mistaken for real. Show the states that matter (empty, loading, error, hover, the open menu), light and dark when the project has both, and a layout that holds from phone to desktop for web. The animations should be the ones you would ship, not decoration. Keep it a mockup, though: no real backend, no framework setup, no production code, and no changes to the project's real code.

Put the files where the user will find them: a `mockups/<name>/` folder inside the project when there is one, otherwise a subfolder of the current working directory. Open the result in the browser and look at it yourself at a desktop and a phone width before you hand it over, with whatever tool you have (a headless browser, a preview); if you cannot, say so. Fix what looks crowded, clipped or off.

## Hand-over

Tell the user, in a few lines: where the files are, what the variants are and which one you recommend, any default you chose for them, and what you could not cover or check. Then leave the next step open. The user may be happy with what is already there, so refine or extend only if they ask.
