import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OrdersApiClient } from './orders-api.client';

describe('OrdersApiClient', () => {
  let client: OrdersApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    client = TestBed.inject(OrdersApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('posts create order requests to the backend orders endpoint', () => {
    const requestBody = {
      lines: [
        {
          productId: 'product-1',
          productSku: 'COF-001',
          productName: 'Coffee Beans',
          unitPrice: 12.5,
          quantity: 2
        }
      ]
    };

    client.createOrder(requestBody).subscribe((confirmation) => {
      expect(confirmation.orderId).toBe('order-1');
    });

    const request = http.expectOne('http://localhost:5015/api/orders');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    expect(request.request.body).not.toHaveProperty('items');
    request.flush({
      orderId: 'order-1',
      status: 'Created'
    });
  });

  it('lists authenticated user orders with approved pagination params', () => {
    client.listOrders(2, 20).subscribe((page) => {
      expect(page.pageNumber).toBe(2);
      expect(page.items[0]?.orderId).toBe('order-1');
      expect(page.items[0]?.lineCount).toBe(3);
      expect(page.hasNextPage).toBe(true);
    });

    const request = http.expectOne((candidate) => candidate.url === 'http://localhost:5015/api/orders');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('20');

    request.flush({
      items: [
        {
          orderId: 'order-1',
          status: 'Created',
          totalAmount: 42.5,
          createdAt: '2026-06-17T09:00:00.000Z',
          lineCount: 3
        }
      ],
      pageNumber: 2,
      pageSize: 20,
      totalCount: 41,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: true
    });
  });

  it('gets order details by ID', () => {
    client.getOrderById('order 1').subscribe((order) => {
      expect(order.orderId).toBe('order 1');
      expect(order.lines[0]?.orderLineId).toBe('line-1');
      expect(order.lines[0]?.productName).toBe('Coffee Beans');
    });

    const request = http.expectOne('http://localhost:5015/api/orders/order%201');

    expect(request.request.method).toBe('GET');
    request.flush({
      orderId: 'order 1',
      status: 'Created',
      totalAmount: 25,
      lines: [
        {
          orderLineId: 'line-1',
          productId: 'product-1',
          productSku: 'COF-001',
          productName: 'Coffee Beans',
          quantity: 2,
          unitPrice: 12.5,
          lineTotal: 25
        }
      ]
    });
  });
});
