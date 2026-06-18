import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CartStateService } from '../data/cart-state.service';
import { CartPageComponent } from './cart-page.component';

describe('CartPageComponent', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let cartState: CartStateService;

  beforeEach(() => {
    globalThis.sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [provideRouter([])]
    });

    cartState = TestBed.inject(CartStateService);
  });

  afterEach(() => {
    globalThis.sessionStorage.clear();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
  }

  it('shows an empty cart state', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Your cart is empty.');
  });

  it('renders saved cart items and display subtotal', () => {
    cartState.addItem('product-1', 2, {
      name: 'Coffee Beans',
      sku: 'COF-001',
      price: 12.5,
      currencyCode: 'USD',
      isActive: true
    });

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('COF-001');
    expect(fixture.nativeElement.textContent).toContain('$25.00');
  });

  it('links to checkout when the cart has items', () => {
    cartState.addItem('product-1', 1, {
      name: 'Coffee Beans'
    });
    createComponent();

    const checkoutLink = fixture.nativeElement.querySelector('.primary-link') as HTMLAnchorElement | null;

    expect(checkoutLink?.getAttribute('href')).toBe('/orders/checkout');
  });

  it('updates quantity from the quantity input', () => {
    cartState.addItem('product-1', 1, {
      name: 'Coffee Beans'
    });
    createComponent();

    const input = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;
    input.value = '4';
    input.dispatchEvent(new Event('change'));

    expect(cartState.items()[0]?.quantity).toBe(4);
  });

  it('removes and clears cart items', () => {
    cartState.addItem('product-1', 1, {
      name: 'Coffee Beans'
    });
    createComponent();

    fixture.componentInstance.removeItem('product-1');
    fixture.detectChanges();

    expect(cartState.items()).toEqual([]);

    cartState.addItem('product-1', 1, {
      name: 'Coffee Beans'
    });
    fixture.componentInstance.clearCart();

    expect(cartState.items()).toEqual([]);
  });
});
