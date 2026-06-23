import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { CreateProductRequest, UpdateProductDetailsRequest, UpdateProductPriceRequest } from './admin-products.models';

@Injectable({
  providedIn: 'root'
})
export class AdminProductsApiClient {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  createProduct(request: CreateProductRequest): Observable<unknown> {
    return this.http.post<unknown>(this.productsUrl(), request);
  }

  updateProductDetails(productId: string, request: UpdateProductDetailsRequest): Observable<unknown> {
    return this.http.put<unknown>(this.productUrl(productId), request);
  }

  updateProductPrice(productId: string, request: UpdateProductPriceRequest): Observable<unknown> {
    return this.http.put<unknown>(`${this.productUrl(productId)}/price`, request);
  }

  deactivateProduct(productId: string): Observable<unknown> {
    return this.http.delete<unknown>(this.productUrl(productId));
  }

  reactivateProduct(productId: string): Observable<unknown> {
    return this.http.post<unknown>(`${this.productUrl(productId)}/reactivate`, {});
  }

  private productsUrl(): string {
    return `${this.runtimeConfig.snapshot.apiBaseUrl}/api/catalog/products`;
  }

  private productUrl(productId: string): string {
    return `${this.productsUrl()}/${encodeURIComponent(productId)}`;
  }
}
