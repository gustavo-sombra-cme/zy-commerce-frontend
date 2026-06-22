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
