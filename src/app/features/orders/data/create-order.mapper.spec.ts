import { buildCreateOrderRequest } from './create-order.mapper';

describe('buildCreateOrderRequest', () => {
  it('builds backend-required order items from cart productId and quantity plus display snapshots', () => {
    const request = buildCreateOrderRequest([
      {
        productId: 'product-1',
        quantity: 2,
        snapshot: {
          sku: 'COF-001',
          name: 'Coffee Beans',
          price: 12.5,
          currencyCode: 'USD',
          isActive: true
        }
      }
    ]);

    expect(request).toEqual({
      lines: [
        {
          productId: 'product-1',
          quantity: 2,
          productSku: 'COF-001',
          productName: 'Coffee Beans',
          unitPrice: 12.5
        }
      ]
    });
  });

  it('uses safe snapshot fallbacks when display data is missing', () => {
    const request = buildCreateOrderRequest([
      {
        productId: 'product-1',
        quantity: 1
      }
    ]);

    expect(request.lines[0]).toEqual({
      productId: 'product-1',
      quantity: 1,
      productSku: '',
      productName: '',
      unitPrice: 0
    });
  });
});
