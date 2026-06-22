# Frontend Work Instructions

Use these instructions when planning or executing work in this Angular frontend repository.

## Before Changing Code

1. Read the relevant files under `src/app`.
2. Check whether the request is planning-only or execution-approved.
3. Confirm whether the task is documentation-only, frontend-only, or requires backend coordination.
4. Keep existing user changes intact.

## Branch Workflow

- One task = one branch = one PR.
- Every approved execution task starts from latest `main` unless the user explicitly says otherwise.
- Create a new dedicated branch before making changes.
- Do not continue new feature work on an old feature branch.
- Do not work directly on `main`.
- Do not push directly to `main`.
- Use these branch prefixes:
  - `feature/<feature-name>`
  - `fix/<bug-name>`
  - `docs/<documentation-change>`
  - `chore/<maintenance-task>`

## Approved Execution Start

For every `APPROVED: EXECUTE` task:

1. Confirm the repo path.
2. Confirm the current branch.
3. Run `git status --short --branch`.
4. If the worktree has uncommitted changes, stop and report unless the user explicitly approves a separate worktree or explicitly approves including those changes.
5. Fetch latest `main`.
6. Check out `main`.
7. Pull latest `main`.
8. Create a new dedicated branch for the task.
9. Confirm the branch name before changing files.
10. Implement only after the new branch exists.

## Dirty Worktree Safety

- Do not switch branches, reset, stash, or overwrite dirty work without explicit approval.
- If the primary worktree is dirty and a new task must start, propose a separate clean Git worktree.
- Do not include unrelated dirty files in a task branch.

## Approved Execution Finish

For application or project-configuration changes, run:

```powershell
npm run build
npm test -- --no-watch --no-progress
npm audit --omit=dev
```

Then run:

```powershell
git status --short --branch
git diff --name-only
```

Summarize changed files, verification results, risks, and manual testing notes. Stop for developer local review.

## Manual Commit, Push, and PR Gate

- Do not commit automatically unless explicitly approved.
- Do not push automatically unless explicitly approved.
- Do not create a PR automatically unless explicitly approved.
- Wait for one of these approvals:
  - `APPROVED: COMMIT FRONTEND CHANGES`
  - `APPROVED: PUSH FRONTEND BRANCH`
  - `APPROVED: CREATE FRONTEND PR`
  - `APPROVED: COMMIT AND PUSH FRONTEND CHANGES`

Before any approved commit, run `git status --short --branch`, run `git diff --name-only`, review changed files, confirm no unrelated files, confirm no secrets, confirm no generated artifacts, confirm no `node_modules`, `dist`, or `coverage` files, and confirm required verification passed.

Stop if build fails, tests fail, `npm audit --omit=dev` reports production vulnerabilities, secrets are detected, unexpected files changed, the current branch is `main` during implementation, `main` is not up to date, the remote is unclear, or the worktree is dirty without approval for the task.

## Auth Rules

- Login uses `POST /api/auth/users/login`.
- Register uses `POST /api/auth/users/register`.
- Current user loading uses `GET /api/auth/users/me`.
- Login returns an `accessToken`.
- Register does not need to auto-login.
- Access tokens must be stored only through the token storage abstraction.
- The authorization interceptor attaches bearer tokens only to allowlisted backend origins.
- Logout clears token and user state.

## MCP Rules

- MCP is not the default path for normal UI workflows.
- REST remains the deterministic path for Auth, Catalog browse/details, and normal Orders flows.
- MCP is reserved for future AI/tool-driven Catalog and Orders workflows.
- Real MCP execution is out of scope unless explicitly approved.
- Mutating MCP tools require explicit human confirmation.

## Documentation Rules

- Keep project docs under `docs/project`.
- Keep reusable prompt drafts under `docs/prompts`.
- Keep task-specific prompt templates in `docs/project/PROMPT_TEMPLATE.md` unless a more specific template is approved.
- Documentation changes must not alter Angular app behavior.
