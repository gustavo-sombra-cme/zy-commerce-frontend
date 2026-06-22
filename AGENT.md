# Agent Instructions

This repository is the separate Angular frontend for the ZippyYum ecommerce backend. Treat the frontend repo as the source of truth for client work.

## Current Stack

- Angular v22 application.
- Standalone components.
- Lazy route boundaries.
- Strict TypeScript.
- Runtime config loaded from `src/assets/config/runtime-config.json`.
- REST Auth integration is implemented for login, register, and current-user loading.
- MCP client code is skeleton-only. Real MCP execution is not implemented.

## Operating Rules

- Do not modify backend code from this repository.
- Keep backend routes exactly as documented unless the backend contract changes.
- Do not store secrets in source control.
- Do not log passwords, access tokens, raw auth payloads, or full authorization headers.
- Keep login/register REST-only.
- Keep normal deterministic UI workflows on REST unless a plan explicitly approves MCP use.
- Use MCP only for future AI/tool-driven Catalog and Orders workflows.
- Mutating MCP tools must require explicit human confirmation before execution.
- Preserve the token storage abstraction. Do not bypass it.
- Preserve allowlisted-origin behavior for bearer-token attachment.

## Branch Workflow Rules

- One task = one branch = one PR.
- Every approved execution task must start from latest `main` unless the user explicitly says otherwise.
- Create a new dedicated branch before changing files.
- Do not continue new feature work on an old feature branch.
- Do not work directly on `main`.
- Do not push directly to `main`.
- Use branch names in one of these forms:
  - `feature/<feature-name>`
  - `fix/<bug-name>`
  - `docs/<documentation-change>`
  - `chore/<maintenance-task>`

## Start-of-Execution Flow

For every `APPROVED: EXECUTE` task:

1. Confirm the current repository path.
2. Confirm the current branch.
3. Run `git status --short --branch`.
4. If the worktree has uncommitted changes, stop and report unless the user explicitly approves a separate worktree or explicitly approves including those changes.
5. Fetch latest `main`.
6. Check out `main`.
7. Pull latest `main`.
8. Create a new dedicated branch for the approved task.
9. Confirm the branch name before making changes.
10. Implement only after the new branch exists.

## Dirty Worktree Safety

- Do not switch branches, reset, stash, or overwrite files in a dirty worktree without explicit approval.
- If a new task must start while the primary worktree is dirty, propose a separate clean Git worktree.
- Do not include unrelated dirty files in a task branch.

## Manual Commit and Push Gate

- Do not commit automatically unless explicitly approved.
- Do not push automatically unless explicitly approved.
- Do not create a pull request automatically unless explicitly approved.
- After implementation and verification, stop for local review and wait for one of:
  - `APPROVED: COMMIT FRONTEND CHANGES`
  - `APPROVED: PUSH FRONTEND BRANCH`
  - `APPROVED: CREATE FRONTEND PR`
  - `APPROVED: COMMIT AND PUSH FRONTEND CHANGES`

## Pre-Commit Checks

Before any approved commit, run or confirm:

- `git status --short --branch`
- `git diff --name-only`
- Changed files were reviewed.
- No unrelated files are included.
- No secrets are included.
- No generated artifacts are included.
- No `node_modules`, `dist`, or `coverage` files are included.
- Required build/test/audit verification passed when application files changed.

Stop and report if build fails, tests fail, `npm audit --omit=dev` reports production vulnerabilities, secrets are detected, unexpected files changed, the current branch is `main` during implementation, `main` is not up to date, the remote is unclear, or the worktree is dirty without approval for the task.

## Architecture Rules

- Put app-wide services, interceptors, guards, config, logging, and layout in `src/app/core`.
- Put reusable UI primitives in `src/app/shared`.
- Put domain UI in `src/app/features`.
- Put MCP adapter interfaces, registry, and confirmation logic in `src/app/mcp`.
- Prefer route-level lazy loading for feature areas.
- Prefer standalone Angular components and strict typed services.
- Keep application behavior changes separate from documentation-only harness changes.

## Verification

Run these commands before completing behavior changes:

```powershell
npm run build
npm test -- --no-watch --no-progress
npm audit --omit=dev
```

For documentation-only changes, at minimum inspect the changed files and avoid running commands that would alter application behavior.

End every approved execution task by running `git status --short --branch`, `git diff --name-only`, summarizing changed files, summarizing verification results, noting risks and manual testing, and stopping for developer local review.
