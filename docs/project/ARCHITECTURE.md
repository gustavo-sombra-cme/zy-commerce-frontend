# Angular Architecture

## Project Layout

- `src/app/core`: app-wide infrastructure.
  - Auth API client.
  - Auth session state.
  - Route guards.
  - HTTP interceptors.
  - Runtime config.
  - Logging and global error handling.
  - Authenticated layout shell.
- `src/app/shared`: reusable UI primitives and small shared utilities.
- `src/app/features`: route-level domain features.
  - `auth`
  - `catalog`
  - `orders`
  - `mcp-assistant`
- `src/app/mcp`: MCP interfaces and future tool workflow infrastructure.
- `src/assets/config`: runtime browser configuration.

## Angular Rules

- Use standalone components.
- Use lazy route boundaries for features.
- Keep strict TypeScript enabled.
- Prefer typed request/response models at service boundaries.
- Keep side effects in services and route guards, not in templates.
- Keep route-level behavior explicit in `app.routes.ts` and feature route files.
- Do not add a new state library unless a feature requires it and the plan approves it.
- Keep reusable UI small and domain-neutral in `shared`.
- Keep domain behavior in its feature folder unless it is genuinely app-wide.

## Shell Rules

- `AppComponent` owns only the root router outlet.
- Auth pages remain outside the authenticated shell.
- The authenticated shell is the parent route for protected feature areas.
- The shell can display current user state and logout.
- The shell must not expose tokens or raw auth state.

## Runtime Config

Browser runtime config may contain:

- Public API base URL.
- Public MCP endpoint URL.
- Authorization allowlisted origins.
- Correlation header name.
- Feature flags.
- Client log level.

Runtime config must not contain secrets, private keys, provider tokens, or production user tokens.
