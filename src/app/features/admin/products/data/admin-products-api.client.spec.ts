import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AdminProductsApiClient } from './admin-products-api.client';

describe('AdminProductsApiClient', () => {
  let client: AdminProductsApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    client = TestBed.inject(AdminProductsApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('posts create product requests to the catalog products endpoint', () => {
    const body = {
      sku: 'COF-001',
      name: 'Coffee Beans',
      description: 'Whole bean coffee',
      price: 12.5
    };

    client.createProduct(body).subscribe();

    const request = http.expectOne('http://localhost:5015/api/catalog/products');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({});
  });

  it('puts update details requests to the product endpoint', () => {
    client.updateProductDetails('product 1', {
      name: 'Coffee Beans',
      description: 'Updated description'
    }).subscribe();

    const request = http.expectOne('http://localhost:5015/api/catalog/products/product%201');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      name: 'Coffee Beans',
      description: 'Updated description'
    });
    request.flush({});
  });

  it('puts price updates with only the price body', () => {
    client.updateProductPrice('product 1', { price: 19.99 }).subscribe();

    const request = http.expectOne('http://localhost:5015/api/catalog/products/product%201/price');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ price: 19.99 });
    expect(request.request.body).not.toHaveProperty('currencyCode');
    request.flush({});
  });

  it('deletes products through the deactivate endpoint', () => {
    client.deactivateProduct('product 1').subscribe();

    const request = http.expectOne('http://localhost:5015/api/catalog/products/product%201');
    expect(request.request.method).toBe('DELETE');
    request.flush({});
  });

  it('posts to the reactivate endpoint', () => {
    client.reactivateProduct('product 1').subscribe();

    const request = http.expectOne('http://localhost:5015/api/catalog/products/product%201/reactivate');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({});
  });
});
