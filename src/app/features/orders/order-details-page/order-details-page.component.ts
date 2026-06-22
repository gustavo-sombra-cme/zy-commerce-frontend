import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, merge, Observable, of, Subject, switchMap } from 'rxjs';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { OrdersApiClient } from '../data/orders-api.client';
import { OrderDetails } from '../data/orders.models';

type OrderDetailsViewModel =
  | {
    readonly status: 'loading';
    readonly orderId: string;
  }
  | {
    readonly status: 'loaded';
    readonly orderId: string;
    readonly order: OrderDetails;
  }
  | {
    readonly status: 'notFound';
    readonly orderId: string;
  }
  | {
    readonly status: 'error';
    readonly orderId: string;
    readonly message: string;
  };

@Component({
  selector: 'zy-order-details-page',
  imports: [CurrencyPipe, DatePipe, PageHeaderComponent, RouterLink],
  templateUrl: './order-details-page.component.html',
  styleUrl: './order-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailsPageComponent {
  private readonly ordersApi = inject(OrdersApiClient);
  private readonly route = inject(ActivatedRoute);
  private readonly reloadRequests = new Subject<void>();

  readonly currentOrderId = signal('');
  readonly viewModel = signal<OrderDetailsViewModel>({
    status: 'loading',
    orderId: ''
  });
  readonly order = computed(() => {
    const viewModel = this.viewModel();
    return viewModel.status === 'loaded' ? viewModel.order : null;
  });
  readonly errorMessage = computed(() => {
    const viewModel = this.viewModel();
    return viewModel.status === 'error' ? viewModel.message : null;
  });

  constructor() {
    const orderIdChanges$ = this.route.paramMap.pipe(
      map((paramMap) => paramMap.get('orderId')?.trim() ?? ''),
      distinctUntilChanged()
    );
    const reloads$ = this.reloadRequests.pipe(map(() => this.currentOrderId()));

    merge(orderIdChanges$, reloads$).pipe(
      switchMap((orderId) => this.loadOrder(orderId)),
      takeUntilDestroyed()
    ).subscribe((viewModel) => this.viewModel.set(viewModel));
  }

  retry(): void {
    this.reloadRequests.next();
  }

  displayOrderId(order: OrderDetails): string {
    return order.orderId ?? order.id ?? this.currentOrderId();
  }

  private loadOrder(orderId: string): Observable<OrderDetailsViewModel> {
    this.currentOrderId.set(orderId);

    if (!orderId) {
      return of({
        status: 'notFound',
        orderId
      });
    }

    this.viewModel.set({
      status: 'loading',
      orderId
    });

    return this.ordersApi.getOrderById(orderId).pipe(
      map((order) => ({
        status: 'loaded' as const,
        orderId,
        order
      })),
      catchError((error: unknown) => of(this.toErrorViewModel(orderId, error)))
    );
  }

  private toErrorViewModel(orderId: string, error: unknown): OrderDetailsViewModel {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return {
        status: 'notFound',
        orderId
      };
    }

    return {
      status: 'error',
      orderId,
      message: 'Order details could not be loaded. Please try again.'
    };
  }
}
