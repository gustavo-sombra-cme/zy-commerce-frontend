# Frontend Prompt Template

Use this template for future Angular frontend work.

```text
Plan frontend feature: <feature name>

Goal:
<Describe the intended frontend outcome.>

Backend context:
- <Relevant REST endpoints.>
- <Relevant MCP tools or endpoint notes.>
- <Auth/correlation/security constraints.>

Current frontend context:
- Angular v22, standalone components, strict TypeScript.
- Auth login/register and protected shell are implemented.
- Access tokens use the token storage abstraction.
- Bearer tokens are attached only to allowlisted backend origins.
- Correlation IDs are propagated to allowlisted backend origins.
- MCP execution is skeleton-only unless explicitly approved.

Scope:
- <Items included.>

Out of Scope:
- <Items excluded.>

Rules:
- One task = one branch = one PR.
- Start every approved execution task from latest main unless explicitly stated otherwise.
- Create a new dedicated branch before changing files.
- Do not work directly on main.
- Do not push directly to main.
- Stop if the worktree is dirty unless a separate worktree or inclusion of the dirty changes is explicitly approved.
- Keep login/register REST-only.
- Do not assume refresh tokens exist.
- Do not expose tokens to logs.
- Do not store secrets in source control.
- Preserve REST vs MCP boundaries.
- Mutating MCP tools require explicit human confirmation.
- Do not modify backend code from the frontend repo.

Verification:
- npm run build
- npm test -- --no-watch --no-progress
- npm audit --omit=dev
- git status --short --branch
- git diff --name-only

Manual gates:
- Do not commit unless explicitly approved.
- Do not push unless explicitly approved.
- Do not create a PR unless explicitly approved.
- Stop after implementation and verification for developer local review.

PLAN_STATUS: PENDING_APPROVAL
```

For execution after approval, replace the heading with:

```text
APPROVED: EXECUTE <feature name>

Repository:
<Frontend repo path.>

Branch:
<feature|fix|docs|chore>/<task-name>

Start flow:
- Confirm repo path.
- Confirm current branch.
- Run git status.
- Fetch latest main.
- Checkout main.
- Pull latest main.
- Create the dedicated task branch.
- Confirm the task branch before changing files.

End flow:
- Run required verification.
- Run git status.
- Run git diff --name-only.
- Summarize changed files, verification results, risks, and manual testing notes.
- Stop for local review.
```
