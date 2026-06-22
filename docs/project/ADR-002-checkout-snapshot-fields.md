# ADR-002: Checkout Snapshot Fields

## Status

Accepted.

## Context

The frontend cart stores `productId` and `quantity` as authoritative cart data.

The current backend `POST /api/orders` contract also requires these product snapshot fields on each order item:

- `productSku`
- `productName`
- `unitPrice`

These values are available in the frontend cart only as display snapshots captured from Catalog/Product Details responses.

## Decision

The frontend `CreateOrderRequest` includes:

- `productId`
- `quantity`
- `productSku`
- `productName`
- `unitPrice`

Only `productId` and `quantity` are treated as authoritative frontend cart fields.

`productSku`, `productName`, and `unitPrice` are sent only because the current backend contract requires them. They are display snapshot values and must not be treated as trusted pricing, inventory, or product identity data.

## Consequences

- The backend must validate product identity, current price, availability, and order totals.
- The frontend must not use cart snapshot prices as final checkout truth.
- Future backend contract changes may remove the need to send snapshot fields from the browser.
- Tests should verify that the frontend builds requests with the required shape while preserving the source-of-truth distinction.
