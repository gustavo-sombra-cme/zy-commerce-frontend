export type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RuntimeConfig {
  readonly apiBaseUrl: string;
  readonly mcpEndpointUrl: string;
  readonly authorizationAllowedOrigins: readonly string[];
  readonly correlationHeaderName: string;
  readonly enableMcpAssistant: boolean;
  readonly logLevel: ClientLogLevel;
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  apiBaseUrl: 'http://localhost:5015',
  mcpEndpointUrl: 'http://localhost:5015/mcp',
  authorizationAllowedOrigins: ['http://localhost:5015'],
  correlationHeaderName: 'X-Correlation-ID',
  enableMcpAssistant: false,
  logLevel: 'info'
};
