import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, merge, Observable, of, Subject, switchMap, tap } from 'rxjs';

import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { CatalogApiClient } from '../../../catalog/data/catalog-api.client';
import { CatalogActiveFilter, CatalogProduct, CatalogProductsPage, CatalogProductsRequest } from '../../../catalog/data/catalog.models';
import { AdminProductsApiClient } from '../data/admin-products-api.client';

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

interface AdminProductsQueryState {
  readonly searchTerm: string;
  readonly activeFilter: CatalogActiveFilter;
  readonly pageNumber: number;
  readonly pageSize: number;
}

type AdminProductsViewModel =
  | {
    readonly status: 'loading';
    readonly query: AdminProductsQueryState;
  }
  | {
    readonly status: 'loaded';
    readonly query: AdminProductsQueryState;
    readonly page: CatalogProductsPage;
  }
  | {
    readonly status: 'error';
    readonly query: AdminProductsQueryState;
    readonly message: string;
  };

@Component({
  selector: 'zy-admin-products-page',
  imports: [CurrencyPipe, PageHeaderComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-products-page.component.html',
  styleUrl: './admin-products-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProductsPageComponent {
  private readonly catalogApi = inject(CatalogApiClient);
  private readonly adminProductsApi = inject(AdminProductsApiClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reloadRequests = new Subject<void>();

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeControl = new FormControl(DEFAULT_PAGE_SIZE, { nonNullable: true });
  readonly currentQuery = signal<AdminProductsQueryState>({
    searchTerm: '',
    activeFilter: 'all',
    pageNumber: DEFAULT_PAGE_NUMBER,
    pageSize: DEFAULT_PAGE_SIZE
  });
  readonly viewModel = signal<AdminProductsViewModel>({
    status: 'loading',
    query: this.currentQuery()
  });
  readonly actionMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly mutatingProductId = signal<string | null>(null);
  readonly loadedPage = computed(() => {
    const viewModel = this.viewModel();
    return viewModel.status === 'loaded' ? viewModel.page : null;
  });
  readonly errorMessage = computed(() => {
    const viewModel = this.viewModel();
    return viewModel.status === 'error' ? viewModel.message : null;
  });
  readonly firstVisibleItem = computed(() => {
    const page = this.loadedPage();

    if (!page || page.totalCount === 0) {
      return 0;
    }

    return ((page.pageNumber - 1) * page.pageSize) + 1;
  });
  readonly lastVisibleItem = computed(() => {
    const page = this.loadedPage();

    if (!page) {
      return 0;
    }

    return Math.min(page.pageNumber * page.pageSize, page.totalCount);
  });
  readonly canGoPrevious = computed(() => Boolean(this.loadedPage()?.hasPreviousPage));
  readonly canGoNext = computed(() => Boolean(this.loadedPage()?.hasNextPage));

  constructor() {
    const queryChanges$ = this.route.queryParamMap.pipe(
      tap((paramMap) => this.syncActionMessage(paramMap)),
      map((paramMap) => this.toAdminProductsQuery(paramMap)),
      distinctUntilChanged((previous, next) => this.sameQuery(previous, next)),
      tap((query) => this.syncControls(query))
    );

    const reloads$ = this.reloadRequests.pipe(map(() => this.currentQuery()));

    merge(queryChanges$, reloads$).pipe(
      switchMap((query) => this.loadProducts(query)),
      takeUntilDestroyed()
    ).subscribe((viewModel) => this.viewModel.set(viewModel));
  }

  applySearch(): void {
    this.navigateToQuery({
      ...this.currentQuery(),
      searchTerm: this.searchControl.value.trim(),
      pageNumber: DEFAULT_PAGE_NUMBER
    });
  }

  setActiveFilter(activeFilter: CatalogActiveFilter): void {
    this.navigateToQuery({
      ...this.currentQuery(),
      activeFilter,
      pageNumber: DEFAULT_PAGE_NUMBER
    });
  }

  setPageSize(): void {
    this.navigateToQuery({
      ...this.currentQuery(),
      pageNumber: DEFAULT_PAGE_NUMBER,
      pageSize: this.pageSizeControl.value
    });
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

  retry(): void {
    this.reloadRequests.next();
  }

  deactivate(product: CatalogProduct): void {
    if (!product.id || !window.confirm(`Deactivate ${product.name}?`)) {
      return;
    }

    this.runStatusMutation(product.id, this.adminProductsApi.deactivateProduct(product.id), 'Product deactivated.');
  }

  reactivate(product: CatalogProduct): void {
    if (!product.id || !window.confirm(`Reactivate ${product.name}?`)) {
      return;
    }

    this.runStatusMutation(product.id, this.adminProductsApi.reactivateProduct(product.id), 'Product reactivated.');
  }

  private loadProducts(query: AdminProductsQueryState): Observable<AdminProductsViewModel> {
    this.viewModel.set({
      status: 'loading',
      query
    });

    return this.catalogApi.getProducts(this.toRequest(query)).pipe(
      map((page) => ({
        status: 'loaded' as const,
        query,
        page
      })),
      catchError((error: unknown) => of({
        status: 'error' as const,
        query,
        message: this.toAdminMessage(error, 'Products could not be loaded. Please try again.')
      }))
    );
  }

  private runStatusMutation(productId: string, request: Observable<unknown>, successMessage: string): void {
    this.actionMessage.set(null);
    this.actionError.set(null);
    this.mutatingProductId.set(productId);

    request.subscribe({
      next: () => {
        this.actionMessage.set(successMessage);
        this.mutatingProductId.set(null);
        this.reloadRequests.next();
      },
      error: (error: unknown) => {
        this.actionError.set(this.toAdminMessage(error, 'Product status could not be updated. Please try again.'));
        this.mutatingProductId.set(null);
      }
    });
  }

  private syncControls(query: AdminProductsQueryState): void {
    this.currentQuery.set(query);
    this.searchControl.setValue(query.searchTerm, { emitEvent: false });
    this.pageSizeControl.setValue(query.pageSize, { emitEvent: false });
  }

  private syncActionMessage(paramMap: ParamMap): void {
    const adminStatus = paramMap.get('adminStatus');

    if (adminStatus === 'created') {
      this.actionMessage.set('Product created.');
    } else if (adminStatus === 'updated') {
      this.actionMessage.set('Product updated.');
    }
  }

  private navigateToQuery(query: AdminProductsQueryState): void {
    this.actionMessage.set(null);
    this.actionError.set(null);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toRouteQueryParams(query)
    });
  }

  private toAdminProductsQuery(paramMap: ParamMap): AdminProductsQueryState {
    return {
      searchTerm: paramMap.get('searchTerm')?.trim() ?? '',
      activeFilter: this.toActiveFilter(paramMap.get('isActive')),
      pageNumber: this.toPositiveInteger(paramMap.get('pageNumber'), DEFAULT_PAGE_NUMBER),
      pageSize: this.toAllowedPageSize(paramMap.get('pageSize'))
    };
  }

  private toRequest(query: AdminProductsQueryState): CatalogProductsRequest {
    const isActive = this.toIsActive(query.activeFilter);

    return {
      ...(query.searchTerm ? { searchTerm: query.searchTerm } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      pageNumber: query.pageNumber,
      pageSize: query.pageSize
    };
  }

  private toRouteQueryParams(query: AdminProductsQueryState): Params {
    const params: Params = {
      pageNumber: query.pageNumber,
      pageSize: query.pageSize
    };

    if (query.searchTerm) {
      params['searchTerm'] = query.searchTerm;
    }

    const isActive = this.toIsActive(query.activeFilter);

    if (isActive !== undefined) {
      params['isActive'] = isActive;
    }

    return params;
  }

  private toActiveFilter(value: string | null): CatalogActiveFilter {
    if (value === 'true') {
      return 'active';
    }

    if (value === 'false') {
      return 'inactive';
    }

    return 'all';
  }

  private toIsActive(activeFilter: CatalogActiveFilter): boolean | undefined {
    if (activeFilter === 'active') {
      return true;
    }

    if (activeFilter === 'inactive') {
      return false;
    }

    return undefined;
  }

  private toPositiveInteger(value: string | null, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private toAllowedPageSize(value: string | null): number {
    const parsed = this.toPositiveInteger(value, DEFAULT_PAGE_SIZE);
    return PAGE_SIZE_OPTIONS.includes(parsed as typeof PAGE_SIZE_OPTIONS[number]) ? parsed : DEFAULT_PAGE_SIZE;
  }

  private sameQuery(previous: AdminProductsQueryState, next: AdminProductsQueryState): boolean {
    return previous.searchTerm === next.searchTerm
      && previous.activeFilter === next.activeFilter
      && previous.pageNumber === next.pageNumber
      && previous.pageSize === next.pageSize;
  }

  private toAdminMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'Admin access required.';
    }

    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Your session is no longer valid. Please sign in again.';
    }

    return fallback;
  }
}
