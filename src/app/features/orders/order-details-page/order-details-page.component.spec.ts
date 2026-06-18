import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { OrdersApiClient } from '../data/orders-api.client';
import { OrderDetails } from '../data/orders.models';
import { OrderDetailsPageComponent } from './order-details-page.component';

describe('OrderDetailsPageComponent', () => {
  let fixture: ComponentFixture<OrderDetailsPageComponent>;
  let paramMap: BehaviorSubject<ParamMap>;
  let ordersApi: {
    getOrderById: ReturnType<typeof vi.fn>;
  };
  let routeStub: {
    paramMap: ReturnType<BehaviorSubject<ParamMap>['asObservable']>;
  };

  const order: OrderDetails = {
    orderId: 'order-1',
    status: 'Created',
    createdAt: '2026-06-17T09:00:00.000Z',
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
  };

  function createComponent(orderResponse = of(order)): void {
    paramMap = new BehaviorSubject(convertToParamMap({
      orderId: 'order-1'
    }));
    ordersApi = {
      getOrderById: vi.fn(() => orderResponse)
    };
    routeStub = {
      paramMap: paramMap.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [OrderDetailsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OrdersApiClient,
          useValue: ordersApi
        },
        {
          provide: ActivatedRoute,
          useValue: routeStub
        }
      ]
    });

    fixture = TestBed.createComponent(OrderDetailsPageComponent);
    fixture.detectChanges();
  }

  it('loads order details from the route order ID', () => {
    createComponent();

    expect(ordersApi.getOrderById).toHaveBeenCalledWith('order-1');
    expect(fixture.nativeElement.textContent).toContain('Order order-1');
    expect(fixture.nativeElement.textContent).toContain('Created');
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('COF-001');
    expect(fixture.nativeElement.textContent).toContain('$25.00');
  });

  it('shows a loading state while order details are loading', () => {
    const pendingResponse = new Subject<OrderDetails>();

    createComponent(pendingResponse.asObservable());

    expect(fixture.nativeElement.textContent).toContain('Loading order...');

    pendingResponse.complete();
  });

  it('shows not found state for 404 responses', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 404 })));

    expect(fixture.nativeElement.textContent).toContain('Order not found');
    expect(fixture.nativeElement.textContent).toContain('No order exists for this ID.');
  });

  it('shows an error state for non-404 failures', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(fixture.nativeElement.textContent).toContain('Order details could not be loaded. Please try again.');
  });

  it('retries the current order request', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 500 })));

    fixture.componentInstance.retry();

    expect(ordersApi.getOrderById).toHaveBeenCalledTimes(2);
    expect(ordersApi.getOrderById).toHaveBeenCalledWith('order-1');
  });
});
