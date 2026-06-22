export type McpToolDomain = 'catalog' | 'orders';

export interface McpToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly domain: McpToolDomain;
  readonly mutating: boolean;
  readonly requiresConfirmation: boolean;
}
