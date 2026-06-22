# REST vs MCP Boundaries

## REST Flows

Use REST for deterministic product and account workflows.

- Auth login.
- Auth register.
- Current user loading.
- Normal Catalog browse/search.
- Product details lookup.
- Normal cart and checkout flows.
- Health/status checks where exposed to the frontend.

Current Auth REST endpoints:

- `POST /api/auth/users/register`
- `POST /api/auth/users/login`
- `GET /api/auth/users/me`

## MCP Flows

Use MCP for future AI/tool-driven workflows where the user is asking an assistant to reason over Catalog or Orders capabilities.

Candidate MCP workflows:

- Guided product discovery.
- Natural-language Catalog search.
- Product comparison through tool calls.
- Assistant-driven order lookup.
- Assistant-proposed order creation after explicit human confirmation.

## Mutating MCP Tools

Mutating MCP tools must never execute automatically.

Before any future mutating MCP call:

- Resolve the registered tool definition.
- Build a human-readable payload summary.
- Show a confirmation UI.
- Require explicit user confirmation.
- Preserve the correlation ID across the workflow.
- Send only validated input to the backend.

The current `McpConfirmationService` blocks mutating tools by default because the final confirmation UI is not implemented yet.

## Not Allowed

- Do not use MCP for login or register.
- Do not call AI provider APIs directly from the browser with secrets.
- Do not put provider keys or backend secrets in runtime config.
- Do not execute mutating MCP tools from background effects.
