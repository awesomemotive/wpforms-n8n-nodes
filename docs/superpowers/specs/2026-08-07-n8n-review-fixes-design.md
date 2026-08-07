# n8n Review Fixes + v0.1.6 Release — Design

**Date:** 2026-08-07
**Status:** Approved

## Background

The n8n team rejected v0.1.5 of `n8n-nodes-wpforms` with three findings. v0.1.4 remains
live. Publishing a fixed version to npm triggers an automatic re-review — no manual
resubmission needed.

Findings:

1. **Provenance check failed** — the package was not published with npm provenance.
2. **[LOW] Missing `homepage`** — `package.json` has `"homepage": ""`.
3. **[LOW] Unsupported codex categories** — `Wpforms.node.json` uses
   `["Trigger", "Forms"]`; neither is in n8n's allowed category list.

Root cause of (1): `.github/workflows/npm-publish.yml` publishes with
`npm publish --access public` + `NPM_TOKEN`, no `--provenance` flag, and no
`id-token: write` permission. Registry metadata confirms v0.1.5 has no attestations and
was published via token by the `wpforms` user. The repo is public, so provenance is
viable.

## Changes

### 1. `.github/workflows/npm-publish.yml`

Make the publish job provenance-capable in both token and OIDC modes:

- Add job-level permissions:
  ```yaml
  permissions:
    id-token: write   # OIDC token for provenance / trusted publishing
    contents: write   # needed by the GitHub Release step once permissions are explicit
  ```
- Add a step after Node setup: `npm install -g npm@latest` (Node 20 bundles npm 10.x,
  which predates trusted-publishing support; OIDC needs npm ≥ 11.5.1).
- Change the publish command to `npm publish --provenance --access public`, keeping the
  `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` env as fallback.

Behavior: if a trusted publisher is configured for the package on npmjs.com, npm uses
OIDC and provenance is automatic; if not, the token path still produces valid provenance
via `--provenance` + the OIDC build attestation. Either way the n8n provenance check
passes.

### 2. `package.json`

- `"homepage": "https://wpforms.com/docs/n8n-addon/"` (the node's documentation page,
  without UTM parameters).
- `"version": "0.1.6"`.

### 3. `nodes/WPForms/Wpforms.node.json`

- `"categories": ["Communication"]` — matches n8n's categorization of comparable form
  tools (Typeform, JotForm, SurveyMonkey, Wufoo).

### 4. `CHANGELOG.md`

Add:

```markdown
## [0.1.6] - 2026-08-07

### Fixed
- Publish to npm with provenance to satisfy n8n community-node security checks.
- Add missing `homepage` field to `package.json`.
- Replace unsupported codex categories with `Communication`.
```

Update the compare links (`[Unreleased]`, `[0.1.6]`) accordingly.

## Release process

1. Apply the changes above.
2. Verify locally: `npm run lint` and `npm run build`; run
   `npx @n8n/node-cli@latest lint` if it works against this project layout (best-effort —
   the project predates the n8n node CLI scaffold).
3. Commit to `master`.
4. **Pause for explicit user go-ahead**, then tag `v0.1.6` and push the tag — this
   triggers the npm publish. n8n re-reviews automatically.
5. Post-release verification: `https://registry.npmjs.org/-/npm/v1/attestations/n8n-nodes-wpforms@0.1.6`
   returns HTTP 200, and `npx @n8n/scan-community-package@beta n8n-nodes-wpforms` passes.

## Error handling

- If the tag-push publish fails on auth (e.g. expired `NPM_TOKEN` and no trusted
  publisher configured), the fix is on npmjs.com: configure a trusted publisher for
  `n8n-nodes-wpforms` (GitHub Actions, repo `awesomemotive/wpforms-n8n-nodes`, workflow
  `npm-publish.yml`) or mint a fresh granular token. The workflow supports both without
  further edits. Re-run by deleting and re-pushing the tag.
- If the version-consistency step fails, `package.json` and the tag disagree — fix
  `package.json` and re-tag.

## Out of scope

- No changes to node runtime code.
- No Node 24 upgrade in the workflow.
- No removal of the `NPM_TOKEN` secret (optional cleanup after trusted publishing is
  confirmed working).
