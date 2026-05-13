# Troubleshooting

## Dirty Worktree

RepoRacer fails by default if source files outside `.reporacer/` are dirty.

Fix by committing or stashing, or run with `--allow-dirty` for a deliberate local experiment.

## No Tasks Found

Increase `commitSelection.lookback`, raise `maxChangedFiles`, or lower `minChangedFiles`.

Repositories with only generated, binary, or huge commits may not produce good benchmark tasks.

## Baseline Fails

The historical parent commit does not pass the configured test command in the current environment. Keep `baselineCheck` enabled for trustworthy runs, then adjust task filters or dependency setup.

## Agent Command Missing

Run `reporacer doctor`. It checks enabled command templates and reports missing executables.

## Docker Issues

Docker mode needs a running Docker daemon. If Docker is unavailable, use `sandbox.mode: "none"` or fix Docker locally.

## Shallow Clones

`reporacer doctor` reports whether the current checkout is shallow. A shallow checkout can hide useful parent commits and produce too few tasks.

If recent history is incomplete, fetch more commits before mining tasks:

```bash
git fetch --unshallow
```

or:

```bash
git fetch --depth=200
```

## Submodules

`reporacer doctor` reports configured submodule paths from `.gitmodules`. Initialize them before benchmarking if tests or agent context depend on submodule contents:

```bash
git submodule update --init --recursive
```

## Git LFS

`reporacer doctor` reports Git LFS-tracked patterns from `.gitattributes` and warns when `git-lfs` is not installed. Install Git LFS before running tasks that need large-file pointers hydrated:

```bash
git lfs install
git lfs pull
```
