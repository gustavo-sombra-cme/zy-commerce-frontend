import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { McpToolDefinition } from './mcp-tool.model';

export interface McpConfirmationRequest {
  readonly tool: McpToolDefinition;
  readonly payloadSummary: string;
  readonly correlationId?: string;
}

export interface McpConfirmationDecision {
  readonly confirmed: boolean;
  readonly reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class McpConfirmationService {
  requestConfirmation(request: McpConfirmationRequest): Observable<McpConfirmationDecision> {
    if (!request.tool.mutating) {
      return of({ confirmed: true });
    }

    return of({
      confirmed: false,
      reason: 'Mutating MCP tools require an explicit confirmation UI before execution.'
    });
  }
}
