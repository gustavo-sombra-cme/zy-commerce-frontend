import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';

import { AuthSessionService } from './auth-session.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  it('redirects unauthenticated users to login with returnUrl', () => {
    const authSession = {
      hasAccessToken: () => false,
      user: signal(null),
      isAdmin: signal(false),
      ensureCurrentUser: vi.fn(),
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: authSession
        }
      ]
    });

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin/products' } as never));
    const router = TestBed.inject(Router);

    expect(router.serializeUrl(result as never)).toBe('/auth/login?returnUrl=%2Fadmin%2Fproducts');
  });

  it('allows loaded Admin users', () => {
    const authSession = {
      hasAccessToken: () => true,
      user: signal({ email: 'admin@example.com', role: 'Admin' }),
      isAdmin: signal(true),
      ensureCurrentUser: vi.fn(),
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: authSession
        }
      ]
    });

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin/products' } as never));

    expect(result).toBe(true);
    expect(authSession.ensureCurrentUser).not.toHaveBeenCalled();
  });

  it('blocks loaded Customer users without signing them out', () => {
    const authSession = {
      hasAccessToken: () => true,
      user: signal({ email: 'buyer@example.com', role: 'Customer' }),
      isAdmin: signal(false),
      ensureCurrentUser: vi.fn(),
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: authSession
        }
      ]
    });

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin/products' } as never));
    const router = TestBed.inject(Router);

    expect(router.serializeUrl(result as never)).toBe('/admin/access-denied');
    expect(authSession.logout).not.toHaveBeenCalled();
  });

  it('loads the current user before allowing a token-backed Admin route', async () => {
    const authSession = {
      hasAccessToken: () => true,
      user: signal(null),
      isAdmin: signal(true),
      ensureCurrentUser: vi.fn(() => of({ email: 'admin@example.com', role: 'Admin' })),
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: authSession
        }
      ]
    });

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, { url: '/admin/products' } as never));

    expect(isObservable(result)).toBe(true);
    await expect(firstValueFrom(result as never)).resolves.toBe(true);
    expect(authSession.ensureCurrentUser).toHaveBeenCalled();
  });
});
