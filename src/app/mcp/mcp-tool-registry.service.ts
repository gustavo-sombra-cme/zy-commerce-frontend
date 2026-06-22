import { Injectable, signal } from '@angular/core';

import { McpToolDefinition } from './mcp-tool.model';

const INITIAL_TOOLS: readonly McpToolDefinition[] = [
  {
    name: 'catalog_search_products',
    title: 'Search catalog',
    description: 'Read-only catalog discovery through MCP.',
    domain: 'catalog',
    mutating: false,
    requiresConfirmation: false
  },
  {
    name: 'catalog_get_product_by_id',
    title: 'Get product details',
    description: 'Read-only product detail lookup through MCP.',
    domain: 'catalog',
    mutating: false,
    requiresConfirmation: false
  },
  {
    name: 'orders_get_order_by_id',
    title: 'Get order',
    description: 'Read-only order lookup through MCP.',
    domain: 'orders',
    mutating: false,
    requiresConfirmation: false
  },
  {
    name: 'orders_create_order',
    title: 'Create order',
    description: 'Future MCP-assisted order creation. Must be confirmed by a human before execution.',
    domain: 'orders',
    mutating: true,
    requiresConfirmation: true
  }
];

@Injectable({
  providedIn: 'root'
})
export class McpToolRegistry {
  private readonly registeredTools = signal(INITIAL_TOOLS);

  readonly tools = this.registeredTools.asReadonly();

  findTool(toolName: string): McpToolDefinition | undefined {
    return this.registeredTools().find((tool) => tool.name === toolName);
  }
}
