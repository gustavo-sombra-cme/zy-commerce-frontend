import { CartItem } from '../../cart/data/cart.models';
import { CreateOrderRequest } from './orders.models';

export function buildCreateOrderRequest(items: readonly CartItem[]): CreateOrderRequest {
  return {
    lines: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      // ADR-002: these fields are backend-required product snapshots only.
      // The backend must still validate final product identity, price, and availability.
      productSku: item.snapshot?.sku ?? '',
      productName: item.snapshot?.name ?? '',
      unitPrice: item.snapshot?.price ?? 0
    }))
  };
}
