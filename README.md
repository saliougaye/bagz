# bagz

My agent skills (Claude Code and compatible agents). Each skill is a folder in `skills/` with a `SKILL.md`.

| Skill | What it does | Use it when |
|---|---|---|
| [`bro-explain`](skills/bro-explain/SKILL.md) | Turns a topic or a decision to analyse into a self-contained, offline HTML guide in my house style: sidebar with search, plain-language sections, interactive diagrams, charts, light/dark theme. | "guide", "explainer", "explain X", "walk me through", "analyse", "should I…", "which is better", "HTML doc", "page to present", "fammi una guida", "spiegami", "analizza" |

## Install a skill

Clone the repo and copy the skill folder into your `.claude/skills` folder:

```bash
git clone https://github.com/saliougaye/bagz.git
mkdir -p ~/.claude/skills
cp -R bagz/skills/bro-explain ~/.claude/skills/
```

`~/.claude/skills/` makes the skill available in every project. To use it in one project only, copy it into that project's `.claude/skills/` instead.

To update, pull the repo and copy the folder again.

Then run `/bro-explain`, or just ask for a guide: the skill triggers on its own.

## Requirements

| Skill | Needs |
|---|---|
| `bro-explain` | Python 3 (build), Node 22+ and Google Chrome (checks only; set `CHROME=/path/to/chrome` if it is not in the default place) |

The guides themselves need only a browser: they work offline from `file://`.

## License

[MIT](LICENSE), except the fonts in `skills/bro-explain/assets/template/fonts/` (Atkinson Hyperlegible Next and Mono, Lexend), which are under the [SIL Open Font License 1.1](skills/bro-explain/assets/template/fonts/); each font's licence text sits next to it.
