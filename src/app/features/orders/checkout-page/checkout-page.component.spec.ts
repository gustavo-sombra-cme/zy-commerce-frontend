import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CartStateService } from '../../cart/data/cart-state.service';
import { OrdersApiClient } from '../data/orders-api.client';
import { CheckoutPageComponent } from './checkout-page.component';

describe('CheckoutPageComponent', () => {
  let fixture: ComponentFixture<CheckoutPageComponent>;
  let cartState: CartStateService;
  let ordersApi: {
    createOrder: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    globalThis.sessionStorage.clear();
    ordersApi = {
      createOrder: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OrdersApiClient,
          useValue: ordersApi
        }
      ]
    });

    cartState = TestBed.inject(CartStateService);
  });

  afterEach(() => {
    globalThis.sessionStorage.clear();
  });

  function addCartItem(): void {
    cartState.addItem('product-1', 2, {
      sku: 'COF-001',
      name: 'Coffee Beans',
      price: 12.5,
      currencyCode: 'USD'
    });
  }

  function createComponent(): void {
    fixture = TestBed.createComponent(CheckoutPageComponent);
    fixture.detectChanges();
  }

  it('shows an empty cart state', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Your cart is empty.');
  });

  it('does not submit checkout when the cart is empty', () => {
    createComponent();

    fixture.componentInstance.createOrder();

    expect(ordersApi.createOrder).not.toHaveBeenCalled();
  });

  it('creates orders from cart items and clears the cart after success', () => {
    addCartItem();
    ordersApi.createOrder.mockReturnValue(of({
      orderId: 'order-1',
      status: 'Created'
    }));
    createComponent();

    fixture.componentInstance.createOrder();
    fixture.detectChanges();

    expect(ordersApi.createOrder).toHaveBeenCalledWith({
      lines: [
        {
          productId: 'product-1',
          productSku: 'COF-001',
          productName: 'Coffee Beans',
          unitPrice: 12.5,
          quantity: 2
        }
      ]
    });
    expect(cartState.items()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Order created');
    expect(fixture.nativeElement.textContent).toContain('order-1');
  });

  it('links successful checkout confirmations to order details when an order ID exists', () => {
    addCartItem();
    ordersApi.createOrder.mockReturnValue(of({
      orderId: 'order-1',
      status: 'Created'
    }));
    createComponent();

    fixture.componentInstance.createOrder();
    fixture.detectChanges();

    const detailsLink = fixture.nativeElement.querySelector('.primary-link') as HTMLAnchorElement | null;

    expect(detailsLink?.getAttribute('href')).toBe('/orders/order-1');
  });

  it('does not render an order details link when confirmation has no order ID', () => {
    addCartItem();
    ordersApi.createOrder.mockReturnValue(of({
      status: 'Created'
    }));
    createComponent();

    fixture.componentInstance.createOrder();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.primary-link')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Pending');
  });

  it('does not clear the cart when order creation fails', () => {
    addCartItem();
    ordersApi.createOrder.mockReturnValue(throwError(() => new Error('Request failed')));
    createComponent();

    fixture.componentInstance.createOrder();
    fixture.detectChanges();

    expect(cartState.items()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Order could not be created. Please try again.');
  });

  it('disables order creation while submitting', () => {
    addCartItem();
    ordersApi.createOrder.mockReturnValue(of({
      orderId: 'order-1'
    }));
    createComponent();

    fixture.componentInstance.status.set('submitting');
    fixture.componentInstance.createOrder();

    expect(ordersApi.createOrder).not.toHaveBeenCalled();
  });
});
