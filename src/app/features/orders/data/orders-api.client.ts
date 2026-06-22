import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from '../../../core/config/runtime-config.service';
import { CreateOrderRequest, OrderConfirmation, OrderDetails, OrdersPage } from './orders.models';

@Injectable({
  providedIn: 'root'
})
export class OrdersApiClient {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  createOrder(request: CreateOrderRequest): Observable<OrderConfirmation> {
    return this.http.post<OrderConfirmation>(`${this.runtimeConfig.snapshot.apiBaseUrl}/api/orders`, request);
  }

  listOrders(pageNumber: number, pageSize: number): Observable<OrdersPage> {
    return this.http.get<OrdersPage>(`${this.runtimeConfig.snapshot.apiBaseUrl}/api/orders`, {
      params: new HttpParams()
        .set('pageNumber', pageNumber)
        .set('pageSize', pageSize)
    });
  }

  getOrderById(orderId: string): Observable<OrderDetails> {
    return this.http.get<OrderDetails>(
      `${this.runtimeConfig.snapshot.apiBaseUrl}/api/orders/${encodeURIComponent(orderId)}`
    );
  }
}
