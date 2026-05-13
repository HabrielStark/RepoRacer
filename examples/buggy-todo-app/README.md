# Buggy Todo App Demo

This demo materializes a small Git repository with ten historical bug-fix commits for RepoRacer.

```bash
cd examples/buggy-todo-app
node scripts/create-history.cjs
cd generated
npx reporacer init
npx reporacer run --agents fake-success,fake-noop --tasks 10
```

The generated repository is intentionally local and disposable. It gives maintainers a reproducible demo without committing a nested `.git` directory.
