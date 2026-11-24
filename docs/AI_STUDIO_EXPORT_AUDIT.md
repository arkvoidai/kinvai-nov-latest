# AI Studio Export Audit

**Repository:** `arkvoidai/kinvai-nov-latest`  
**Audited ref:** `main` at `8e0fadfddef6ae0969597e18b6fac33e112d368c`  
**Audit date:** 2026-11-24

## Summary

The export is structurally present and does not show evidence of broad file corruption in the inspected manifests and project instructions. One concrete test-runner mismatch was found and corrected in this pull request. A full build, type-check, and test execution was not available during this remote audit, so runtime cleanliness is **not certified**.

## Findings and changes

### 1. Test runner mismatch — fixed in this PR

The package script is `vitest run`, and Vitest is already declared in `package.json`. All 11 existing `.test.ts` files imported `test` from Node's `node:test` module instead of the Vitest API. The test imports have been changed to `import { test } from 'vitest';`. The existing `node:assert/strict` assertions are retained.

### 2. Manifest and instruction-file checks

- `package.json`, `tsconfig.json`, and `metadata.json` parse as valid JSON.
- `bun.lock` is Bun's lockfile format and uses trailing commas; it is not intended to be parsed with strict `JSON.parse`. Its opening workspace metadata is consistent in shape with a Bun lockfile.
- Reviewed instruction and policy documents: `docs/CHARTER.md`, `docs/DECISIONS.md`, `docs/AUTH_SETUP.md`, `docs/CLAIMS_TO_CONFIRM.md`, and `docs/COLOR.md`. The Markdown files have balanced fenced-code markers where fences are used, and no merge-conflict markers were found.
- The Vite, TypeScript, app-entry, server-entry, and server configuration files were inspected. No obvious truncation or malformed syntax was identified by visual review.

### 3. File size and exported assets

The tracked tree contains 157 files and approximately 14.2 MB of content. TypeScript/TSX source totals approximately 0.94 MB. The largest application source file is `src/pages/DesignPage.tsx` (about 43.5 KB); the source files are not unusually large individually.

The repository size is dominated by 10 exported images under `public/assets/aistudio/` (about 13.2 MB). Two PNG paths contain the exact same Git blob (about 2.84 MB each). These assets were **not deleted** because code references could not be reliably resolved through the available repository search index. Removing a possibly referenced image would risk breaking the app.

### 4. Loop and execution-risk review

The inspected retry and rate-limiter loops are bounded: Gemini generation has at most two attempts, and rate-limit pruning iterates a finite in-memory map. The repository-wide code search did not return usable indexed matches, so this is not a proof that no unbounded loop exists elsewhere.

### 5. Checks not run

- No build, TypeScript check, or automated test run was executed in this remote audit session.
- The latest commit had no reported commit status checks, and the repository tree contained no CI workflow.
- No visual browser/preview verification was performed.

## Feature request

The feature description in the original task was still the placeholder `[describe the feature or bug fix you were trying to make in Al Studio]`. No product behavior was invented or changed. Once the intended feature or bug is stated, it should be implemented as a separate, scoped change following `docs/CHARTER.md` and `docs/DECISIONS.md`.

## Recommendation

Merge the test-runner import correction, then run `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, and `bun run build` in the project environment before deployment. Verify the two duplicate asset references before considering their removal.


## AI Studio Build Mode: long-running agent termination (investigation)

The reported message, `Agent execution terminated due to error. An internal error occurred.`, is a Build Mode execution failure, not an HTTP/server error emitted by this repository. The repository audit did not identify a demonstrable application infinite loop or malformed instruction file that explains a repeatable ~20-minute termination. This cannot be diagnosed conclusively from source alone without the failing AI Studio session trace.

Factors worth reducing while reproducing:

- The instruction/context files are sizeable but not enormous: `docs/CHARTER.md` ~11.9 KB, `docs/DECISIONS.md` ~26.2 KB, `docs/AUTH_SETUP.md` ~6.1 KB, `docs/COLOR.md` ~4.7 KB, and `src/pages/DesignPage.tsx` ~43.5 KB. These are not proof of overload, but avoid asking the agent to ingest and rewrite several of them in one task.
- The export has 10 large AI Studio assets (~13.2 MB total). This is primarily project storage/transfer overhead, not evidence that the agent's reasoning loop is broken.
- Vite's config contains an intentional `DISABLE_HMR` setting. If it is enabled, file watching and HMR are disabled by design; this may make preview-based validation appear stale, but it does not itself establish the cause of an internal agent termination. Do not remove it without verifying the environment and preview workflow.

### Safe reproduction/triage

1. Reopen Build Mode with a fresh session, without asking it to process all documentation or images.
2. Ask it to read only the target file and make one small edit, then verify preview.
3. If it still terminates after a similar elapsed time, treat that as a Build Mode service/session failure and capture the time, prompt, and any visible logs for support. Avoid repeated large retries against the same session.
4. For work that can be done from the repository, use a local checkout and run `bun run lint`, `bun run test`, and `bun run build` instead of waiting on the Build Mode agent.

No project files were removed or rewritten solely to speculate about the internal error.
