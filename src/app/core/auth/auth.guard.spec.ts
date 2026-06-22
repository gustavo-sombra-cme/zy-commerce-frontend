import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';

import { AuthSessionService } from './auth-session.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('redirects to login with returnUrl when no token exists', () => {
    const authSession = {
      hasAccessToken: () => false,
      user: signal(null),
      ensureCurrentUser: vi.fn()
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

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/orders' } as never));
    const router = TestBed.inject(Router);

    expect(router.serializeUrl(result as never)).toBe('/auth/login?returnUrl=%2Forders');
  });

  it('loads the current user before allowing a token-backed route', async () => {
    const authSession = {
      hasAccessToken: () => true,
      user: signal(null),
      ensureCurrentUser: vi.fn(() => of({ id: 'user-1', email: 'buyer@example.com' }))
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

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/catalog' } as never));

    expect(isObservable(result)).toBe(true);
    await expect(firstValueFrom(result as never)).resolves.toBe(true);
    expect(authSession.ensureCurrentUser).toHaveBeenCalled();
  });
});
