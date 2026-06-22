import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { correlationIdInterceptor } from './correlation-id.interceptor';

describe('correlationIdInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationIdInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('adds the configured correlation header to allowlisted catalog requests', () => {
    httpClient.get('http://localhost:5015/api/catalog/products').subscribe();

    const request = http.expectOne('http://localhost:5015/api/catalog/products');
    expect(request.request.headers.get('X-Correlation-ID')).toBeTruthy();
    request.flush({});
  });

  it('does not add correlation headers to non-allowlisted origins', () => {
    httpClient.get('https://example.test/api/catalog/products').subscribe();

    const request = http.expectOne('https://example.test/api/catalog/products');
    expect(request.request.headers.has('X-Correlation-ID')).toBe(false);
    request.flush({});
  });
});
