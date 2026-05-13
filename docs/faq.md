# FAQ

## Does RepoRacer upload my code?

No. RepoRacer itself is local-first and does not upload code, prompts, logs, patches, or reports.

Configured third-party agent CLIs may send context to their providers. Review those tools before running them on private code.

## Is a high score proof that an agent is best?

No. It is evidence from your repository history. Use multiple tasks, hidden target tests, and risk flags to compare agents.

## Why mine Git history instead of issues?

Historical commits provide an available human patch and a reproducible base commit. That makes scoring possible without building a hosted benchmark dataset.

## Can I share reports?

Use `reporacer run --public-report` or `reporacer share`, then review artifacts manually before publishing.
