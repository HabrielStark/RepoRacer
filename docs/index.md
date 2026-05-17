---
layout: page
title: RepoRacer
description: Benchmark AI coding agents on real tasks mined from your own Git history.
sidebar: false
aside: false
---

<script setup>
import { withBase } from "vitepress";
</script>

<section class="rr-hero">
  <div class="rr-hero-bg">
    <img :src="withBase('/reporacer-hero.png')" alt="" />
  </div>
  <div class="rr-hero-inner">
    <img class="rr-hero-logo" :src="withBase('/logo.svg')" alt="RepoRacer logo" />
    <p class="rr-kicker">Local-first coding-agent benchmark</p>
    <h1>RepoRacer turns your git history into the race track.</h1>
    <p class="rr-lede">Mine real bug-fix commits, run coding agents in isolated worktrees, score hidden target tests, and publish a static report people can inspect.</p>
    <div class="rr-actions">
      <a href="guide">Start benchmarking</a>
      <a href="api/">Use the API</a>
    </div>
    <div class="rr-stats" aria-label="RepoRacer benchmark signals">
      <span><strong>10</strong> demo fix commits</span>
      <span><strong>5</strong> hidden-test tasks</span>
      <span><strong>0</strong> hosted services</span>
    </div>
  </div>
</section>

<section class="rr-section rr-proof">
  <div>
    <p class="rr-kicker">Proof first</p>
    <h2>Watch the real terminal run.</h2>
    <p>This recording keeps the boring parts in view: clone, generated bug-fix history, `npm test`, `npx --yes reporacer@latest`, `doctor`, task mining, live progress, final scores, and share artifacts.</p>
  </div>
  <video controls muted playsinline :poster="withBase('/reporacer-demo-poster.png')">
    <source :src="withBase('/reporacer-demo.webm')" type="video/webm" />
    <a :href="withBase('/reporacer-demo.gif')">Watch the RepoRacer terminal GIF.</a>
  </video>
</section>

<section class="rr-section rr-race">
  <div>
    <p class="rr-kicker">Then make it legible</p>
    <h2>A visual race replay for quick scanning.</h2>
    <p>The second video is not a substitute for the terminal proof. It is the same benchmark story turned into a fast scoreboard for people deciding whether RepoRacer is worth trying.</p>
  </div>
  <video controls muted playsinline :poster="withBase('/reporacer-race-demo-poster.png')">
    <source :src="withBase('/reporacer-race-demo.webm')" type="video/webm" />
    <a :href="withBase('/reporacer-race-demo.gif')">Watch the RepoRacer race GIF.</a>
  </video>
</section>

<section class="rr-section rr-grid">
  <a class="rr-link-tile" href="architecture">
    <span>Architecture</span>
    <strong>Worktrees, prompts, tests, scoring, reports.</strong>
  </a>
  <a class="rr-link-tile" href="api/">
    <span>API</span>
    <strong>Typed ESM entry points without a fragile 404 route.</strong>
  </a>
  <a class="rr-link-tile" href="agent-compatibility">
    <span>Agents</span>
    <strong>Codex, Claude, Gemini, Aider, OpenCode, and custom presets.</strong>
  </a>
</section>

<section class="rr-section">
  <a :href="withBase('/architecture-pipeline.png')" aria-label="Open RepoRacer architecture pipeline visualization">
    <img class="rr-wide-image" :src="withBase('/architecture-pipeline.png')" alt="RepoRacer architecture pipeline visualization" />
  </a>
</section>

<style>
.VPDoc .container {
  max-width: none;
}

.VPDoc .content {
  max-width: none;
  padding: 0;
}

.VPDoc .content-container {
  max-width: none;
}

.rr-hero {
  position: relative;
  min-height: 680px;
  display: flex;
  align-items: center;
  overflow: hidden;
  margin: -64px 0 40px;
  padding: 86px 24px 64px;
  background: #05070c;
}

.rr-hero-bg {
  position: absolute;
  inset: 0;
}

.rr-hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(5, 7, 12, 0.96) 0%, rgba(5, 7, 12, 0.82) 42%, rgba(5, 7, 12, 0.34) 100%);
}

.rr-hero-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rr-hero-inner {
  position: relative;
  width: min(1180px, 100%);
  margin: 0 auto;
}

.rr-hero-logo {
  width: 86px;
  height: 86px;
  filter: drop-shadow(0 20px 42px rgba(56, 216, 232, 0.24));
}

.rr-kicker {
  margin: 18px 0 0;
  color: #62e6a9;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

.rr-hero h1 {
  max-width: 760px;
  margin: 18px 0;
  color: #f8fbff;
  font-size: 64px;
  line-height: 1.03;
  font-weight: 950;
}

.rr-lede {
  max-width: 650px;
  color: #d6e4f7;
  font-size: 21px;
  line-height: 1.55;
}

.rr-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 30px;
}

.rr-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #edf6ff;
  background: rgba(15, 23, 42, 0.72);
  font-weight: 800;
  text-decoration: none;
}

.rr-actions a:first-child {
  color: #021014;
  background: linear-gradient(135deg, #38d8e8, #62e6a9);
}

.rr-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 44px;
}

.rr-stats span {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.58);
  color: #cbd5e1;
}

.rr-stats strong {
  color: #ffffff;
}

.rr-section {
  width: min(1180px, calc(100vw - 48px));
  margin: 0 auto 54px;
}

.rr-section h2 {
  margin: 10px 0 10px;
  color: #0f172a;
  font-size: 34px;
  line-height: 1.15;
}

.dark .rr-section h2 {
  color: #f8fbff;
}

.rr-section p {
  max-width: 850px;
  color: #475569;
  font-size: 17px;
  line-height: 1.65;
}

.dark .rr-section p {
  color: #b8c6dd;
}

.rr-section video,
.rr-wide-image {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(125, 211, 252, 0.25);
  box-shadow: 0 22px 70px rgba(2, 6, 23, 0.28);
}

.rr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.rr-link-tile {
  min-height: 152px;
  padding: 22px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.05);
  text-decoration: none;
}

.dark .rr-link-tile {
  background: rgba(15, 23, 42, 0.66);
}

.rr-link-tile span {
  color: #38d8e8;
  font-weight: 900;
}

.rr-link-tile strong {
  display: block;
  margin-top: 14px;
  color: var(--vp-c-text-1);
  font-size: 19px;
  line-height: 1.35;
}

@media (max-width: 760px) {
  .rr-hero {
    min-height: 620px;
    margin: -64px 0 40px;
    padding: 72px 20px 48px;
  }

  .rr-hero h1 {
    max-width: 350px;
    font-size: 39px;
  }

  .rr-lede {
    max-width: 350px;
    font-size: 19px;
  }

  .rr-grid {
    grid-template-columns: 1fr;
  }
}
</style>
