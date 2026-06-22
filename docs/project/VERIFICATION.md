# Verification

Run these commands before completing frontend behavior changes:

```powershell
npm run build
npm test -- --no-watch --no-progress
npm audit --omit=dev
```

## Command Purpose

- `npm run build`: verifies Angular production compilation, template type checking, routing chunks, and budgets.
- `npm test -- --no-watch --no-progress`: runs the unit test suite once.
- `npm audit --omit=dev`: checks production dependency advisories.

## Documentation-Only Changes

For documentation-only harness changes:

- Do not change application behavior.
- Inspect changed files.
- Run `git diff --name-only`.
- Confirm only frontend documentation/process files changed.
- Run build/test only if the documentation change also touched Angular code or project config.

## End-of-Execution Checks

Every approved execution task must finish with:

```powershell
git status --short --branch
git diff --name-only
```

The final report must include:

- Changed files.
- Verification results.
- Risks and manual testing notes.
- Confirmation that unrelated dirty files, secrets, and generated artifacts were not included.

## Commit, Push, and PR Gate

Do not commit, push, or create a pull request unless explicitly approved. After implementation and verification, stop for developer local review and wait for one of:

- `APPROVED: COMMIT FRONTEND CHANGES`
- `APPROVED: PUSH FRONTEND BRANCH`
- `APPROVED: CREATE FRONTEND PR`
- `APPROVED: COMMIT AND PUSH FRONTEND CHANGES`

Before any approved commit, confirm:

- `git status --short --branch` was reviewed.
- `git diff --name-only` was reviewed.
- No unrelated files are included.
- No secrets are included.
- No generated artifacts are included.
- No `node_modules`, `dist`, or `coverage` files are included.
- Required build/test/audit verification passed when application files changed.

Stop and report if build fails, tests fail, `npm audit --omit=dev` reports production vulnerabilities, secrets are detected, unexpected files changed, the current branch is `main` during implementation, `main` is not up to date, the remote is unclear, or the worktree is dirty without approval for the task.
