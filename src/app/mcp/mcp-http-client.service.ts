import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap, throwError } from 'rxjs';

import { RuntimeConfigService } from '../core/config/runtime-config.service';
import { McpClient, McpToolCallRequest, McpToolCallResult } from './mcp-adapter.interface';
import { isApprovedReadonlyCatalogTool } from './mcp-catalog.models';
import { isApprovedReadonlyOrderTool } from './mcp-order.models';
import { McpToolDefinition } from './mcp-tool.model';
import { McpToolRegistry } from './mcp-tool-registry.service';

interface McpRpcResponse<TResult> {
  readonly jsonrpc: string;
  readonly id?: number | string;
  readonly result?: TResult;
  readonly error?: {
    readonly code?: number;
    readonly message?: string;
  };
}

interface McpBackendTool {
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly annotations?: {
    readonly title?: string;
    readonly readOnlyHint?: boolean;
    readonly destructiveHint?: boolean;
  };
}

interface McpToolsListResult {
  readonly tools: readonly McpBackendTool[];
}

interface McpToolCallBackendResult<TOutput> {
  readonly content?: readonly {
    readonly type: string;
    readonly text?: string;
  }[];
  readonly structuredContent?: TOutput;
}

interface ParsedSseEvent {
  readonly event?: string;
  readonly data: string;
}

@Injectable({
  providedIn: 'root'
})
export class McpHttpClientService implements McpClient {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly toolRegistry = inject(McpToolRegistry);
  private discoveredTools: readonly McpToolDefinition[] | null = null;

  listTools(): Observable<readonly McpToolDefinition[]> {
    return this.postRpc<McpToolsListResult>('tools/list', {}).pipe(
      map((result) => result.tools.map((tool) => this.toToolDefinition(tool))),
      tap((tools) => {
        this.discoveredTools = tools;
      })
    );
  }

  callTool<TInput = unknown, TOutput = unknown>(
    request: McpToolCallRequest<TInput>
  ): Observable<McpToolCallResult<TOutput>> {
    const tool = this.resolveTool(request.toolName);

    if (!tool) {
      return throwError(() => new Error('Unknown MCP tool is blocked.'));
    }

    if (tool.mutating || tool.requiresConfirmation) {
      return throwError(() => new Error('Mutating MCP tool execution is blocked.'));
    }

    if (!isApprovedReadonlyCatalogTool(tool.name) && !isApprovedReadonlyOrderTool(tool.name)) {
      return throwError(() => new Error('MCP tool is not approved for this assistant feature.'));
    }

    return this.postRpc<McpToolCallBackendResult<TOutput>>('tools/call', {
      name: request.toolName,
      arguments: request.input
    }).pipe(
      map((result) => ({
        content: this.toToolContent(result),
        correlationId: request.correlationId
      }))
    );
  }

  private resolveTool(toolName: string): McpToolDefinition | undefined {
    const tools = this.discoveredTools ?? this.toolRegistry.tools();

    return tools.find((tool) => tool.name === toolName);
  }

  private postRpc<TResult>(method: string, params: unknown): Observable<TResult> {
    return this.http.post(`${this.runtimeConfig.snapshot.mcpEndpointUrl}`, {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    }, {
      headers: new HttpHeaders({
        Accept: 'application/json, text/event-stream'
      }),
      responseType: 'text'
    }).pipe(
      map((response) => this.parseRpcResult<TResult>(response))
    );
  }

  private parseRpcResult<TResult>(response: string): TResult {
    const parsed = this.extractRpcResponse<TResult>(response);

    if (parsed.error) {
      throw new Error(parsed.error.message ?? 'MCP request failed.');
    }

    if (parsed.result === undefined) {
      throw new Error('MCP response did not include a result.');
    }

    return parsed.result;
  }

  private extractRpcResponse<TResult>(response: string): McpRpcResponse<TResult> {
    const trimmedResponse = response.trim();

    if (!trimmedResponse) {
      throw new Error('MCP response was empty.');
    }

    if (!this.looksLikeSse(trimmedResponse)) {
      return JSON.parse(trimmedResponse) as McpRpcResponse<TResult>;
    }

    const rpcResponses = this.parseSseEvents(trimmedResponse)
      .map((event) => this.tryParseRpcResponse<TResult>(event.data))
      .filter((rpcResponse): rpcResponse is McpRpcResponse<TResult> => Boolean(rpcResponse));

    const rpcResponse = [...rpcResponses].reverse()
      .find((candidate) => candidate.result !== undefined || candidate.error !== undefined);

    if (!rpcResponse) {
      throw new Error('MCP stream did not include a JSON-RPC result.');
    }

    return rpcResponse;
  }

  private looksLikeSse(response: string): boolean {
    return response.startsWith('event:')
      || response.startsWith('data:')
      || response.startsWith(':')
      || /\r?\ndata:/.test(response);
  }

  private parseSseEvents(response: string): readonly ParsedSseEvent[] {
    return response.split(/\r?\n\r?\n/)
      .map((frame) => this.parseSseEvent(frame))
      .filter((event): event is ParsedSseEvent => Boolean(event?.data));
  }

  private parseSseEvent(frame: string): ParsedSseEvent | null {
    let eventName: string | undefined;
    const dataLines: string[] = [];

    for (const line of frame.split(/\r?\n/)) {
      if (!line || line.startsWith(':')) {
        continue;
      }

      if (line.startsWith('event:')) {
        eventName = line.slice('event:'.length).trimStart();
        continue;
      }

      if (line.startsWith('data:')) {
        dataLines.push(line.slice('data:'.length).trimStart());
      }
    }

    if (dataLines.length === 0) {
      return null;
    }

    return {
      event: eventName,
      data: dataLines.join('\n').trim()
    };
  }

  private tryParseRpcResponse<TResult>(payload: string): McpRpcResponse<TResult> | null {
    if (!payload || payload === '[DONE]') {
      return null;
    }

    try {
      const parsed = JSON.parse(payload) as Partial<McpRpcResponse<TResult>>;
      return parsed.jsonrpc === '2.0' ? parsed as McpRpcResponse<TResult> : null;
    } catch {
      return null;
    }
  }

  private toToolDefinition(tool: McpBackendTool): McpToolDefinition {
    const mutating = tool.annotations?.destructiveHint === true || tool.annotations?.readOnlyHint !== true;

    return {
      name: tool.name,
      title: tool.title ?? tool.annotations?.title ?? tool.name,
      description: tool.description ?? '',
      domain: tool.name.startsWith('catalog_') ? 'catalog' : 'orders',
      mutating,
      requiresConfirmation: mutating
    };
  }

  private toToolContent<TOutput>(result: McpToolCallBackendResult<TOutput>): TOutput {
    if (result.structuredContent !== undefined) {
      return result.structuredContent;
    }

    const textContent = result.content?.find((item) => item.type === 'text' && item.text)?.text;

    if (!textContent) {
      throw new Error('MCP tool response did not include structured content.');
    }

    return JSON.parse(textContent) as TOutput;
  }
}
