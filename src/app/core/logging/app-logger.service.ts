import { Injectable } from '@angular/core';

const SENSITIVE_PATTERNS = [
  /bearer\s+[a-z0-9._~+/=-]+/gi,
  /"accessToken"\s*:\s*"[^"]+"/gi,
  /"password"\s*:\s*"[^"]+"/gi
];

@Injectable({
  providedIn: 'root'
})
export class AppLoggerService {
  error(message: string, details?: unknown): void {
    console.error(message, this.redact(details));
  }

  warn(message: string, details?: unknown): void {
    console.warn(message, this.redact(details));
  }

  info(message: string, details?: unknown): void {
    console.info(message, this.redact(details));
  }

  private redact(details: unknown): unknown {
    if (details instanceof Error) {
      return {
        name: details.name,
        message: this.redactString(details.message)
      };
    }

    if (typeof details === 'string') {
      return this.redactString(details);
    }

    if (details === undefined) {
      return undefined;
    }

    return '[details omitted]';
  }

  private redactString(value: string): string {
    return SENSITIVE_PATTERNS.reduce((current, pattern) => current.replace(pattern, '[redacted]'), value);
  }
}
