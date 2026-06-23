import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AuthSessionService } from '../../auth/auth-session.service';
import { CartStateService } from '../../../features/cart/data/cart-state.service';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let cartState: CartStateService;

  function createComponent(isAdmin = false): void {
    globalThis.sessionStorage.clear();

    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            user: signal({
              email: 'buyer@example.com'
            }),
            isAdmin: signal(isAdmin),
            logout: vi.fn()
          }
        }
      ]
    });

    cartState = TestBed.inject(CartStateService);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    globalThis.sessionStorage.clear();
  });

  it('updates the shell cart count when the real cart state changes', () => {
    createComponent();

    expect(fixture.nativeElement.querySelector('.nav-count')?.textContent).toContain('0');

    cartState.addItem('product-1', 2, {
      name: 'Coffee Beans'
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.nav-count')?.textContent).toContain('2');
  });

  it('shows the Admin nav link for Admin users', () => {
    createComponent(true);

    expect(fixture.nativeElement.textContent).toContain('Admin');
    expect(fixture.nativeElement.querySelector('a[href="/admin/products"]')).toBeTruthy();
  });

  it('hides the Admin nav link for Customer users', () => {
    createComponent(false);

    expect(fixture.nativeElement.querySelector('a[href="/admin/products"]')).toBeNull();
  });
});
