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

PLAN_STATUS: PENDING_APPROVAL
```

For execution after approval, replace the heading with:

```text
APPROVED: EXECUTE <feature name>
```
