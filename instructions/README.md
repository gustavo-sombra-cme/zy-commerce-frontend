# Frontend Work Instructions

Use these instructions when planning or executing work in this Angular frontend repository.

## Before Changing Code

1. Read the relevant files under `src/app`.
2. Check whether the request is planning-only or execution-approved.
3. Confirm whether the task is documentation-only, frontend-only, or requires backend coordination.
4. Keep existing user changes intact.

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
