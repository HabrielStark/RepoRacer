# Release Process

RepoRacer follows SemVer after `1.0.0`.

## Release Checklist

1. Confirm `pnpm lint`, `pnpm format:check`, `pnpm check`, `pnpm test:coverage`, `pnpm build`, and `pnpm docker:sandbox:smoke` pass.
   `pnpm test:coverage` enforces 78% statement, 56% branch, 59% function, and 85% line coverage floors.
2. Run `pnpm sbom` and inspect `artifacts/reporacer.cdx.json`.
3. Run `pnpm notices` and inspect `THIRD_PARTY_NOTICES.md`.
4. Run `pnpm release:audit` and require a clean pass.
5. Confirm `npm pack --json --dry-run --ignore-scripts` contains only intended files.
6. Update `CHANGELOG.md`.
7. Tag `vX.Y.Z`, or run the manual release workflow with `version` set to exactly `X.Y.Z`.
8. Let `.github/workflows/release.yml` publish with npm provenance, push the GHCR Docker image, attach the npm tarball, and attach the CycloneDX SBOM.

`npm sbom` is not used in this pnpm project because npm's SBOM command validates the pnpm virtual store as if it were an npm install tree and reports false missing/invalid dependency errors. `pnpm sbom` uses `pnpm licenses list --json` and writes a CycloneDX 1.5 document without adding a third-party SBOM generator dependency.

## Version Policy

- Patch: bug fixes and documentation that do not change public behavior.
- Minor: compatible CLI/API additions.
- Major: breaking CLI, config, output schema, or exported API changes.

## Required Secrets

- `NPM_TOKEN`: npm automation token with publish access for the package.

## Required Repository Settings

- GitHub Pages must be enabled for the repository and configured to use GitHub Actions as the source. Without that owner-level setting, the Pages workflow still builds and uploads the artifact, but GitHub rejects deployment creation with a 404.
