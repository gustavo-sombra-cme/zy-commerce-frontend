import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CatalogApiClient } from './catalog-api.client';

describe('CatalogApiClient', () => {
  let client: CatalogApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    client = TestBed.inject(CatalogApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('gets products with approved catalog query params', () => {
    client.getProducts({
      searchTerm: 'coffee',
      isActive: true,
      pageNumber: 2,
      pageSize: 24
    }).subscribe((page) => {
      expect(page.totalCount).toBe(1);
      expect(page.hasPreviousPage).toBe(true);
      expect(page.hasNextPage).toBe(false);
      expect(page.items[0]?.id).toBe('product-1');
      expect(page.items[0]?.name).toBe('Coffee Beans');
    });

    const request = http.expectOne((candidate) => candidate.url === 'http://localhost:5015/api/catalog/products');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('searchTerm')).toBe('coffee');
    expect(request.request.params.get('isActive')).toBe('true');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('24');
    expect(request.request.urlWithParams).toContain('searchTerm=coffee');
    expect(request.request.urlWithParams).toContain('isActive=true');
    expect(request.request.urlWithParams).toContain('pageNumber=2');
    expect(request.request.urlWithParams).toContain('pageSize=24');

    request.flush({
      items: [
        {
          productId: 'product-1',
          name: 'Coffee Beans',
          price: 12.5,
          isActive: true
        }
      ],
      pageNumber: 2,
      pageSize: 24,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: true,
      hasNextPage: false
    });
  });

  it('trims search terms and preserves inactive filters in catalog query params', () => {
    client.getProducts({
      searchTerm: '  tea  ',
      isActive: false,
      pageNumber: 1,
      pageSize: 12
    }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === 'http://localhost:5015/api/catalog/products');

    expect(request.request.params.get('searchTerm')).toBe('tea');
    expect(request.request.params.get('isActive')).toBe('false');
    expect(request.request.params.get('pageNumber')).toBe('1');
    expect(request.request.params.get('pageSize')).toBe('12');
    expect(request.request.urlWithParams).toContain('searchTerm=tea');
    expect(request.request.urlWithParams).toContain('isActive=false');

    request.flush({
      items: [],
      pageNumber: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    });
  });

  it('omits optional search and active params when not provided', () => {
    client.getProducts({
      pageNumber: 1,
      pageSize: 12
    }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === 'http://localhost:5015/api/catalog/products');

    expect(request.request.params.has('searchTerm')).toBe(false);
    expect(request.request.params.has('isActive')).toBe(false);
    expect(request.request.params.get('pageNumber')).toBe('1');
    expect(request.request.params.get('pageSize')).toBe('12');
    expect(request.request.urlWithParams).not.toContain('searchTerm=');
    expect(request.request.urlWithParams).not.toContain('isActive=');

    request.flush({
      items: [],
      pageNumber: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    });
  });

  it('omits blank search terms while preserving inactive catalog filters', () => {
    client.getProducts({
      searchTerm: '   ',
      isActive: false,
      pageNumber: 1,
      pageSize: 12
    }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === 'http://localhost:5015/api/catalog/products');

    expect(request.request.params.has('searchTerm')).toBe(false);
    expect(request.request.params.get('isActive')).toBe('false');
    expect(request.request.urlWithParams).not.toContain('searchTerm=');
    expect(request.request.urlWithParams).toContain('isActive=false');

    request.flush({
      items: [],
      pageNumber: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    });
  });

  it('gets a single product by ID', () => {
    client.getProduct('product 1').subscribe((product) => {
      expect(product.name).toBe('Coffee Beans');
      expect(product.id).toBe('product 1');
    });

    const request = http.expectOne('http://localhost:5015/api/catalog/products/product%201');

    expect(request.request.method).toBe('GET');
    request.flush({
      productId: 'product 1',
      name: 'Coffee Beans',
      price: 12.5,
      isActive: true
    });
  });
});
