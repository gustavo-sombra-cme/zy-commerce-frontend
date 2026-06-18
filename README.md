# ZippyYum Commerce Frontend

Separate Angular frontend for the ZippyYum ecommerce backend.

This foundation is intentionally MCP-first where appropriate:

- REST is used for login and registration.
- REST remains the default path for deterministic catalog and checkout UI.
- MCP is represented by interfaces, a tool registry, and a confirmation gate for future AI/tool-driven Catalog and Orders workflows.
- Mutating MCP tools are blocked by default until an explicit human confirmation UI is wired in.

## Local setup

Angular v22 requires a supported Node.js version. Install Node.js before running the app.

```powershell
npm install
npm start
```

Useful commands:

```powershell
npm run build
npm test
```

## Runtime configuration

Default runtime config lives at `src/assets/config/runtime-config.json`.

Do not commit secrets or production tokens. Browser config should contain only public client settings such as API origins, feature flags, and log level.
