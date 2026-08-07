# n8n Review Fixes + v0.1.6 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three n8n community-node review findings (missing npm provenance, empty `homepage`, unsupported codex categories) and release v0.1.6 to npm to trigger n8n's automatic re-review.

**Architecture:** Config-only changes — no node runtime code is touched. The publish workflow becomes provenance-capable in both token and OIDC trusted-publishing modes; `package.json` and the codex file get metadata fixes; the changelog documents the release. Publishing happens by pushing the `v0.1.6` git tag, which triggers `.github/workflows/npm-publish.yml`.

**Tech Stack:** GitHub Actions, npm (≥ 11.5.1 for OIDC), n8n community-node conventions (codex JSON), Keep a Changelog.

## Global Constraints

- Version being released: `0.1.6` (spec: package.json version bump).
- `homepage` must be exactly `https://wpforms.com/docs/n8n-addon/` — no UTM parameters (spec §2).
- Codex categories must be exactly `["Communication"]` (spec §3).
- Publish command must be `npm publish --provenance --access public` with `NODE_AUTH_TOKEN` kept as fallback (spec §1).
- Job permissions must be `id-token: write` and `contents: write` (spec §1).
- Changelog date: `2026-08-07` (spec §4).
- Do NOT push the `v0.1.6` tag without explicit user go-ahead (spec, Release process step 4).
- Work happens directly on `master` (repo convention: release commits land on master; the spec's design commit is already there).
- No changes to files under `nodes/` other than `Wpforms.node.json`. No Node 24 upgrade. No NPM_TOKEN removal.

---

### Task 1: Make the publish workflow provenance-capable

**Files:**
- Modify: `.github/workflows/npm-publish.yml`

**Interfaces:**
- Consumes: existing tag-triggered workflow (`on: push: tags: v*.*.*`), `secrets.NPM_TOKEN`.
- Produces: a publish job that later tasks rely on when the `v0.1.6` tag is pushed (Task 5). No code-level interfaces.

- [ ] **Step 1: Add job permissions**

In `.github/workflows/npm-publish.yml`, the job currently reads:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
```

Change it to:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # Mint OIDC token for npm provenance / trusted publishing.
      contents: write  # Required by the GitHub Release step once permissions are explicit.
```

- [ ] **Step 2: Add an npm upgrade step after Node setup**

Immediately after the `Setup Node.js` step (which sets `node-version: '20'` and `registry-url`), insert:

```yaml
      # Node 20 bundles npm 10.x; OIDC trusted publishing needs npm >= 11.5.1.
      - name: Update npm
        run: npm install -g npm@latest
```

- [ ] **Step 3: Add --provenance to the publish command**

Change the publish step from:

```yaml
      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

to:

```yaml
      - name: Publish to npm
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Keep the `NODE_AUTH_TOKEN` env — it is the fallback when no trusted publisher is configured on npmjs.com.

- [ ] **Step 4: Validate the YAML parses**

Run:

```bash
node -e "const fs=require('fs'); const y=fs.readFileSync('.github/workflows/npm-publish.yml','utf8'); if(!/id-token: write/.test(y)||!/--provenance/.test(y)||!/npm install -g npm@latest/.test(y)) {console.error('missing expected content'); process.exit(1);} console.log('content OK')" && npx --yes yaml-lint .github/workflows/npm-publish.yml
```

Expected: `content OK` followed by yaml-lint reporting the file is valid. (If `yaml-lint` cannot be fetched offline, `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/npm-publish.yml')); print('yaml OK')"` is an equivalent check.)

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/npm-publish.yml
git commit -m "Publish to npm with provenance (OIDC-ready with token fallback)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Fix package.json homepage and bump version

**Files:**
- Modify: `package.json:3` (version) and `package.json:13` (homepage)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `version` `0.1.6` — Task 4's changelog entry and Task 5's tag name must match it exactly (the workflow's "Verify version consistency" step fails the publish otherwise).

- [ ] **Step 1: Set homepage**

In `package.json`, change:

```json
  "homepage": "",
```

to:

```json
  "homepage": "https://wpforms.com/docs/n8n-addon/",
```

- [ ] **Step 2: Bump version**

In `package.json`, change:

```json
  "version": "0.1.5",
```

to:

```json
  "version": "0.1.6",
```

- [ ] **Step 3: Validate JSON and values**

Run:

```bash
node -e "const p=require('./package.json'); if(p.version!=='0.1.6') throw new Error('version: '+p.version); if(p.homepage!=='https://wpforms.com/docs/n8n-addon/') throw new Error('homepage: '+p.homepage); console.log('package.json OK')"
```

Expected: `package.json OK`

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "Add homepage field and bump version to 0.1.6

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Replace unsupported codex categories

**Files:**
- Modify: `nodes/WPForms/Wpforms.node.json:5`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: codex file consumed by n8n's reviewer/linter; no in-repo consumers.

- [ ] **Step 1: Replace the categories array**

In `nodes/WPForms/Wpforms.node.json`, change:

```json
	"categories": ["Trigger", "Forms"],
```

to:

```json
	"categories": ["Communication"],
```

(The file uses tab indentation — keep it.)

- [ ] **Step 2: Validate JSON and value**

Run:

```bash
node -e "const c=require('./nodes/WPForms/Wpforms.node.json'); if(JSON.stringify(c.categories)!==JSON.stringify(['Communication'])) throw new Error('categories: '+JSON.stringify(c.categories)); console.log('codex OK')"
```

Expected: `codex OK`

- [ ] **Step 3: Commit**

```bash
git add nodes/WPForms/Wpforms.node.json
git commit -m "Replace unsupported codex categories with Communication

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Update the changelog

**Files:**
- Modify: `CHANGELOG.md` (new entry after line 6; compare links at lines 57-58)

**Interfaces:**
- Consumes: version `0.1.6` from Task 2.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the 0.1.6 entry**

In `CHANGELOG.md`, insert directly above the `## [0.1.5] - 2026-07-20` heading:

```markdown
## [0.1.6] - 2026-08-07

### Fixed
- Publish to npm with provenance to satisfy n8n community-node security checks.
- Add missing `homepage` field to `package.json`.
- Replace unsupported codex categories with `Communication`.

```

- [ ] **Step 2: Update the compare links**

At the bottom of `CHANGELOG.md`, change:

```markdown
[Unreleased]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.5...HEAD
[0.1.5]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.4...v0.1.5
```

to:

```markdown
[Unreleased]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/awesomemotive/wpforms-n8n-nodes/compare/v0.1.4...v0.1.5
```

- [ ] **Step 3: Verify the entry and links**

Run:

```bash
grep -c "0.1.6" CHANGELOG.md
```

Expected: `3` — exactly three lines contain `0.1.6`: the new `## [0.1.6]` heading, the updated `[Unreleased]` link, and the new `[0.1.6]` compare link.

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "UPD: changelog for 0.1.6

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Verify, get go-ahead, release

**Files:**
- No file changes. Runs project checks and pushes the release tag.

**Interfaces:**
- Consumes: all changes from Tasks 1-4 committed on `master`; version `0.1.6` in `package.json` must equal the tag `v0.1.6`.
- Produces: `v0.1.6` on npm with provenance; n8n re-review triggers automatically.

- [ ] **Step 1: Run the project lint**

```bash
npm run lint
```

Expected: exits 0 (no eslint errors). If eslint flags `package.json` ordering (the n8n eslint plugin lints package.json), fix per its message and amend the Task 2 commit.

- [ ] **Step 2: Run the build**

```bash
npm run build
```

Expected: exits 0; `dist/nodes/WPForms/WpformsTrigger.node.js` exists.

- [ ] **Step 3: Best-effort n8n linter check**

```bash
npx --yes @n8n/node-cli@latest lint || echo "node-cli lint not applicable to this project layout — acceptable per spec"
```

Expected: passes, or prints the fallback message (the project predates the n8n node CLI scaffold; spec marks this best-effort). Do not chase failures caused purely by scaffold-layout assumptions; do fix any finding that maps to the three review items.

- [ ] **Step 4: Push master and STOP for user go-ahead**

```bash
git push origin master
```

Then STOP. Report to the user: commits pushed, lint/build results, and ask explicitly: "Ready for me to tag v0.1.6 and push the tag? That triggers the npm publish." **Do not proceed without a yes.**

- [ ] **Step 5: Tag and push (only after explicit user approval)**

```bash
git tag v0.1.6
git push origin v0.1.6
```

- [ ] **Step 6: Watch the workflow run**

```bash
gh run watch --repo awesomemotive/wpforms-n8n-nodes $(gh run list --repo awesomemotive/wpforms-n8n-nodes --workflow=npm-publish.yml --limit 1 --json databaseId --jq '.[0].databaseId')
```

Expected: run completes successfully. If it fails on npm auth: per spec, configure a trusted publisher on npmjs.com (GitHub Actions / repo `awesomemotive/wpforms-n8n-nodes` / workflow `npm-publish.yml`) or mint a fresh granular NPM_TOKEN, then delete and re-push the tag (`git push --delete origin v0.1.6 && git tag -d v0.1.6`, redo Step 5).

- [ ] **Step 7: Verify provenance on the registry**

```bash
node -e "fetch('https://registry.npmjs.org/-/npm/v1/attestations/n8n-nodes-wpforms@0.1.6').then(r=>{console.log('attestations HTTP', r.status); process.exit(r.status===200?0:1)})"
```

Expected: `attestations HTTP 200`.

- [ ] **Step 8: Run the n8n scanner**

```bash
npx --yes @n8n/scan-community-package@beta n8n-nodes-wpforms
```

Expected: provenance check passes for 0.1.6 (registry propagation can lag a few minutes; retry once after 5 minutes before treating a failure as real).
