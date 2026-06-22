import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  CATALOG_GET_PRODUCT_BY_ID_TOOL,
  CATALOG_SEARCH_PRODUCTS_TOOL,
  McpCatalogProductDetails,
  McpCatalogProductsPage
} from './mcp-catalog.models';
import { McpHttpClientService } from './mcp-http-client.service';
import { McpOrderDetails, ORDERS_CREATE_ORDER_TOOL, ORDERS_GET_ORDER_BY_ID_TOOL } from './mcp-order.models';

describe('McpHttpClientService', () => {
  let service: McpHttpClientService;
  let http: HttpTestingController;

  const mcpUrl = 'http://localhost:5015/mcp';
  const toolsListResult = {
    tools: [
      {
        name: ORDERS_CREATE_ORDER_TOOL,
        title: 'Create Order',
        description: 'Creates an order.',
        annotations: {
          destructiveHint: true
        }
      },
      {
        name: CATALOG_SEARCH_PRODUCTS_TOOL,
        title: 'Search Catalog Products',
        description: 'Searches catalog products.',
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
      },
      {
        name: CATALOG_GET_PRODUCT_BY_ID_TOOL,
        title: 'Get Catalog Product By Id',
        description: 'Gets public catalog product details.',
        annotations: {
          readOnlyHint: true
        }
      }
    ]
  };

  function sseResult(result: unknown, id = 1): string {
    return `event: message\ndata: ${JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    })}\n\n`;
  }

  function streamableSseResult(result: unknown, id = 1): string {
    const resultPayload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    });

    return [
      ': keep-alive',
      '',
      'event: metadata',
      'data: {"type":"metadata"}',
      '',
      'event: message',
      `data: ${resultPayload}`,
      '',
      'event: done',
      'data: [DONE]',
      '',
      ''
    ].join('\n');
  }

  function jsonRpcResult(result: unknown, id = 1): string {
    return JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    });
  }

  function discoverTools(result = toolsListResult): void {
    service.listTools().subscribe();

    const request = http.expectOne(mcpUrl);

    expect(request.request.body.method).toBe('tools/list');
    expect(request.request.body.params).toEqual({});
    request.flush(sseResult(result));
  }

  function expectToolCallRequest(params: unknown) {
    const request = http.expectOne(mcpUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body.method).toBe('tools/call');
    expect(request.request.body.params).toEqual(params);

    return request;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(McpHttpClientService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the actual backend MCP tool list and maps mutating annotations', () => {
    service.listTools().subscribe((tools) => {
      expect(tools.map((tool) => tool.name)).toEqual([
        ORDERS_CREATE_ORDER_TOOL,
        CATALOG_SEARCH_PRODUCTS_TOOL,
        ORDERS_GET_ORDER_BY_ID_TOOL,
        CATALOG_GET_PRODUCT_BY_ID_TOOL
      ]);
      expect(tools.find((tool) => tool.name === ORDERS_CREATE_ORDER_TOOL)?.mutating).toBe(true);
      expect(tools.find((tool) => tool.name === CATALOG_SEARCH_PRODUCTS_TOOL)?.mutating).toBe(false);
    });

    const request = http.expectOne(mcpUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Accept')).toBe('application/json, text/event-stream');
    expect(request.request.body.method).toBe('tools/list');
    expect(request.request.body.params).toEqual({});
    request.flush(sseResult(toolsListResult));
  });

  it('also parses application/json JSON-RPC responses', () => {
    service.listTools().subscribe((tools) => {
      expect(tools.map((tool) => tool.name)).toContain(CATALOG_SEARCH_PRODUCTS_TOOL);
    });

    const request = http.expectOne(mcpUrl);

    expect(request.request.body.method).toBe('tools/list');
    expect(request.request.body.params).toEqual({});
    request.flush(jsonRpcResult(toolsListResult), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  it('calls the approved read-only order lookup tool and returns structured content', () => {
    const order: McpOrderDetails = {
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

    discoverTools();

    service.callTool({
      toolName: ORDERS_GET_ORDER_BY_ID_TOOL,
      input: {
        orderId: 'order-1'
      }
    }).subscribe((result) => {
      expect(result.content).toEqual(order);
    });

    const request = expectToolCallRequest({
      name: ORDERS_GET_ORDER_BY_ID_TOOL,
      arguments: {
        orderId: 'order-1'
      }
    });
    request.flush(streamableSseResult({
      content: [],
      structuredContent: order
    }, 2));
  });

  it('calls approved read-only catalog tools and returns structured content', () => {
    const page: McpCatalogProductsPage = {
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

    discoverTools();

    service.callTool({
      toolName: CATALOG_SEARCH_PRODUCTS_TOOL,
      input: {
        searchTerm: 'coffee',
        isActive: true,
        pageNumber: 1,
        pageSize: 10
      }
    }).subscribe((result) => {
      expect(result.content).toEqual(page);
    });

    const request = expectToolCallRequest({
      name: CATALOG_SEARCH_PRODUCTS_TOOL,
      arguments: {
        searchTerm: 'coffee',
        isActive: true,
        pageNumber: 1,
        pageSize: 10
      }
    });
    request.flush(streamableSseResult({
      content: [],
      structuredContent: page
    }, 2));
  });

  it('calls the approved read-only catalog details tool and returns structured content', () => {
    const product: McpCatalogProductDetails = {
      productId: 'product-1',
      sku: 'COF-001',
      name: 'Coffee Beans',
      description: 'Whole bean coffee',
      isActive: true,
      createdAt: '2026-06-17T09:00:00.000Z',
      updatedAt: '2026-06-17T10:00:00.000Z'
    };

    discoverTools();

    service.callTool({
      toolName: CATALOG_GET_PRODUCT_BY_ID_TOOL,
      input: {
        productId: 'product-1'
      }
    }).subscribe((result) => {
      expect(result.content).toEqual(product);
    });

    const request = expectToolCallRequest({
      name: CATALOG_GET_PRODUCT_BY_ID_TOOL,
      arguments: {
        productId: 'product-1'
      }
    });
    request.flush(jsonRpcResult({
      content: [
        {
          type: 'text',
          text: JSON.stringify(product)
        }
      ]
    }, 2), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  it('uses the final JSON-RPC result frame from streamable SSE responses', () => {
    const firstPage: McpCatalogProductsPage = {
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    };
    const finalPage: McpCatalogProductsPage = {
      ...firstPage,
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
      totalCount: 1
    };

    discoverTools();

    service.callTool({
      toolName: CATALOG_SEARCH_PRODUCTS_TOOL,
      input: {
        searchTerm: 'coffee'
      }
    }).subscribe((result) => {
      expect(result.content).toEqual(finalPage);
    });

    const request = expectToolCallRequest({
      name: CATALOG_SEARCH_PRODUCTS_TOOL,
      arguments: {
        searchTerm: 'coffee'
      }
    });
    const firstResult = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      result: {
        content: [],
        structuredContent: firstPage
      }
    });
    const finalResult = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      result: {
        content: [],
        structuredContent: finalPage
      }
    });

    request.flush([
      'event: message',
      `data: ${firstResult}`,
      '',
      'event: message',
      `data: ${finalResult}`,
      '',
      ''
    ].join('\n'));
  });

  it('blocks unknown MCP tools before execution', () => {
    const errorSpy = vi.fn();

    service.callTool({
      toolName: 'catalog.search',
      input: {}
    }).subscribe({
      error: errorSpy
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Unknown MCP tool is blocked.'
    }));
    http.expectNone(mcpUrl);
  });

  it('blocks mutating MCP tools before execution', () => {
    const errorSpy = vi.fn();

    service.callTool({
      toolName: ORDERS_CREATE_ORDER_TOOL,
      input: {
        confirmedByUser: true,
        lines: []
      }
    }).subscribe({
      error: errorSpy
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Mutating MCP tool execution is blocked.'
    }));
    http.expectNone(mcpUrl);
  });

  it('blocks read-only tools that are not approved for this assistant feature', () => {
    const errorSpy = vi.fn();
    const toolsWithUnapprovedReadonlyTool = {
      tools: [
        ...toolsListResult.tools,
        {
          name: 'orders_list_orders',
          title: 'List Orders',
          description: 'Lists orders.',
          annotations: {
            readOnlyHint: true
          }
        }
      ]
    };

    discoverTools(toolsWithUnapprovedReadonlyTool);

    service.callTool({
      toolName: 'orders_list_orders',
      input: {
        pageNumber: 1
      }
    }).subscribe({
      error: errorSpy
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
      message: 'MCP tool is not approved for this assistant feature.'
    }));
    http.expectNone(mcpUrl);
  });
});
