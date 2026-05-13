# Scoring

RepoRacer scoring is a practical engineering signal, not a universal judge.

## Signals

- Tests: primary score from the configured test command.
- Hidden tests: primary score in `hidden-target-tests` mode when a target-commit test patch exists.
- Patch similarity: line-set overlap between the historical human patch and the agent patch.
- Changed-file overlap: whether the agent touched the same files as the human patch.
- Diff-size similarity: whether the agent patch is in the same rough size range as the human patch.
- Minimality: penalty for bloated diffs, unrelated files, and unnecessary size.
- Speed: bounded runtime signal inside the configured timeout.
- Risk flags: penalties or invalidation for unsafe benchmark behavior.

## Solved Criteria

A result counts as solved when:

- status is `completed`;
- final score is at least 60;
- no critical risk is present;
- configured tests passed, or no test command was configured;
- hidden tests passed when `hidden-target-tests` mode produced a hidden patch.

## Critical Risks

Critical risks prevent a result from counting as solved:

- deleting test files;
- weakening tests by skipping, loosening assertions, or removing failure paths;
- weakening CI;
- changing `.env`, key, certificate, token, or similar secret-bearing files;
- modifying `.reporacer/` generated data.

## Hidden Target Tests

Hidden target tests are mined from the target commit according to `hiddenTests.includePatterns`.

RepoRacer creates the agent worktree at the parent commit, runs the agent, collects the agent diff, then applies the hidden test patch and runs tests. This prevents the agent from seeing target test changes while still letting the benchmark evaluate against stricter historical tests.

## Caveats

Historical commits vary in quality. A short commit message can make a weak task. A commit that changed tests may produce stricter or less stable evaluation. Dependency drift can make old parent commits harder to run. Baseline checks help reject unstable parent commits before scoring agents.
