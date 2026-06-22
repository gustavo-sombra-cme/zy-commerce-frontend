export function isAllowedRequestUrl(requestUrl: string, allowedOrigins: readonly string[]): boolean {
  try {
    const parsedUrl = new URL(requestUrl, globalThis.location?.origin);
    return allowedOrigins.some((origin) => normalizeOrigin(origin) === parsedUrl.origin);
  } catch {
    return false;
  }
}

function normalizeOrigin(origin: string): string {
  return new URL(origin).origin;
}
