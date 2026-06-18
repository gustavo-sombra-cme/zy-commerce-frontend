# Correlation IDs

The frontend has an `X-Correlation-ID` propagation skeleton.

## Current Behavior

- `CorrelationIdService` creates a correlation ID with `crypto.randomUUID()` when available.
- `correlationIdInterceptor` adds the configured correlation header to HTTP requests for allowlisted backend origins.
- The default runtime config uses `X-Correlation-ID`.
- If a request already has the configured correlation header, the interceptor leaves it unchanged.
- Correlation IDs are shared across active frontend interactions until cleared by the service.

## Rules

- Preserve correlation IDs across multi-step user workflows when useful.
- Include correlation IDs on REST and future MCP HTTP calls to the backend.
- Do not use correlation IDs to carry user data, tokens, or request payloads.
- Show short user-safe failure references only when helpful.
- Use correlation IDs for troubleshooting instead of logging secrets or full payloads.

## Runtime Config

The header name is configured by:

```json
{
  "correlationHeaderName": "X-Correlation-ID"
}
```
