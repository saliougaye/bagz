# In-place

Variants built inside the running app, so the user judges them with the real components, layout and data around them. The code is throwaway: once the user picks a direction, the real feature gets written properly, following the project's rules and style, as a separate step. In-place code is therefore optimised for being seen and removed, not for being merged.

## Where

Work in the branch and working tree the user is on. Do not create a branch or a worktree, and do not commit, unless the user asks.

The tree may already hold the user's own uncommitted work. Leave every file you did not create alone, apart from the switch point below, and never revert, reformat or stage their changes.

## Touch as little as possible

- **New code goes in new files.** One file per variant, next to the feature, named so it reads as throwaway: `FeatureName.swag-quiet.tsx`, or a `swag/` folder beside the feature. Follow the project's file conventions only as far as it takes to compile and run (extension, export style, imports).
- **Existing files get one switch point.** Where the feature renders, read the `variant` search param and render the matching variant; with no param, render what is there today. Mark it with a comment containing `SWAG` so it can be found and reverted. If a second existing file must change (a route, a provider, a fixture), keep the change to the minimum and mark it the same way.
- **Reuse, do not improve.** Use the app's components, tokens, hooks and data as they are. Do not refactor, rename, fix or tidy anything existing, even when it is tempting: that belongs to the real implementation.
- **Stay in the UI.** No new dependencies, and no changes to backend, API, database schema, build or config. When a variant needs data the app does not have yet, stub it inside the variant's own file and mark it as example data.
- **Shortcuts are fine inside the swag files.** Inline styles, hard-coded values, a loose type: whatever the real implementation would do differently is acceptable, as long as it stays in your files and the dev build still runs.

## The picker

Build it as [picker.md](picker.md) specifies, in its own swag file, mounted once next to the switch point or at the app root. Render it only in development, using the project's own dev flag. The keyboard shortcuts must ignore keys typed into inputs, so the app stays usable.

If the project has Storybook or a similar workbench and the screen is hard to reach in the app (deep in a flow, behind auth you cannot stub), one story per variant is an acceptable alternative. Say which one you used.

## Seeing it

Start the app the way the project starts it (use the `run` skill if you have it, or the project's own scripts), go to the screen and flip through every variant at 375px and 1440px. If the app cannot be started, switch to Mockup mode and say why.

## Removing it

The hand-over lists the files you created and the switch points you added. Removing the proposal means deleting the swag files and reverting what the `SWAG` markers point to; `grep -rn SWAG` finds them all. Do not remove anything yourself until the user asks: the variants stay until they have chosen.
