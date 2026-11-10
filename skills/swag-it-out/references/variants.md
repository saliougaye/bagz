# Variants

How to build and present several versions of a UI so the user can compare them and choose. Adapted from the user's `variant` skill for the two modes of this skill: a self-contained HTML mockup, or throwaway variants inside the running app.

This is about producing candidates and handing the decision back. You can recommend one, but the user chooses.

## Different answers, not different tints

Variants that differ only in accent colour teach nothing: the user flips between them, sees no real choice, and the round is wasted. Each variant is a different answer to the same brief, on an axis that matters:

| Axis | What varies |
| --- | --- |
| Structure | Grouping, order, column count, navigation model, what collapses |
| Density | Spacing scale, hit areas, how much fits |
| Emphasis | Where filled colour goes, what recedes |
| Type | Scale steps, weight contrast, measure |
| Voice | Labels, tone, how much copy |

Pick **one primary axis** and give each variant a different position on it. Secondary choices follow from it rather than varying on their own: a dense variant may need a smaller type step, and that is coherence, not a second axis. Varying everything at once gives results nobody can attribute.

For a new project, a variant can be a whole direction (a navigation model, a personality) rather than one axis. That is fine as long as each direction is coherent and you can say in one phrase what separates it from the others.

## The floor every variant clears

A variant that wins on looks and breaks the basics is not a candidate. Every control has an accessible name, the keyboard reaches everything a pointer does, focus is visible, nothing clips at 320px, and no meaning rides on colour alone. The floor is the same for all variants and never trades against an axis. If a direction can only work by breaking it, drop the direction.

## Scope: two usual cases

**A feature in an existing project.** The brief is one piece of UI: a screen, a panel, a flow inside the product. Restate it in one sentence (what it is, where it renders, what it must do). The variants are alternatives for that piece, shown inside the product's own look: its tokens, its chrome, its neighbours, its density and voice.

**A new project.** The brief is the shape of the whole app. The variants are complete directions, and each one shows the same complete flow, from the first screen the user meets to the main action and what follows, with the screens linked so the user can walk through it. Cover the screens that carry the flow, not every screen of the app. If the user picks a direction, extending it to the remaining screens is a later round.

If the brief is vague about which case applies, read the project: a feature request inside an existing app is the first case. Ask only if you still cannot tell.

## Naming and number

Default to three variants. Go to five only when asked or when the space is genuinely wide: past five nobody compares, they scroll. Settle the set before you build it, a name and an axis position each. This is your own plan, not something to show the user for approval. Names say what the direction is (`Quiet`, `Editorial`, `Dense`), never `Option A`. No two variants may share a position.

## Building them

Each variant is real enough to judge: product-shaped copy, plausible names, and the number of items the screen would really carry. Three rows and lorem ipsum make every structure look good.

How they are built depends on the mode chosen in SKILL.md: self-contained HTML that replicates the project's look in Mockup mode, throwaway files inside the app in In-place mode ([in-place.md](in-place.md)). Either way, switch between variants with a URL search param (`?variant=quiet`), so each variant is a link, and a floating picker sets it. [picker.md](picker.md) holds the spec; build it as written and leave it alone.

Show one variant at a time, full size. Thumbnails distort spacing and scale, and spacing is often what is being chosen.

## Presenting them

Flip through every variant yourself first: each one renders, each interaction responds, the console is clean. Then hand the decision over inside the proposal itself, through the picker's info panel ([picker.md](picker.md)), because the user looks at the screen rather than the chat. For each variant the panel gives its trade-offs:

| Variant | Axis position | Right when | Costs |
| --- | --- | --- | --- |
| Quiet | Lowest visual weight | The page is used daily | Least memorable |
| Editorial | Largest type, most space | The moment deserves weight | Eats vertical space |

Keep the favourite out of the trade-offs. Mark it separately, with one sentence on why, judging from how often the screen is seen and from the product's personality, not from which one you enjoyed building. The panel also lists the assumptions you made, what you did not cover, and which width you judged at: the answer can change between 375px and 1440px. In the chat, the recommendation is one line.

## After the user chooses

Stop there. The proposal is the deliverable, and the user may be happy with what is already on the screen. Refine it only if they ask: another round takes new positions around the direction they leaned towards, keeping the picker; polishing the chosen one is a separate request. Do not build the real implementation, and do not delete the other variants, unless they ask. In In-place mode, never promote the throwaway variant to real code as it is: the real feature is rewritten following the project's rules and style.
