import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, merge, Observable, of, Subject, switchMap } from 'rxjs';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { OrdersApiClient } from '../data/orders-api.client';
import { OrdersPage } from '../data/orders.models';

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 20;

interface OrdersQueryState {
  readonly pageNumber: number;
  readonly pageSize: number;
}

type OrdersViewModel =
  | {
    readonly status: 'loading';
    readonly query: OrdersQueryState;
  }
  | {
    readonly status: 'loaded';
    readonly query: OrdersQueryState;
    readonly page: OrdersPage;
  }
  | {
    readonly status: 'empty';
    readonly query: OrdersQueryState;
    readonly page: OrdersPage;
  }
  | {
    readonly status: 'error';
    readonly query: OrdersQueryState;
    readonly message: string;
  };

@Component({
  selector: 'zy-orders-page',
  imports: [CurrencyPipe, DatePipe, PageHeaderComponent, RouterLink],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent {
  private readonly ordersApi = inject(OrdersApiClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reloadRequests = new Subject<void>();

  readonly currentQuery = signal<OrdersQueryState>({
    pageNumber: DEFAULT_PAGE_NUMBER,
    pageSize: DEFAULT_PAGE_SIZE
  });
  readonly viewModel = signal<OrdersViewModel>({
    status: 'loading',
    query: this.currentQuery()
  });
  readonly ordersPage = computed(() => {
    const viewModel = this.viewModel();
    return viewModel.status === 'loaded' || viewModel.status === 'empty' ? viewModel.page : null;
  });
  readonly errorMessage = computed(() => {
    const viewModel = this.viewModel();
    return viewModel.status === 'error' ? viewModel.message : null;
  });
  readonly firstVisibleOrder = computed(() => {
    const page = this.ordersPage();

    if (!page || page.totalCount === 0) {
      return 0;
    }

    return ((page.pageNumber - 1) * page.pageSize) + 1;
  });
  readonly lastVisibleOrder = computed(() => {
    const page = this.ordersPage();

    if (!page) {
      return 0;
    }

    return Math.min(page.pageNumber * page.pageSize, page.totalCount);
  });
  readonly canGoPrevious = computed(() => Boolean(this.ordersPage()?.hasPreviousPage));
  readonly canGoNext = computed(() => Boolean(this.ordersPage()?.hasNextPage));

  constructor() {
    const queryChanges$ = this.route.queryParamMap.pipe(
      map((paramMap) => this.toOrdersQuery(paramMap)),
      distinctUntilChanged((previous, next) => this.sameQuery(previous, next))
    );
    const reloads$ = this.reloadRequests.pipe(map(() => this.currentQuery()));

    merge(queryChanges$, reloads$).pipe(
      switchMap((query) => this.loadOrders(query)),
      takeUntilDestroyed()
    ).subscribe((viewModel) => this.viewModel.set(viewModel));
  }

  retry(): void {
    this.reloadRequests.next();
  }

  goToPreviousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.navigateToQuery({
      ...this.currentQuery(),
      pageNumber: this.currentQuery().pageNumber - 1
    });
  }

  goToNextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.navigateToQuery({
      ...this.currentQuery(),
      pageNumber: this.currentQuery().pageNumber + 1
    });
  }

  private loadOrders(query: OrdersQueryState): Observable<OrdersViewModel> {
    this.currentQuery.set(query);
    this.viewModel.set({
      status: 'loading',
      query
    });

    return this.ordersApi.listOrders(query.pageNumber, query.pageSize).pipe(
      map((page) => ({
        status: page.items.length > 0 ? 'loaded' as const : 'empty' as const,
        query,
        page
      })),
      catchError(() => of({
        status: 'error' as const,
        query,
        message: 'Orders could not be loaded. Please try again.'
      }))
    );
  }

  private navigateToQuery(query: OrdersQueryState): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toRouteQueryParams(query)
    });
  }

  private toOrdersQuery(paramMap: ParamMap): OrdersQueryState {
    return {
      pageNumber: this.toPositiveInteger(paramMap.get('pageNumber'), DEFAULT_PAGE_NUMBER),
      pageSize: this.toPositiveInteger(paramMap.get('pageSize'), DEFAULT_PAGE_SIZE)
    };
  }

  private toRouteQueryParams(query: OrdersQueryState): Params {
    return {
      pageNumber: query.pageNumber,
      pageSize: query.pageSize
    };
  }

  private toPositiveInteger(value: string | null, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private sameQuery(previous: OrdersQueryState, next: OrdersQueryState): boolean {
    return previous.pageNumber === next.pageNumber && previous.pageSize === next.pageSize;
  }
}
