# Security Notes

## Token Safety

- Login returns an `accessToken`.
- The access token is stored only through the token storage abstraction.
- The current fallback storage is `sessionStorage`.
- Do not use `localStorage` for tokens.
- Do not place tokens in URLs.
- Do not print tokens in logs.
- Do not include tokens in error messages.
- Do not include raw auth payloads in analytics or telemetry.

## No Secrets

Never commit:

- API secrets.
- AI provider keys.
- Backend signing keys.
- Production access tokens.
- User credentials.
- Private deployment values.

Browser runtime config is public. Treat everything in `src/assets/config/runtime-config.json` as visible to users.

## Authorization Header Behavior

- The authorization interceptor reads the access token from the token storage abstraction.
- The interceptor attaches `Authorization: Bearer <token>` only for allowlisted backend origins.
- Non-allowlisted origins must not receive bearer tokens.
- Asset requests and third-party requests must not receive bearer tokens.

## Logging

- Use the app logger for app-level logging.
- Keep logs user-safe and token-safe.
- Do not log passwords, tokens, raw request bodies, raw auth responses, or authorization headers.
- Prefer correlation IDs over payload dumps when debugging failures.

## Browser Risk Areas

- XSS can expose browser-held tokens.
- Runtime config is public.
- Client-side validation does not replace backend authorization and validation.
- Future MCP tool outputs must be treated as untrusted data when rendered.
