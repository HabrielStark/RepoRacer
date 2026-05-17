# Release Process

RepoRacer follows SemVer after `1.0.0`.

## Release Checklist

1. Confirm `pnpm lint`, `pnpm format:check`, `pnpm check`, `pnpm test:coverage`, `pnpm build`, and `pnpm docker:sandbox:smoke` pass.
   `pnpm test:coverage` enforces 78% statement, 56% branch, 59% function, and 85% line coverage floors.
2. Run `pnpm sbom` and inspect `artifacts/reporacer.cdx.json`.
3. Run `pnpm notices` and inspect `THIRD_PARTY_NOTICES.md`.
4. Run `pnpm release:audit` and require a clean pass.
5. Run `pnpm release:external-audit` before tagging. It must show that the package version is newer than npm, GitHub Pages is live, the release tag is still unused, and official provider CLIs are version-detectable.
6. Confirm `npm pack --json --dry-run --ignore-scripts` contains only intended files.
7. Update `CHANGELOG.md`.
8. Tag `vX.Y.Z`, or run the manual release workflow with `version` set to exactly `X.Y.Z`.
9. Let `.github/workflows/release.yml` publish with npm provenance, push the GHCR Docker image, attach the npm tarball, and attach the CycloneDX SBOM.
10. Run `pnpm release:external-audit --postpublish` after publication. It must confirm npm auth, the published npm version, Pages, tag-to-main alignment, and strict provider CLI availability.

`npm sbom` is not used in this pnpm project because npm's SBOM command validates the pnpm virtual store as if it were an npm install tree and reports false missing/invalid dependency errors. `pnpm sbom` uses `pnpm licenses list --json` and writes a CycloneDX 1.5 document without adding a third-party SBOM generator dependency.

## Version Policy

- Patch: bug fixes and documentation that do not change public behavior.
- Minor: compatible CLI/API additions.
- Major: breaking CLI, config, output schema, or exported API changes.

## Required Secrets

- `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or `REPORACER`: npm automation or granular access token with publish access for the package. `NPM_TOKEN` is the conventional name; `REPORACER` is accepted for the current repository setup. A GitHub token will not work here.

## Required Repository Settings

- GitHub Pages must be enabled for the repository and configured to use GitHub Actions as the source.

## Owner Finalization

These steps require owner-controlled credentials and cannot be completed by a clean repository patch:

1. Create an npm automation or granular access token for the package owner account and save it as the repository secret `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or `REPORACER`.
2. Enable GitHub Pages in repository settings with source set to GitHub Actions.
3. Run the release workflow for the current `package.json` version, or push an immutable matching `vX.Y.Z` tag after the secret is configured.
4. Confirm `npm view reporacer version` returns the current `package.json` version.
5. Confirm `https://habrielstark.github.io/RepoRacer/` serves the demo site.
6. Run `pnpm release:external-audit --postpublish` on a machine with npm auth and all five provider CLIs installed.

## External Release Audit

`pnpm release:external-audit` runs prepublish checks: npm version availability, GitHub Pages availability, unused release tag verification, and strict provider CLI installation. Local npm auth is deferred to the release workflow preflight, which blocks before `npm publish` if the token is missing.

`pnpm release:external-audit --postpublish` intentionally fails until all owner-controlled release surfaces are real: npm authentication through `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `REPORACER`, or a local npm login, the published npm version, GitHub Pages availability, remote tag alignment, and strict provider CLI installation.
