import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { RuntimeConfigService } from '../../../core/config/runtime-config.service';
import { CatalogProduct, CatalogProductDto, CatalogProductsPage, CatalogProductsPageDto, CatalogProductsRequest } from './catalog.models';

@Injectable({
  providedIn: 'root'
})
export class CatalogApiClient {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  getProducts(request: CatalogProductsRequest): Observable<CatalogProductsPage> {
    return this.http.get<CatalogProductsPageDto>(`${this.runtimeConfig.snapshot.apiBaseUrl}/api/catalog/products`, {
      params: this.toHttpParams(request)
    }).pipe(map((response) => this.normalizePage(response, request)));
  }

  getProduct(productId: string): Observable<CatalogProduct> {
    return this.http.get<CatalogProductDto>(
      `${this.runtimeConfig.snapshot.apiBaseUrl}/api/catalog/products/${encodeURIComponent(productId)}`
    ).pipe(map((product) => this.normalizeProduct(product)));
  }

  private toHttpParams(request: CatalogProductsRequest): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber)
      .set('pageSize', request.pageSize);

    const searchTerm = request.searchTerm?.trim();

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    if (typeof request.isActive === 'boolean') {
      params = params.set('isActive', request.isActive);
    }

    return params;
  }

  private normalizePage(response: CatalogProductsPageDto, request: CatalogProductsRequest): CatalogProductsPage {
    const items = (response.items ?? []).map((product) => this.normalizeProduct(product));
    const pageNumber = response.pageNumber ?? request.pageNumber;
    const pageSize = response.pageSize ?? request.pageSize;
    const totalCount = response.totalCount ?? items.length;
    const totalPages = response.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      items,
      pageNumber,
      pageSize,
      totalCount,
      totalPages,
      hasPreviousPage: response.hasPreviousPage ?? pageNumber > 1,
      hasNextPage: response.hasNextPage ?? pageNumber < totalPages
    };
  }

  private normalizeProduct(product: CatalogProductDto): CatalogProduct {
    return {
      id: product.id ?? product.productId ?? '',
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      currencyCode: product.currencyCode,
      imageUrl: product.imageUrl,
      isActive: product.isActive
    };
  }
}
