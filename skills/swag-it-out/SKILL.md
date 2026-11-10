---
name: swag-it-out
description: Propose a UI for a project or a feature with several variants to choose from, either as a standalone HTML mockup or as throwaway variants inside the running app. Use when the user asks for a mockup, a UI proposal, a screen sketch, or variants of a feature to try directly in the app.
---

# swag-it-out

The user wants to see an idea before it gets built for real. Your job is to turn a project or a feature into something they can open, look at, compare and react to. A proposal is a question put in visual form: "is this the direction?". Make it concrete enough that the answer is easy, and cheap enough to throw away.

It usually comes up in two situations. In a project that is already running, the user needs a UI proposal for one feature. For a new project, the user wants to see proposals for the complete flow of the app.

## Work with the user's skills

The user always asks for the same set of skills when they want a proposal. This skill exists so they do not have to repeat it. Load them with the Skill tool at the start, because each one covers something you should not improvise:

- **`design-taste-frontend`, `better-ui` and, for web projects, `web-design-engineer`** drive the UI and UX. They overlap, and which ones fit depends on the situation: a look created from scratch, a redesign, a feature that must sit inside an existing design system. Decide from what you see and use one or several; do not ask the user.
- **`emil-design-eng`** drives the animations and the small details that make an interface feel good. Motion belongs in the proposal, because how something moves is part of what the user is judging.

Variants are covered by [references/variants.md](references/variants.md). Read it before you plan them, together with [references/picker.md](references/picker.md) when you build the switcher.

These skills bring craft, not process. If one of them has its own questions or checkpoints, they stay as that skill defines them; this skill adds no approval step of its own.

Mobile apps have no dedicated skill yet. For those, lean on the skills above where they still apply, design for a phone-sized viewport and touch, and say plainly that no mobile-specific skill was used.

If one of these skills is not installed or cannot be loaded, do not stop: carry on with the others, do the missing part by your own judgement, and tell the user which one was missing.

## Choose where the proposal lives

There are two modes. Pick one yourself; the user's words override your pick ("a mockup" means Mockup, "do it in the app" means In-place).

- **Mockup.** Self-contained HTML that replicates the project's look, kept apart from the real code. The default for a new project, for whole-app directions, for an app that cannot be started locally, and for variants too far from the current code to reuse its components.
- **In-place.** The variants are written inside the real app, in the branch the user is already on, and seen running with the real components, tokens, layout and data. The default for a feature in an existing project that has its own components or design system and can be started locally, because there a standalone copy of the look is never quite the product. The code is throwaway: [references/in-place.md](references/in-place.md) says how to keep it small and easy to remove. Read it before you write any.

## Understand before drawing

Look at what the request gives you. If it is about an existing project, read enough of it to find its real shape: the stack, the design tokens or the CSS it already has, the components, the copy and the language it speaks, the data it would show. A proposal that ignores these looks nice and is useless, because the user cannot judge whether it fits. If it is a new project, the idea and the audience are all you have, so use them well.

## Decide, then show

The user judges the result on screen and often does not read the conversation. Do not stop to have a plan, the set of variants or a design approved before you build it. Make the calls yourself, build, and declare the assumptions you made where the user will see them: in the picker's info panel (see [references/picker.md](references/picker.md)) and in one line of the hand-over.

Ask only when a wrong guess would throw away the whole run: web or mobile for a new project, which screen is meant when the request could point to several, and the like. Then ask once, with the few questions that matter together, concrete options and your recommendation first (use the `AskUserQuestion` tool if you have it). Do not ask what you can find by reading the project. Everything else is a default you pick and declare.

## The proposal itself

Make it feel real. Use plausible names, numbers and sentences from the user's domain, and mark invented data as an example if it could be mistaken for real. Show the states that matter (empty, loading, error, hover, the open menu), light and dark when the project has both, and a layout that holds from phone to desktop for web. The animations should be the ones you would ship, not decoration.

In Mockup mode, output plain HTML, CSS and a little JavaScript, self-contained so it opens from a file with no build and no network. Variants live in one file behind the picker by default; separate files work when they are too different to share anything. No real backend, no framework setup, no production code, and no changes to the project's real code. Put the files in a `mockups/<name>/` folder inside the project when there is one, otherwise in a subfolder of the current working directory.

In In-place mode, follow [references/in-place.md](references/in-place.md).

Before you hand over, look at it yourself at a desktop and a phone width, with whatever tool you have (a headless browser, a preview, the running app); if you cannot, say so. Fix what looks crowded, clipped or off.

## Hand-over

Keep it to two or three lines, because the user will look at the screen, not at the chat: where to open it (the file path, or the app URL with `?variant=`), which variant you recommend, and what you could not cover or check. Trade-offs, rationale and assumptions live in the picker's info panel, not in the chat. In In-place mode, add the list of files you created and the existing files you touched.

Then leave the next step open. The user may be happy with what is already there, so refine or extend only if they ask.
