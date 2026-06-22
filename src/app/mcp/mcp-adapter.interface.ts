import { Observable } from 'rxjs';

import { McpToolDefinition } from './mcp-tool.model';

export interface McpToolCallRequest<TInput = unknown> {
  readonly toolName: string;
  readonly input: TInput;
  readonly correlationId?: string;
}

export interface McpToolCallResult<TOutput = unknown> {
  readonly content: TOutput;
  readonly correlationId?: string;
}

export interface McpClient {
  listTools(): Observable<readonly McpToolDefinition[]>;
  callTool<TInput = unknown, TOutput = unknown>(
    request: McpToolCallRequest<TInput>
  ): Observable<McpToolCallResult<TOutput>>;
}
