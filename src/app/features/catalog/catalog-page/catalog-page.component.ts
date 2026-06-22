import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, merge, Observable, of, Subject, switchMap, tap } from 'rxjs';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { CartStateService } from '../../cart/data/cart-state.service';
import { CatalogApiClient } from '../data/catalog-api.client';
import { CatalogActiveFilter, CatalogProduct, CatalogProductsPage, CatalogProductsRequest } from '../data/catalog.models';

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

interface CatalogQueryState {
  readonly searchTerm: string;
  readonly activeFilter: CatalogActiveFilter;
  readonly pageNumber: number;
  readonly pageSize: number;
}

type CatalogViewModel =
  | {
    readonly status: 'loading';
    readonly query: CatalogQueryState;
  }
  | {
    readonly status: 'loaded';
    readonly query: CatalogQueryState;
    readonly page: CatalogProductsPage;
  }
  | {
    readonly status: 'error';
    readonly query: CatalogQueryState;
    readonly message: string;
  };

@Component({
  selector: 'zy-catalog-page',
  imports: [CurrencyPipe, PageHeaderComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent {
  private readonly catalogApi = inject(CatalogApiClient);
  private readonly cartState = inject(CartStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reloadRequests = new Subject<void>();

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeControl = new FormControl(DEFAULT_PAGE_SIZE, { nonNullable: true });
  readonly lastAddedProductId = signal<string | null>(null);
  readonly currentQuery = signal<CatalogQueryState>({
    searchTerm: '',
    activeFilter: 'all',
    pageNumber: DEFAULT_PAGE_NUMBER,
    pageSize: DEFAULT_PAGE_SIZE
  });
  readonly viewModel = signal<CatalogViewModel>({
    status: 'loading',
    query: this.currentQuery()
  });
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
  readonly canGoPrevious = computed(() => {
    const page = this.loadedPage();
    return Boolean(page?.hasPreviousPage);
  });
  readonly canGoNext = computed(() => {
    const page = this.loadedPage();
    return Boolean(page?.hasNextPage);
  });

  constructor() {
    const queryChanges$ = this.route.queryParamMap.pipe(
      map((paramMap) => this.toCatalogQuery(paramMap)),
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
    const searchTerm = this.searchControl.value.trim();

    console.debug('[catalog]', {
      action: 'catalog.search.submit',
      searchTerm,
      searchTermLength: searchTerm.length,
      pageNumber: DEFAULT_PAGE_NUMBER,
      pageSize: this.currentQuery().pageSize,
      activeFilter: this.currentQuery().activeFilter
    });

    this.navigateToQuery({
      ...this.currentQuery(),
      searchTerm,
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

  productInitial(product: CatalogProduct): string {
    return product.name.trim().charAt(0).toUpperCase() || 'P';
  }

  addToCart(product: CatalogProduct): void {
    if (!product.id.trim()) {
      return;
    }

    this.cartState.addProduct(product);
    this.lastAddedProductId.set(product.id);
  }

  private loadProducts(query: CatalogQueryState): Observable<CatalogViewModel> {
    this.viewModel.set({
      status: 'loading',
      query
    });

    const request = this.toRequest(query);

    console.debug('[catalog]', {
      action: 'catalog.search.loadProducts',
      searchTerm: request.searchTerm ?? '',
      searchTermLength: request.searchTerm?.length ?? 0,
      isActive: request.isActive,
      pageNumber: request.pageNumber,
      pageSize: request.pageSize
    });

    return this.catalogApi.getProducts(request).pipe(
      map((page) => ({
        status: 'loaded' as const,
        query,
        page
      })),
      catchError(() => of({
        status: 'error' as const,
        query,
        message: 'Products could not be loaded. Please try again.'
      }))
    );
  }

  private syncControls(query: CatalogQueryState): void {
    this.currentQuery.set(query);
    this.searchControl.setValue(query.searchTerm, { emitEvent: false });
    this.pageSizeControl.setValue(query.pageSize, { emitEvent: false });
  }

  private navigateToQuery(query: CatalogQueryState): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toRouteQueryParams(query)
    });
  }

  private toCatalogQuery(paramMap: ParamMap): CatalogQueryState {
    return {
      searchTerm: paramMap.get('searchTerm')?.trim() ?? '',
      activeFilter: this.toActiveFilter(paramMap.get('isActive')),
      pageNumber: this.toPositiveInteger(paramMap.get('pageNumber'), DEFAULT_PAGE_NUMBER),
      pageSize: this.toAllowedPageSize(paramMap.get('pageSize'))
    };
  }

  private toRequest(query: CatalogQueryState): CatalogProductsRequest {
    const isActive = this.toIsActive(query.activeFilter);

    return {
      ...(query.searchTerm ? { searchTerm: query.searchTerm } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      pageNumber: query.pageNumber,
      pageSize: query.pageSize
    };
  }

  private toRouteQueryParams(query: CatalogQueryState): Params {
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

  private sameQuery(previous: CatalogQueryState, next: CatalogQueryState): boolean {
    return previous.searchTerm === next.searchTerm
      && previous.activeFilter === next.activeFilter
      && previous.pageNumber === next.pageNumber
      && previous.pageSize === next.pageSize;
  }
}
