import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, map, Observable, of, Subject, switchMap } from 'rxjs';

import { McpHttpClientService } from '../../../mcp/mcp-http-client.service';
import {
  CATALOG_GET_PRODUCT_BY_ID_TOOL,
  CATALOG_SEARCH_PRODUCTS_TOOL,
  CatalogGetProductByIdInput,
  CatalogSearchProductsInput,
  isApprovedReadonlyCatalogTool,
  McpCatalogProductDetails,
  McpCatalogProductsPage,
  McpCatalogProductSummary
} from '../../../mcp/mcp-catalog.models';
import {
  McpOrderDetails,
  ORDERS_GET_ORDER_BY_ID_TOOL,
  OrdersGetOrderByIdInput,
  isApprovedReadonlyOrderTool
} from '../../../mcp/mcp-order.models';
import { McpToolDefinition } from '../../../mcp/mcp-tool.model';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

type AssistantView = 'catalog' | 'orders';

type SearchViewModel =
  | {
    readonly status: 'idle';
  }
  | {
    readonly status: 'loading';
  }
  | {
    readonly status: 'loaded';
    readonly page: McpCatalogProductsPage;
  }
  | {
    readonly status: 'empty';
    readonly page: McpCatalogProductsPage;
  }
  | {
    readonly status: 'error';
    readonly message: string;
  };

type DetailViewModel =
  | {
    readonly status: 'idle';
  }
  | {
    readonly status: 'loading';
    readonly productId: string;
  }
  | {
    readonly status: 'loaded';
    readonly product: McpCatalogProductDetails;
  }
  | {
    readonly status: 'error';
    readonly productId: string;
    readonly message: string;
  };

type OrderLookupViewModel =
  | {
    readonly status: 'idle';
  }
  | {
    readonly status: 'loading';
    readonly orderId: string;
  }
  | {
    readonly status: 'loaded';
    readonly order: McpOrderDetails;
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
  selector: 'zy-mcp-assistant-page',
  imports: [CurrencyPipe, DatePipe, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './mcp-assistant-page.component.html',
  styleUrl: './mcp-assistant-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class McpAssistantPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mcpClient = inject(McpHttpClientService);
  private readonly searchRequests = new Subject<number>();

  readonly activeView = signal<AssistantView>('catalog');
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly orderIdControl = new FormControl('', { nonNullable: true });
  readonly approvedCatalogTools = signal<readonly McpToolDefinition[]>([]);
  readonly approvedOrderTools = signal<readonly McpToolDefinition[]>([]);
  readonly toolsStatus = signal<'loading' | 'loaded' | 'error'>('loading');
  readonly toolsErrorMessage = signal<string | null>(null);
  readonly currentPageNumber = signal(DEFAULT_PAGE_NUMBER);
  readonly searchViewModel = signal<SearchViewModel>({
    status: 'idle'
  });
  readonly detailViewModel = signal<DetailViewModel>({
    status: 'idle'
  });
  readonly orderLookupViewModel = signal<OrderLookupViewModel>({
    status: 'idle'
  });
  readonly searchPage = computed(() => {
    const viewModel = this.searchViewModel();
    return viewModel.status === 'loaded' || viewModel.status === 'empty' ? viewModel.page : null;
  });
  readonly searchErrorMessage = computed(() => {
    const viewModel = this.searchViewModel();
    return viewModel.status === 'error' ? viewModel.message : null;
  });
  readonly detailErrorMessage = computed(() => {
    const viewModel = this.detailViewModel();
    return viewModel.status === 'error' ? viewModel.message : null;
  });
  readonly selectedProduct = computed(() => {
    const viewModel = this.detailViewModel();
    return viewModel.status === 'loaded' ? viewModel.product : null;
  });
  readonly selectedOrder = computed(() => {
    const viewModel = this.orderLookupViewModel();
    return viewModel.status === 'loaded' ? viewModel.order : null;
  });
  readonly orderLookupErrorMessage = computed(() => {
    const viewModel = this.orderLookupViewModel();
    return viewModel.status === 'error' ? viewModel.message : null;
  });
  readonly hasOrderLookupTool = computed(() => {
    const toolNames = this.approvedOrderTools().map((tool) => tool.name);
    return toolNames.includes(ORDERS_GET_ORDER_BY_ID_TOOL);
  });
  readonly hasCatalogTools = computed(() => {
    const toolNames = this.approvedCatalogTools().map((tool) => tool.name);
    return toolNames.includes(CATALOG_SEARCH_PRODUCTS_TOOL) && toolNames.includes(CATALOG_GET_PRODUCT_BY_ID_TOOL);
  });
  readonly canSearch = computed(() => this.toolsStatus() === 'loaded'
    && this.hasCatalogTools()
    && this.searchViewModel().status !== 'loading');
  readonly canLookupOrder = computed(() => this.toolsStatus() === 'loaded'
    && this.hasOrderLookupTool()
    && this.orderLookupViewModel().status !== 'loading');
  readonly canGoPrevious = computed(() => Boolean(this.searchPage()?.hasPreviousPage));
  readonly canGoNext = computed(() => Boolean(this.searchPage()?.hasNextPage));
  readonly firstVisibleItem = computed(() => {
    const page = this.searchPage();

    if (!page || page.totalCount === 0) {
      return 0;
    }

    return ((page.pageNumber - 1) * page.pageSize) + 1;
  });
  readonly lastVisibleItem = computed(() => {
    const page = this.searchPage();

    if (!page) {
      return 0;
    }

    return Math.min(page.pageNumber * page.pageSize, page.totalCount);
  });

  constructor() {
    this.loadTools();

    this.searchRequests.pipe(
      switchMap((pageNumber) => this.runSearch(pageNumber)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((viewModel) => this.searchViewModel.set(viewModel));
  }

  setActiveView(view: AssistantView): void {
    this.activeView.set(view);
  }

  search(): void {
    if (!this.canSearch()) {
      return;
    }

    this.detailViewModel.set({ status: 'idle' });
    this.searchRequests.next(DEFAULT_PAGE_NUMBER);
  }

  retrySearch(): void {
    if (!this.canSearch()) {
      return;
    }

    this.searchRequests.next(this.currentPageNumber());
  }

  goToPreviousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.searchRequests.next(this.currentPageNumber() - 1);
  }

  goToNextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.searchRequests.next(this.currentPageNumber() + 1);
  }

  selectProduct(product: McpCatalogProductSummary): void {
    this.detailViewModel.set({
      status: 'loading',
      productId: product.productId
    });

    this.mcpClient.callTool<CatalogGetProductByIdInput, McpCatalogProductDetails>({
      toolName: CATALOG_GET_PRODUCT_BY_ID_TOOL,
      input: {
        productId: product.productId
      }
    }).pipe(
      map((result) => ({
        status: 'loaded' as const,
        product: result.content
      })),
      catchError(() => of({
        status: 'error' as const,
        productId: product.productId,
        message: 'Product details could not be loaded through MCP. Please try again.'
      })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((viewModel) => this.detailViewModel.set(viewModel));
  }

  retryDetails(): void {
    const viewModel = this.detailViewModel();

    if (viewModel.status !== 'error') {
      return;
    }

    this.selectProduct({
      productId: viewModel.productId,
      sku: '',
      name: 'Product',
      description: null,
      isActive: true,
      createdAt: ''
    });
  }

  lookupOrder(): void {
    const orderId = this.orderIdControl.value.trim();

    if (!orderId || !this.canLookupOrder()) {
      return;
    }

    this.orderLookupViewModel.set({
      status: 'loading',
      orderId
    });

    this.mcpClient.callTool<OrdersGetOrderByIdInput, McpOrderDetails>({
      toolName: ORDERS_GET_ORDER_BY_ID_TOOL,
      input: {
        orderId
      }
    }).pipe(
      map((result) => ({
        status: 'loaded' as const,
        order: result.content
      })),
      catchError((error: unknown) => of(this.toOrderLookupErrorViewModel(orderId, error))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((viewModel) => this.orderLookupViewModel.set(viewModel));
  }

  retryOrderLookup(): void {
    const viewModel = this.orderLookupViewModel();

    if (viewModel.status !== 'error' && viewModel.status !== 'notFound') {
      return;
    }

    this.orderIdControl.setValue(viewModel.orderId, { emitEvent: false });
    this.lookupOrder();
  }

  private loadTools(): void {
    this.toolsStatus.set('loading');
    this.toolsErrorMessage.set(null);

    this.mcpClient.listTools().pipe(
      map((tools) => ({
        catalogTools: tools.filter((tool) => !tool.mutating && isApprovedReadonlyCatalogTool(tool.name)),
        orderTools: tools.filter((tool) => !tool.mutating && isApprovedReadonlyOrderTool(tool.name))
      })),
      catchError(() => {
        this.toolsErrorMessage.set('MCP assistant tools could not be loaded. Please try again.');
        return of({
          catalogTools: [],
          orderTools: []
        });
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ catalogTools, orderTools }) => {
      this.approvedCatalogTools.set(catalogTools);
      this.approvedOrderTools.set(orderTools);
      this.toolsStatus.set(catalogTools.length > 0 || orderTools.length > 0 ? 'loaded' : 'error');
    });
  }

  private runSearch(pageNumber: number): Observable<SearchViewModel> {
    const searchTerm = this.searchControl.value.trim();
    this.currentPageNumber.set(pageNumber);
    this.searchViewModel.set({ status: 'loading' });

    return this.mcpClient.callTool<CatalogSearchProductsInput, McpCatalogProductsPage>({
      toolName: CATALOG_SEARCH_PRODUCTS_TOOL,
      input: {
        searchTerm: searchTerm || null,
        isActive: true,
        pageNumber,
        pageSize: DEFAULT_PAGE_SIZE
      }
    }).pipe(
      map((result) => ({
        status: result.content.items.length > 0 ? 'loaded' as const : 'empty' as const,
        page: result.content
      })),
      catchError(() => of({
        status: 'error' as const,
        message: 'Catalog search could not be completed through MCP. Please try again.'
      }))
    );
  }

  private toOrderLookupErrorViewModel(orderId: string, error: unknown): OrderLookupViewModel {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return {
        status: 'notFound',
        orderId
      };
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';

    if (message.includes('not found') || message.includes('404')) {
      return {
        status: 'notFound',
        orderId
      };
    }

    return {
      status: 'error',
      orderId,
      message: 'Order lookup could not be completed through MCP. Please try again.'
    };
  }
}
