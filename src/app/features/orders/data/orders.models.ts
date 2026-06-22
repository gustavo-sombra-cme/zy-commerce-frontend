export interface CreateOrderItemRequest {
  readonly productId: string;
  readonly quantity: number;
  readonly productSku: string;
  readonly productName: string;
  readonly unitPrice: number;
}

export interface CreateOrderRequest {
  readonly lines: readonly CreateOrderItemRequest[];
}

export interface OrderConfirmation {
  readonly id?: string;
  readonly orderId?: string;
  readonly status?: string;
  readonly createdAt?: string;
}

export interface OrderDetailsLine {
  readonly orderLineId: string;
  readonly productId: string;
  readonly productSku: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
}

export interface OrderDetails {
  readonly id?: string;
  readonly orderId?: string;
  readonly buyerId?: string;
  readonly status?: string;
  readonly createdAt?: string;
  readonly totalAmount?: number;
  readonly lines: readonly OrderDetailsLine[];
}

export interface OrderSummary {
  readonly orderId: string;
  readonly status: string;
  readonly totalAmount: number;
  readonly createdAt: string;
  readonly lineCount: number;
}

export interface OrdersPage {
  readonly items: readonly OrderSummary[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}
