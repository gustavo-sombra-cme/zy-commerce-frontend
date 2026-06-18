import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import {
  CATALOG_GET_PRODUCT_BY_ID_TOOL,
  CATALOG_SEARCH_PRODUCTS_TOOL,
  McpCatalogProductDetails,
  McpCatalogProductsPage
} from '../../../mcp/mcp-catalog.models';
import { McpHttpClientService } from '../../../mcp/mcp-http-client.service';
import { McpOrderDetails, ORDERS_GET_ORDER_BY_ID_TOOL } from '../../../mcp/mcp-order.models';
import { McpToolDefinition } from '../../../mcp/mcp-tool.model';
import { McpAssistantPageComponent } from './mcp-assistant-page.component';

describe('McpAssistantPageComponent', () => {
  let fixture: ComponentFixture<McpAssistantPageComponent>;
  let mcpClient: {
    listTools: ReturnType<typeof vi.fn>;
    callTool: ReturnType<typeof vi.fn>;
  };

  const mcpUrl = 'http://localhost:5015/mcp';
  const approvedTools: readonly McpToolDefinition[] = [
    {
      name: CATALOG_SEARCH_PRODUCTS_TOOL,
      title: 'Search Catalog Products',
      description: 'Searches catalog products.',
      domain: 'catalog',
      mutating: false,
      requiresConfirmation: false
    },
    {
      name: CATALOG_GET_PRODUCT_BY_ID_TOOL,
      title: 'Get Catalog Product By Id',
      description: 'Gets product details.',
      domain: 'catalog',
      mutating: false,
      requiresConfirmation: false
    },
    {
      name: ORDERS_GET_ORDER_BY_ID_TOOL,
      title: 'Get Order By Id',
      description: 'Gets an order.',
      domain: 'orders',
      mutating: false,
      requiresConfirmation: false
    }
  ];
  const productsPage: McpCatalogProductsPage = {
    items: [
      {
        productId: 'product-1',
        sku: 'COF-001',
        name: 'Coffee Beans',
        description: 'Whole bean coffee',
        isActive: true,
        createdAt: '2026-06-17T09:00:00.000Z'
      }
    ],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  };
  const productDetails: McpCatalogProductDetails = {
    productId: 'product-1',
    sku: 'COF-001',
    name: 'Coffee Beans',
    description: 'Whole bean coffee',
    isActive: true,
    createdAt: '2026-06-17T09:00:00.000Z',
    updatedAt: '2026-06-17T10:00:00.000Z'
  };
  const orderDetails: McpOrderDetails = {
    orderId: 'order-1',
    buyerId: 'buyer-1',
    status: 'Created',
    totalAmount: 25,
    createdAt: '2026-06-17T09:00:00.000Z',
    lines: [
      {
        orderLineId: 'line-1',
        productId: 'product-1',
        productSku: 'COF-001',
        productName: 'Coffee Beans',
        unitPrice: 12.5,
        quantity: 2,
        lineTotal: 25
      }
    ]
  };
  const toolsListResult = {
    tools: [
      {
        name: CATALOG_SEARCH_PRODUCTS_TOOL,
        title: 'Search Catalog Products',
        description: 'Searches catalog products.',
        annotations: {
          readOnlyHint: true
        }
      },
      {
        name: CATALOG_GET_PRODUCT_BY_ID_TOOL,
        title: 'Get Catalog Product By Id',
        description: 'Gets product details.',
        annotations: {
          readOnlyHint: true
        }
      },
      {
        name: ORDERS_GET_ORDER_BY_ID_TOOL,
        title: 'Get Order By Id',
        description: 'Gets an order.',
        annotations: {
          readOnlyHint: true
        }
      }
    ]
  };

  function sseRpcResult(result: unknown, id = 1): string {
    return `event: message\ndata: ${JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    })}\n\n`;
  }

  function createComponent(options?: {
    readonly tools?: readonly McpToolDefinition[];
    readonly searchPage?: McpCatalogProductsPage;
    readonly callTool?: ReturnType<typeof vi.fn>;
  }): void {
    mcpClient = {
      listTools: vi.fn(() => of(options?.tools ?? approvedTools)),
      callTool: options?.callTool ?? vi.fn(() => of({ content: options?.searchPage ?? productsPage }))
    };

    TestBed.configureTestingModule({
      imports: [McpAssistantPageComponent],
      providers: [
        {
          provide: McpHttpClientService,
          useValue: mcpClient
        }
      ]
    });

    fixture = TestBed.createComponent(McpAssistantPageComponent);
    fixture.detectChanges();
  }

  function createHttpComponent(): HttpTestingController {
    TestBed.configureTestingModule({
      imports: [McpAssistantPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    fixture = TestBed.createComponent(McpAssistantPageComponent);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    const discoveryRequest = http.expectOne(mcpUrl);

    expect(discoveryRequest.request.body.method).toBe('tools/list');
    expect(discoveryRequest.request.body.params).toEqual({});
    discoveryRequest.flush(sseRpcResult(toolsListResult));
    fixture.detectChanges();

    return http;
  }

  it('loads approved catalog tools and searches through the confirmed MCP search tool', () => {
    createComponent();

    fixture.componentInstance.searchControl.setValue('coffee');
    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(mcpClient.listTools).toHaveBeenCalled();
    expect(mcpClient.callTool).toHaveBeenCalledWith({
      toolName: CATALOG_SEARCH_PRODUCTS_TOOL,
      input: {
        searchTerm: 'coffee',
        isActive: true,
        pageNumber: 1,
        pageSize: 10
      }
    });
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('COF-001');
    expect(fixture.nativeElement.textContent).toContain('Showing 1-1 of 1');
  });

  it('shows a loading state while catalog search is pending', () => {
    const pendingSearch = new Subject<{ content: McpCatalogProductsPage }>();

    createComponent({
      callTool: vi.fn(() => pendingSearch.asObservable())
    });

    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Searching catalog...');

    pendingSearch.complete();
  });

  it('shows an empty state when MCP search returns no products', () => {
    createComponent({
      callTool: vi.fn(() => of({
        content: {
          ...productsPage,
          items: [],
          totalCount: 0
        }
      }))
    });

    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No products found.');
  });

  it('shows an error state when MCP search fails', () => {
    createComponent({
      callTool: vi.fn(() => throwError(() => new Error('Request failed')))
    });

    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Catalog search could not be completed through MCP. Please try again.');
  });

  it('loads product detail state through the confirmed MCP detail tool', () => {
    createComponent({
      callTool: vi.fn((request) => {
        if (request.toolName === CATALOG_GET_PRODUCT_BY_ID_TOOL) {
          return of({ content: productDetails });
        }

        return of({ content: productsPage });
      })
    });

    fixture.componentInstance.search();
    fixture.detectChanges();

    const detailButton = fixture.nativeElement.querySelector('.product-row .secondary-button') as HTMLButtonElement;
    detailButton.click();
    fixture.detectChanges();

    expect(mcpClient.callTool).toHaveBeenLastCalledWith({
      toolName: CATALOG_GET_PRODUCT_BY_ID_TOOL,
      input: {
        productId: 'product-1'
      }
    });
    expect(fixture.nativeElement.textContent).toContain('Product ID');
    expect(fixture.nativeElement.textContent).toContain('Whole bean coffee');
  });

  it('looks up order details through the confirmed MCP order tool', () => {
    createComponent({
      callTool: vi.fn((request) => {
        if (request.toolName === ORDERS_GET_ORDER_BY_ID_TOOL) {
          return of({ content: orderDetails });
        }

        return of({ content: productsPage });
      })
    });

    fixture.componentInstance.setActiveView('orders');
    fixture.componentInstance.orderIdControl.setValue('order-1');
    fixture.componentInstance.lookupOrder();
    fixture.detectChanges();

    expect(mcpClient.callTool).toHaveBeenCalledWith({
      toolName: ORDERS_GET_ORDER_BY_ID_TOOL,
      input: {
        orderId: 'order-1'
      }
    });
    expect(fixture.nativeElement.textContent).toContain('Order order-1');
    expect(fixture.nativeElement.textContent).toContain('Created');
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('$25.00');
  });

  it('shows a loading state while order lookup is pending', () => {
    const pendingLookup = new Subject<{ content: McpOrderDetails }>();

    createComponent({
      callTool: vi.fn(() => pendingLookup.asObservable())
    });

    fixture.componentInstance.setActiveView('orders');
    fixture.componentInstance.orderIdControl.setValue('order-1');
    fixture.componentInstance.lookupOrder();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading order...');

    pendingLookup.complete();
  });

  it('shows not found when the MCP order lookup reports a missing order', () => {
    createComponent({
      callTool: vi.fn(() => throwError(() => new Error('Order not found')))
    });

    fixture.componentInstance.setActiveView('orders');
    fixture.componentInstance.orderIdControl.setValue('missing-order');
    fixture.componentInstance.lookupOrder();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Order not found.');
  });

  it('shows an error state when MCP order lookup fails', () => {
    createComponent({
      callTool: vi.fn(() => throwError(() => new Error('Request failed')))
    });

    fixture.componentInstance.setActiveView('orders');
    fixture.componentInstance.orderIdControl.setValue('order-1');
    fixture.componentInstance.lookupOrder();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Order lookup could not be completed through MCP. Please try again.');
  });

  it('keeps the assistant unavailable when approved tools are missing', () => {
    createComponent({
      tools: []
    });

    expect(fixture.nativeElement.textContent).toContain('Approved assistant tools are unavailable.');
    expect(fixture.nativeElement.querySelector('.primary-button')).toBeNull();
  });

  it('keeps order lookup unavailable when the order tool is missing', () => {
    createComponent({
      tools: approvedTools.filter((tool) => tool.name !== ORDERS_GET_ORDER_BY_ID_TOOL)
    });

    fixture.componentInstance.setActiveView('orders');
    fixture.detectChanges();

    const lookupButton = fixture.nativeElement.querySelector('.primary-button') as HTMLButtonElement;

    expect(fixture.nativeElement.textContent).toContain('Order lookup tool is unavailable.');
    expect(lookupButton.disabled).toBe(true);
  });

  it('sends tools/call, not tools/list, when the user searches the assistant catalog', () => {
    const http = createHttpComponent();

    fixture.componentInstance.searchControl.setValue('coffee');
    fixture.componentInstance.search();
    fixture.detectChanges();

    const toolCallRequest = http.expectOne(mcpUrl);

    expect(toolCallRequest.request.body.method).toBe('tools/call');
    expect(toolCallRequest.request.body.params).toEqual({
      name: CATALOG_SEARCH_PRODUCTS_TOOL,
      arguments: {
        searchTerm: 'coffee',
        isActive: true,
        pageNumber: 1,
        pageSize: 10
      }
    });

    toolCallRequest.flush(sseRpcResult({
      content: [],
      structuredContent: productsPage
    }, 2));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    http.expectNone((request) => request.url === mcpUrl && request.body?.method === 'tools/list');
    http.verify();
  });

  it('sends tools/call with name and arguments when the user looks up an assistant order', () => {
    const http = createHttpComponent();

    fixture.componentInstance.setActiveView('orders');
    fixture.componentInstance.orderIdControl.setValue('order-1');
    fixture.componentInstance.lookupOrder();
    fixture.detectChanges();

    const toolCallRequest = http.expectOne(mcpUrl);

    expect(toolCallRequest.request.body.method).toBe('tools/call');
    expect(toolCallRequest.request.body.params).toEqual({
      name: ORDERS_GET_ORDER_BY_ID_TOOL,
      arguments: {
        orderId: 'order-1'
      }
    });

    toolCallRequest.flush(sseRpcResult({
      content: [],
      structuredContent: orderDetails
    }, 2));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Order order-1');
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    http.expectNone((request) => request.url === mcpUrl && request.body?.method === 'tools/list');
    http.verify();
  });
});
