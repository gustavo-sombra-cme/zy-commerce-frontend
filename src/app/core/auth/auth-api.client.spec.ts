import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthApiClient } from './auth-api.client';

describe('AuthApiClient', () => {
  let client: AuthApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    client = TestBed.inject(AuthApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('posts login requests to the backend auth users login route', () => {
    client.login({ email: 'buyer@example.com', password: 'secret-password' }).subscribe();

    const request = http.expectOne('http://localhost:5015/api/auth/users/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'buyer@example.com',
      password: 'secret-password'
    });
    request.flush({ accessToken: 'jwt' });
  });

  it('posts register requests to the backend auth users register route', () => {
    client.register({ email: 'buyer@example.com', password: 'secret-password', displayName: 'Buyer' }).subscribe();

    const request = http.expectOne('http://localhost:5015/api/auth/users/register');
    expect(request.request.method).toBe('POST');
    request.flush({ id: 'user-1', email: 'buyer@example.com' });
  });

  it('loads the current user from the backend auth users me route', () => {
    client.getCurrentUser().subscribe();

    const request = http.expectOne('http://localhost:5015/api/auth/users/me');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'user-1', email: 'buyer@example.com' });
  });
});
