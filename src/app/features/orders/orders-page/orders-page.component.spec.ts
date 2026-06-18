import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { OrdersApiClient } from '../data/orders-api.client';
import { OrdersPage } from '../data/orders.models';
import { OrdersPageComponent } from './orders-page.component';

describe('OrdersPageComponent', () => {
  let fixture: ComponentFixture<OrdersPageComponent>;
  let queryParamMap: BehaviorSubject<ParamMap>;
  let ordersApi: {
    listOrders: ReturnType<typeof vi.fn>;
  };
  let routeStub: {
    queryParamMap: ReturnType<BehaviorSubject<ParamMap>['asObservable']>;
  };

  const ordersPage: OrdersPage = {
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
  };

  function createComponent(pageResponse = of(ordersPage)): void {
    queryParamMap = new BehaviorSubject(convertToParamMap({
      pageNumber: '2',
      pageSize: '20'
    }));
    ordersApi = {
      listOrders: vi.fn(() => pageResponse)
    };
    routeStub = {
      queryParamMap: queryParamMap.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [OrdersPageComponent],
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

    fixture = TestBed.createComponent(OrdersPageComponent);
    fixture.detectChanges();
  }

  it('loads order summaries from URL query params and renders order cards', () => {
    createComponent();

    expect(ordersApi.listOrders).toHaveBeenCalledWith(2, 20);
    expect(fixture.nativeElement.textContent).toContain('Order order-1');
    expect(fixture.nativeElement.textContent).toContain('Created');
    expect(fixture.nativeElement.textContent).toContain('$42.50');
    expect(fixture.nativeElement.textContent).toContain('Showing 21-40 of 41');
  });

  it('links order cards to the order details route', () => {
    createComponent();

    const orderCard = fixture.nativeElement.querySelector('.order-card') as HTMLAnchorElement | null;

    expect(orderCard?.getAttribute('href')).toBe('/orders/order-1');
    expect(orderCard?.getAttribute('aria-label')).toBe('View details for order order-1');
  });

  it('shows a loading state while orders are loading', () => {
    const pendingResponse = new Subject<OrdersPage>();

    createComponent(pendingResponse.asObservable());

    expect(fixture.nativeElement.textContent).toContain('Loading orders...');

    pendingResponse.complete();
  });

  it('shows an empty state when no orders are returned', () => {
    createComponent(of({
      items: [],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    }));

    expect(fixture.nativeElement.textContent).toContain('No orders yet.');
  });

  it('shows an error state when order loading fails', () => {
    createComponent(throwError(() => new Error('Request failed')));

    expect(fixture.nativeElement.textContent).toContain('Orders could not be loaded. Please try again.');
  });

  it('retries the current order list request', () => {
    createComponent(throwError(() => new Error('Request failed')));

    fixture.componentInstance.retry();

    expect(ordersApi.listOrders).toHaveBeenCalledTimes(2);
    expect(ordersApi.listOrders).toHaveBeenCalledWith(2, 20);
  });

  it('writes pagination state to URL query params', () => {
    createComponent();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToPreviousPage();
    fixture.componentInstance.goToNextPage();

    expect(navigate).toHaveBeenNthCalledWith(1, [], {
      relativeTo: routeStub,
      queryParams: {
        pageNumber: 1,
        pageSize: 20
      }
    });
    expect(navigate).toHaveBeenNthCalledWith(2, [], {
      relativeTo: routeStub,
      queryParams: {
        pageNumber: 3,
        pageSize: 20
      }
    });
  });
});
