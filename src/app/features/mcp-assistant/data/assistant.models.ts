export interface AssistantQueryRequest {
  readonly question: string;
}

export type AssistantResponseType =
  | 'recentOrders'
  | 'orderSummaryAnalytics'
  | 'orderedProducts'
  | 'matchingOrders'
  | 'productFrequency'
  | 'catalogProducts'
  | 'catalogProduct';

export interface AssistantQueryResponse {
  readonly answer: string;
  readonly toolsUsed: readonly string[];
  readonly dataScope: string;
  readonly unsupported: boolean;
  readonly responseType?: string | null;
  readonly data?: unknown | null;
}
