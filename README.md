# bagz

My agent skills (Claude Code and compatible agents). Each skill is a folder in `skills/` with a `SKILL.md`.

| Skill | What it does | Use it when |
|---|---|---|
| [`bro-explain`](skills/bro-explain/SKILL.md) | Turns a topic or a decision to analyse into a self-contained, offline HTML guide in my house style: sidebar with search, an explanation that builds step by step in plain, flowing language, interactive diagrams, charts, light theme with optional dark mode. | "guide", "explainer", "explain X", "walk me through", "analyse", "should I…", "which is better", "HTML doc", "page to present" |
| [`swag-it-out`](skills/swag-it-out/SKILL.md) | Proposes a UI for a project or a feature with several variants to compare, either as a standalone HTML mockup or as throwaway variants inside the running app. Builds the variants itself, explains them in an info panel on the picker, and calls my usual design skills: `design-taste-frontend`, `better-ui`, `emil-design-eng`, and `web-design-engineer` for web projects. | "mockup", "mock up the UI", "propose a UI for…", "how could this screen look", "try variants in the app" |
| [`bless-this-pr`](skills/bless-this-pr/SKILL.md) | Approves a GitHub PR with a GIF. | "FDA", "approve this PR" |

## Install a skill

Clone the repo, then put the skill folder in your `.claude/skills` folder. There are two ways: copy it, or link it.

```bash
git clone https://github.com/saliougaye/bagz.git
mkdir -p ~/.claude/skills
```

**Copy.** A snapshot: the installed skill does not change until you copy it again.

```bash
cp -R bagz/skills/bro-explain ~/.claude/skills/
```

**Symlink.** The installed skill is the folder in the clone, so `git pull` updates it with no extra step.

```bash
ln -s "$(pwd)/bagz/skills/bro-explain" ~/.claude/skills/bro-explain
```

Do not move or delete the clone while the link is in use. Replace `bro-explain` with `swag-it-out` to install the other skill.

`~/.claude/skills/` makes the skill available in every project. To use it in one project only, use that project's `.claude/skills/` instead.

To update a copy, pull the repo and copy the folder again (replace the old one first). A symlink only needs `git pull`.

Then run `/bro-explain`, or just ask for a guide: the skill triggers on its own.

## Requirements

| Skill | Needs |
|---|---|
| `bro-explain` | Python 3 (build), Node 22+ and Google Chrome (checks only; set `CHROME=/path/to/chrome` if it is not in the default place) |
| `swag-it-out` | The design skills it calls (`design-taste-frontend`, `better-ui`, `emil-design-eng`, `web-design-engineer`) installed in the same environment; it keeps going without any that are missing |
| `bless-this-pr` | GitHub CLI (`gh`) logged in |

The guides themselves need only a browser: they work offline from `file://`.

## License

[MIT](LICENSE), except the fonts in `skills/bro-explain/assets/template/fonts/` (Atkinson Hyperlegible Next and Mono, Lexend), which are under the [SIL Open Font License 1.1](skills/bro-explain/assets/template/fonts/); each font's licence text sits next to it.
