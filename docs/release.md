# Release Process

RepoRacer follows SemVer after `1.0.0`.

## Release Checklist

1. Confirm `pnpm lint`, `pnpm format:check`, `pnpm check`, `pnpm test:coverage`, `pnpm build`, and `pnpm docker:sandbox:smoke` pass.
   `pnpm test:coverage` enforces 78% statement, 56% branch, 59% function, and 85% line coverage floors.
2. Run `pnpm sbom` and inspect `artifacts/reporacer.cdx.json`.
3. Run `pnpm notices` and inspect `THIRD_PARTY_NOTICES.md`.
4. Run `pnpm release:audit` and require a clean pass.
5. Run `pnpm release:external-audit` on the owner release machine after npm auth, Pages, and official provider CLIs are configured.
6. Confirm `npm pack --json --dry-run --ignore-scripts` contains only intended files.
7. Update `CHANGELOG.md`.
8. Tag `vX.Y.Z`, or run the manual release workflow with `version` set to exactly `X.Y.Z`.
9. Let `.github/workflows/release.yml` publish with npm provenance, push the GHCR Docker image, attach the npm tarball, and attach the CycloneDX SBOM.

`npm sbom` is not used in this pnpm project because npm's SBOM command validates the pnpm virtual store as if it were an npm install tree and reports false missing/invalid dependency errors. `pnpm sbom` uses `pnpm licenses list --json` and writes a CycloneDX 1.5 document without adding a third-party SBOM generator dependency.

## Version Policy

- Patch: bug fixes and documentation that do not change public behavior.
- Minor: compatible CLI/API additions.
- Major: breaking CLI, config, output schema, or exported API changes.

## Required Secrets

- `NPM_TOKEN`: npm automation token with publish access for the package.

## Required Repository Settings

- GitHub Pages must be enabled for the repository and configured to use GitHub Actions as the source. Until that owner-level setting is enabled, the Pages workflow builds and uploads the artifact, preflights the Pages API, and skips only the deployment step.

## Owner Finalization

These steps require owner-controlled credentials and cannot be completed by a clean repository patch:

1. Create an npm automation token for the package owner account and save it as the repository secret `NPM_TOKEN`.
2. Enable GitHub Pages in repository settings with source set to GitHub Actions.
3. Run the release workflow for `1.0.0`, or push an immutable `v1.0.0` tag after the secret is configured.
4. Confirm `npm view reporacer version` returns `1.0.0`.
5. Confirm `https://habrielstark.github.io/RepoRacer/` serves the demo site.
6. Run `pnpm release:external-audit` on a machine with npm auth, GitHub repository access, and all five provider CLIs installed.

## External Release Audit

`pnpm release:external-audit` intentionally fails until all owner-controlled release surfaces are real: npm authentication, the published npm version, GitHub Pages availability, remote tag alignment, and strict provider CLI installation.
