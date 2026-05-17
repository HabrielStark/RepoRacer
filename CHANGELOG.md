# Changelog

This changelog records the local workspace state and published releases.

## 1.0.1 - 2026-05-17

- Prepared the next patch release after the published `1.0.0` tag by bumping package and CLI version metadata to `1.0.1`.
- Hardened the external release audit for Windows npm shims and split it into prepublish and postpublish checks so local release readiness does not falsely fail before npm publication.
- Slimmed the npm package by keeping large launch media in the repository and GitHub Pages site instead of duplicating WebM/GIF/PNG assets in the CLI tarball.
- Added a package-size release audit so future media additions cannot silently bloat the npm distribution.
- Refreshed safe dev-tool patch pins and made `vite@6.4.2` explicit for the VitePress 1.x and Vitest peer graph.

## 1.0.0 - 2026-05-12

- Added full-roadmap local RepoRacer implementation with hidden target tests, baseline checks, Docker sandbox command wrapping, public report/share artifacts, GitHub Action template generation, config schema export, advanced scoring, and stable CLI/API surfaces.
- Added OSS release infrastructure: CI matrix, release workflow, Pages demo workflow, Dependabot, issue templates, PR template, linting, formatting, coverage, commit hooks, docs site, API docs generation, demo assets, governance docs, DCO, trademark notice, third-party notices, and a generated ten-commit buggy todo demo.
- Added generated raster launch visuals for the README, documentation homepage, social preview, and architecture page.
- Hardened Docker sandbox temporary command files so generated script writes and cleanup use the same `.reporacer` path containment protections as reports and run artifacts.

## 0.1.0 - 2026-05-11

- Added RepoRacer TypeScript CLI.
- Added `init`, `doctor`, `tasks`, `run`, `report`, `open`, and `clean` commands.
- Added Git history mining, worktree-based agent runs, tests, diff collection, scoring, risk scanning, JSON output, and static HTML reports.
- Added built-in fake agents for local verification.
- Added documentation and integration tests.
