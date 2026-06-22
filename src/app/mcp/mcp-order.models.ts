export const ORDERS_GET_ORDER_BY_ID_TOOL = 'orders_get_order_by_id';
export const ORDERS_CREATE_ORDER_TOOL = 'orders_create_order';

export const APPROVED_READONLY_ORDER_TOOLS = [
  ORDERS_GET_ORDER_BY_ID_TOOL
] as const;

export type ApprovedReadonlyOrderTool = typeof APPROVED_READONLY_ORDER_TOOLS[number];

export interface OrdersGetOrderByIdInput {
  readonly orderId: string;
}

export interface McpOrderLine {
  readonly orderLineId: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly lineTotal: number;
}

export interface McpOrderDetails {
  readonly orderId: string;
  readonly buyerId: string;
  readonly status: string;
  readonly totalAmount: number;
  readonly createdAt: string;
  readonly lines: readonly McpOrderLine[];
}

export function isApprovedReadonlyOrderTool(toolName: string): toolName is ApprovedReadonlyOrderTool {
  return APPROVED_READONLY_ORDER_TOOLS.includes(toolName as ApprovedReadonlyOrderTool);
}
