---
layout: home
hero:
  name: RepoRacer
  text: Your git history is the benchmark.
  tagline: Benchmark AI coding agents on real tasks mined from your own repository.
  image:
    src: https://habrielstark.github.io/RepoRacer/reporacer-hero.png
    alt: RepoRacer agent benchmark visualization
  actions:
    - theme: brand
      text: Start
      link: /guide
    - theme: alt
      text: Architecture
      link: /architecture
features:
  - title: Local-first benchmark
    details: No backend, telemetry, hosted storage, or provider lock-in.
  - title: Real repository tasks
    details: Historical commits become isolated worktree challenges.
  - title: Risk-aware scoring
    details: Tests, hidden tests, patch similarity, diff minimality, speed, and safety flags are scored together.
---

<a href="https://habrielstark.github.io/RepoRacer/reporacer-hero.png" aria-label="Open RepoRacer benchmark visualization"><img src="https://habrielstark.github.io/RepoRacer/reporacer-hero.png" alt="RepoRacer agent benchmark race visualization" style="width:100%;border-radius:14px;border:1px solid rgba(125, 211, 252, 0.25);box-shadow:0 22px 70px rgba(2, 6, 23, 0.28);" /></a>

## Watch It Run

This is an end-to-end terminal recording: clone RepoRacer, generate the real `examples/buggy-todo-app` repository with ten historical bug-fix commits, install with `npx`, preflight with `doctor`, mine five hidden-target-test tasks, run the benchmark, and write the shareable public report.

<video controls muted playsinline poster="https://habrielstark.github.io/RepoRacer/reporacer-demo-poster.png" style="width:100%;border-radius:14px;border:1px solid rgba(125, 211, 252, 0.25);box-shadow:0 20px 60px rgba(2, 6, 23, 0.24);">
  <source src="https://habrielstark.github.io/RepoRacer/reporacer-demo.webm" type="video/webm" />
  <a href="https://habrielstark.github.io/RepoRacer/reporacer-demo.gif">Watch the RepoRacer demo GIF.</a>
</video>

## See The Pipeline

<a href="https://habrielstark.github.io/RepoRacer/architecture-pipeline.png" aria-label="Open RepoRacer architecture pipeline visualization"><img src="https://habrielstark.github.io/RepoRacer/architecture-pipeline.png" alt="RepoRacer architecture pipeline visualization" style="width:100%;border-radius:14px;border:1px solid rgba(125, 211, 252, 0.25);box-shadow:0 18px 54px rgba(2, 6, 23, 0.22);" /></a>

![Terminal demo](../assets/terminal-demo.png)

![Report demo](../assets/report-demo.png)
