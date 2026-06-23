import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { AuthApiClient } from './auth-api.client';
import { AuthSessionService } from './auth-session.service';
import { TOKEN_STORAGE, TokenStorage } from './token-storage.provider';

describe('AuthSessionService', () => {
  let accessToken: string | null;
  let authApi: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    accessToken = null;
    authApi = {
      login: vi.fn(),
      register: vi.fn(),
      getCurrentUser: vi.fn()
    };

    const tokenStorage: TokenStorage = {
      getAccessToken: () => accessToken,
      setAccessToken: (token) => {
        accessToken = token;
      },
      clearAccessToken: () => {
        accessToken = null;
      }
    };

    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        {
          provide: AuthApiClient,
          useValue: authApi
        },
        {
          provide: TOKEN_STORAGE,
          useValue: tokenStorage
        }
      ]
    });
  });

  it('stores the login access token and loads the current user', async () => {
    authApi.login.mockReturnValue(of({ accessToken: 'jwt-token' }));
    authApi.getCurrentUser.mockReturnValue(of({ userId: 'user-1', email: 'buyer@example.com', role: 'Customer' }));

    const service = TestBed.inject(AuthSessionService);
    const user = await firstValueFrom(service.login({ email: 'buyer@example.com', password: 'secret-password' }));

    expect(accessToken).toBe('jwt-token');
    expect(user.email).toBe('buyer@example.com');
    expect(service.user()?.email).toBe('buyer@example.com');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(false);
  });

  it('exposes an Admin helper after loading the current user', async () => {
    accessToken = 'jwt-token';
    authApi.getCurrentUser.mockReturnValue(of({ userId: 'admin-1', email: 'admin@example.com', role: 'Admin' }));

    const service = TestBed.inject(AuthSessionService);
    await firstValueFrom(service.loadCurrentUser());

    expect(service.isAdmin()).toBe(true);
  });

  it('does not store a token or load current user after registration', async () => {
    authApi.register.mockReturnValue(of({ id: 'user-1', email: 'buyer@example.com' }));

    const service = TestBed.inject(AuthSessionService);
    await firstValueFrom(service.register({
      email: 'buyer@example.com',
      password: 'secret-password',
      displayName: 'Buyer'
    }));

    expect(accessToken).toBeNull();
    expect(authApi.getCurrentUser).not.toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears the session when current user loading is unauthorized', async () => {
    accessToken = 'expired-token';
    authApi.getCurrentUser.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    const service = TestBed.inject(AuthSessionService);

    await expect(firstValueFrom(service.loadCurrentUser())).rejects.toBeTruthy();
    expect(accessToken).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears the stored token on logout', () => {
    accessToken = 'jwt-token';

    const service = TestBed.inject(AuthSessionService);
    service.logout();

    expect(accessToken).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
