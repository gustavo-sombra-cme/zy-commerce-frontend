import { TestBed } from '@angular/core/testing';

import { CatalogProduct } from '../../catalog/data/catalog.models';
import { CartStateService } from './cart-state.service';

const CART_STORAGE_KEY = 'zy-commerce.cart.v1';

describe('CartStateService', () => {
  const product: CatalogProduct = {
    id: 'product-1',
    name: 'Coffee Beans',
    sku: 'COF-001',
    price: 12.5,
    currencyCode: 'USD',
    imageUrl: '/coffee.png',
    isActive: true
  };

  beforeEach(() => {
    globalThis.sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    globalThis.sessionStorage.clear();
  });

  it('stores productId and quantity as authoritative cart data with display snapshots', () => {
    const service = TestBed.inject(CartStateService);

    service.addProduct(product, 2);

    expect(service.items()).toEqual([
      {
        productId: 'product-1',
        quantity: 2,
        snapshot: {
          name: 'Coffee Beans',
          sku: 'COF-001',
          price: 12.5,
          currencyCode: 'USD',
          imageUrl: '/coffee.png',
          isActive: true
        }
      }
    ]);
    expect(JSON.parse(globalThis.sessionStorage.getItem(CART_STORAGE_KEY) ?? '{}')).toEqual({
      items: service.items()
    });
  });

  it('increments existing items and updates quantities', () => {
    const service = TestBed.inject(CartStateService);

    service.addProduct(product);
    service.addProduct(product, 3);
    service.updateQuantity('product-1', 5);

    expect(service.items()[0]?.quantity).toBe(5);
    expect(service.totalQuantity()).toBe(5);
    expect(service.displaySubtotal()).toBe(62.5);
  });

  it('ignores catalog products without a usable product ID', () => {
    const service = TestBed.inject(CartStateService);

    service.addProduct({
      ...product,
      id: ''
    });

    expect(service.items()).toEqual([]);
    expect(service.totalQuantity()).toBe(0);
  });

  it('removes items and clears the persisted cart', () => {
    const service = TestBed.inject(CartStateService);

    service.addProduct(product);
    service.removeItem('product-1');

    expect(service.items()).toEqual([]);

    service.addProduct(product);
    service.clear();

    expect(service.items()).toEqual([]);
    expect(JSON.parse(globalThis.sessionStorage.getItem(CART_STORAGE_KEY) ?? '{}')).toEqual({ items: [] });
  });

  it('loads an existing sessionStorage cart', () => {
    globalThis.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          snapshot: {
            name: 'Coffee Beans'
          }
        }
      ]
    }));

    const service = TestBed.inject(CartStateService);

    expect(service.items()).toEqual([
      {
        productId: 'product-1',
        quantity: 2,
        snapshot: {
          name: 'Coffee Beans'
        }
      }
    ]);
  });
});
