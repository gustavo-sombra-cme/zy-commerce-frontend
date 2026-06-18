import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TOKEN_STORAGE, TokenStorage } from '../auth/token-storage.provider';
import { authorizationInterceptor } from './authorization.interceptor';

describe('authorizationInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    const tokenStorage: TokenStorage = {
      getAccessToken: () => 'jwt-token',
      setAccessToken: vi.fn(),
      clearAccessToken: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authorizationInterceptor])),
        provideHttpClientTesting(),
        {
          provide: TOKEN_STORAGE,
          useValue: tokenStorage
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('attaches bearer tokens to allowlisted backend origins', () => {
    httpClient.get('http://localhost:5015/api/auth/users/me').subscribe();

    const request = http.expectOne('http://localhost:5015/api/auth/users/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({});
  });

  it('does not attach bearer tokens to non-allowlisted origins', () => {
    httpClient.get('https://example.test/api/auth/users/me').subscribe();

    const request = http.expectOne('https://example.test/api/auth/users/me');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
