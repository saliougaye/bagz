---
name: bless-this-pr
description: Approve a PR with a GIF ("FDA").
---

# bless-this-pr

Approve the PR with this GIF as the only review comment. No review, no checks.

Use the PR the user names, otherwise the one of the current branch. Write the alt text in the PR's language:

```bash
gh pr review <pr> --approve --body "![<alt text>](https://media.tenor.com/lztbLMEBDs4AAAAC/sonic-boom-knuckles.gif)"
```

If GitHub refuses, report the error and stop. Reply with the PR link.
