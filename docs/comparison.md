# Comparison

| Tool              | Scope                         | Dataset                    | Local-first | Agent-agnostic |
| ----------------- | ----------------------------- | -------------------------- | ----------- | -------------- |
| RepoRacer         | Your repository history       | Private historical commits | Yes         | Yes            |
| SWE-bench         | Public GitHub issues          | Curated public benchmark   | No          | Yes            |
| Aider leaderboard | Aider-focused coding evals    | Public eval suite          | No          | Mostly no      |
| Continue evals    | Assistant workflow evaluation | Project-specific setup     | Depends     | Depends        |

RepoRacer is not a replacement for public benchmarks. It answers a narrower operational question: which agent is more useful on this codebase, with this test command, under this risk policy?
