export type AppErrorKind = 'auth' | 'network' | 'server' | 'validation' | 'mcp' | 'unknown';

export interface AppError {
  readonly kind: AppErrorKind;
  readonly message: string;
  readonly correlationId?: string;
  readonly status?: number;
}
