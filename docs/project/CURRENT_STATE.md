# Current Frontend State

This repository contains a separate Angular frontend for the ZippyYum ecommerce backend.

## Implemented Foundation

- Angular v22 workspace with strict TypeScript.
- Standalone Angular components.
- Lazy route boundaries for Auth, Catalog, Product Details, Orders, and Assistant.
- Core/shared/features/MCP folder structure.
- Runtime config shape in `src/app/core/config`.
- Runtime config asset at `src/assets/config/runtime-config.json`.
- HTTP authorization interceptor.
- Correlation ID interceptor.
- Global error handling skeleton.
- MCP adapter interfaces, tool registry skeleton, and confirmation service skeleton.

## Implemented Auth

Auth is REST-only.

- Register page exists at `/auth/register`.
- Login page exists at `/auth/login`.
- Login calls `POST /api/auth/users/login`.
- Register calls `POST /api/auth/users/register`.
- Current user loading calls `GET /api/auth/users/me`.
- Login stores the returned `accessToken` through the token storage abstraction.
- After login, the frontend loads the current user from `/me`.
- Register does not auto-login. It redirects the user back to login with a success message.
- Logout clears the stored token and current user state.

## Protected Shell

- Public routes are under `/auth`.
- The authenticated shell protects the app feature routes.
- Protected feature routes include:
  - `/catalog`
  - `/products/:productId`
  - `/orders`
  - `/assistant`
- The shell shows primary navigation, the current user label, and logout.
- The route guard redirects unauthenticated users to `/auth/login?returnUrl=<target>`.
- If a stored token exists but the current user is not loaded, the guard loads `/api/auth/users/me` before allowing access.
- Unauthorized current-user loading clears the session.

## Feature Placeholders

- Catalog browse/search UI is still a placeholder.
- Product details UI is still a placeholder.
- Orders UI is still a placeholder.
- Assistant UI lists registered MCP tool skeletons.
- Real MCP execution is not implemented.
