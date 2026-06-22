import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { McpAssistantPageComponent } from './mcp-assistant-page.component';

describe('McpAssistantPageComponent', () => {
  let fixture: ComponentFixture<McpAssistantPageComponent>;
  let http: HttpTestingController;

  const assistantUrl = 'http://localhost:5015/api/assistant/query';
  const mcpUrl = 'http://localhost:5015/mcp';

  function createComponent(): void {
    TestBed.configureTestingModule({
      imports: [McpAssistantPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(McpAssistantPageComponent);
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  }

  function submitQuestion(question: string): void {
    fixture.componentInstance.questionControl.setValue(question);
    const form = fixture.nativeElement.querySelector('.chat-composer') as HTMLFormElement;

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  afterEach(() => {
    http.verify();
  });

  it('renders the empty chat state without discovering MCP tools', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('What would you like to know?');
    expect(fixture.nativeElement.textContent).toContain('Ask a catalog or order question.');
    expect(fixture.nativeElement.textContent).toContain('What can I ask?');
    expect(fixture.nativeElement.textContent).toContain('Show my recent orders');
    http.expectNone(mcpUrl);
  });

  it('submits persistent supported-question chips through the assistant endpoint', () => {
    createComponent();

    const chip = fixture.nativeElement.querySelector('.question-catalog .question-chip') as HTMLButtonElement;
    chip.click();
    fixture.detectChanges();

    const request = http.expectOne(assistantUrl);

    expect(request.request.body).toEqual({
      question: 'Show my recent orders'
    });
    expect(fixture.nativeElement.textContent).toContain('Show my recent orders');
    http.expectNone(mcpUrl);

    request.flush({
      answer: 'Here are your recent orders.',
      toolsUsed: ['orders_search'],
      dataScope: 'orders',
      unsupported: false
    });
  });

  it('keeps supported questions visible after receiving a response', () => {
    createComponent();

    submitQuestion('Find active coffee products');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'Coffee Beans is active.',
      toolsUsed: ['catalog_search_products'],
      dataScope: 'catalog',
      unsupported: false
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Coffee Beans is active.');
    expect(fixture.nativeElement.textContent).toContain('What can I ask?');
    expect(fixture.nativeElement.textContent).toContain('Show my recent orders');
    expect(fixture.nativeElement.querySelector('.question-catalog')).not.toBeNull();
    http.expectNone(mcpUrl);
  });

  it('posts a trimmed natural-language question to the assistant endpoint', () => {
    createComponent();

    submitQuestion('  Find active coffee products  ');

    const request = http.expectOne(assistantUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      question: 'Find active coffee products'
    });
    expect(fixture.nativeElement.textContent).toContain('Find active coffee products');
    expect(fixture.nativeElement.textContent).toContain('Thinking...');
    http.expectNone(mcpUrl);

    request.flush({
      answer: 'Coffee Beans is active.',
      toolsUsed: ['catalog_search_products'],
      dataScope: 'catalog',
      unsupported: false
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Coffee Beans is active.');
    expect(fixture.nativeElement.textContent).toContain('Assistant details');
  });

  it('renders order cards from recognized structured response data while keeping the answer visible', () => {
    createComponent();

    submitQuestion('Show my recent orders');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'Here are your recent orders.',
      toolsUsed: ['orders_search'],
      dataScope: 'orders',
      unsupported: false,
      responseType: 'recentOrders',
      data: {
        orders: [
          {
            orderId: 'order-1',
            status: 'Created',
            createdAt: '2026-06-18T10:00:00Z',
            totalAmount: 42.5,
            lineCount: 2
          }
        ]
      }
    });
    fixture.detectChanges();

    const orderLink = fixture.nativeElement.querySelector('.order-result-card .card-link') as HTMLAnchorElement;

    expect(fixture.nativeElement.textContent).toContain('Here are your recent orders.');
    expect(fixture.nativeElement.textContent).toContain('Order order-1');
    expect(fixture.nativeElement.textContent).toContain('Created');
    expect(fixture.nativeElement.textContent).toContain('$42.50');
    expect(orderLink.getAttribute('href')).toBe('/orders/order-1');
  });

  it('renders product cards from recognized structured response data', () => {
    createComponent();

    submitQuestion('Find products under 20');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'I found matching products.',
      toolsUsed: ['catalog_search_products'],
      dataScope: 'catalog',
      unsupported: false,
      responseType: 'catalogProducts',
      data: {
        products: [
          {
            productId: 'product-1',
            name: 'Coffee Beans',
            sku: 'COF-1',
            price: 12,
            currencyCode: 'USD',
            isActive: true
          }
        ]
      }
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('I found matching products.');
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('COF-1');
    expect(fixture.nativeElement.textContent).toContain('$12.00');
    expect(fixture.nativeElement.textContent).toContain('Active');
  });

  it('renders a catalog product card from data.product', () => {
    createComponent();

    submitQuestion('Search products named 4444');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'I found one product.',
      toolsUsed: ['catalog_get_product'],
      dataScope: 'catalog',
      unsupported: false,
      responseType: 'catalogProduct',
      data: {
        product: {
          productId: 'product-4444',
          name: 'Product 4444',
          description: 'A structured product result.',
          price: 19.5,
          isActive: false
        }
      }
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('I found one product.');
    expect(fixture.nativeElement.textContent).toContain('Product 4444');
    expect(fixture.nativeElement.textContent).toContain('A structured product result.');
    expect(fixture.nativeElement.textContent).toContain('$19.50');
    expect(fixture.nativeElement.textContent).toContain('Inactive');
  });

  it('renders analytics cards from recognized structured response data', () => {
    createComponent();

    submitQuestion('What is my total spend?');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'Your total spend is 99.25.',
      toolsUsed: ['orders_summary'],
      dataScope: 'orders',
      unsupported: false,
      responseType: 'orderSummaryAnalytics',
      data: {
        totalSpend: 99.25,
        orderCount: 3
      }
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Your total spend is 99.25.');
    expect(fixture.nativeElement.textContent).toContain('Total spend');
    expect(fixture.nativeElement.textContent).toContain('$99.25');
    expect(fixture.nativeElement.textContent).toContain('Orders');
  });

  it('renders product frequency as an analytics card when required fields are present', () => {
    createComponent();

    submitQuestion('What did I buy most often?');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'Coffee Beans was your most frequent product.',
      toolsUsed: ['orders_product_frequency'],
      dataScope: 'orders',
      unsupported: false,
      responseType: 'productFrequency',
      data: {
        productName: 'Coffee Beans',
        quantity: 4,
        orderCount: 2
      }
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Coffee Beans was your most frequent product.');
    expect(fixture.nativeElement.textContent).toContain('Product frequency');
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('Quantity');
    expect(fixture.nativeElement.textContent).toContain('4');
    expect(fixture.nativeElement.textContent).toContain('Orders');
  });

  it('falls back to plain text for missing or malformed structured data', () => {
    createComponent();

    submitQuestion('Show my recent orders');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'Recent orders could not be structured.',
      toolsUsed: ['orders_search'],
      dataScope: 'orders',
      unsupported: false,
      responseType: 'recentOrders',
      data: {
        orders: [
          {
            orderId: 'order-1'
          }
        ]
      }
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Recent orders could not be structured.');
    expect(fixture.nativeElement.querySelector('.order-result-card')).toBeNull();
  });

  it('falls back to plain text for unknown response types', () => {
    createComponent();

    submitQuestion('Show a new response type');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'This response type is not recognized by the frontend yet.',
      toolsUsed: ['unknown_tool'],
      dataScope: 'orders',
      unsupported: false,
      responseType: 'futureResponseType',
      data: {
        items: [
          {
            name: 'Should not render as a card'
          }
        ]
      }
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('This response type is not recognized by the frontend yet.');
    expect(fixture.nativeElement.querySelector('.rich-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.analytics-panel')).toBeNull();
  });

  it('falls back to plain text when structured response fields are missing', () => {
    createComponent();

    submitQuestion('Show my latest order');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'Order details are available as plain text only.',
      toolsUsed: ['orders_search'],
      dataScope: 'orders',
      unsupported: false,
      responseType: null,
      data: null
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Order details are available as plain text only.');
    expect(fixture.nativeElement.querySelector('.rich-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.analytics-panel')).toBeNull();
  });

  it('renders metadata in a native collapsible details element', () => {
    createComponent();

    submitQuestion('Find active coffee products');

    const request = http.expectOne(assistantUrl);
    request.flush({
      answer: 'Coffee Beans is active.',
      toolsUsed: ['catalog_search_products'],
      dataScope: 'catalog',
      unsupported: false
    });
    fixture.detectChanges();

    const details = fixture.nativeElement.querySelector('.assistant-meta') as HTMLDetailsElement;
    const summary = details.querySelector('summary') as HTMLElement;

    expect(details.tagName.toLowerCase()).toBe('details');
    expect(summary.textContent).toContain('Assistant details');

    summary.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    summary.click();
    fixture.detectChanges();

    expect(details.open).toBe(true);
  });

  it('does not submit empty questions', () => {
    createComponent();

    submitQuestion('   ');

    http.expectNone(assistantUrl);
    http.expectNone(mcpUrl);
  });

  it('shows unsupported assistant responses with metadata', () => {
    createComponent();

    submitQuestion('Can you cancel an order?');

    const request = http.expectOne(assistantUrl);

    request.flush({
      answer: 'I cannot cancel orders from this assistant.',
      toolsUsed: [],
      dataScope: 'none',
      unsupported: true
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unsupported');
    expect(fixture.nativeElement.textContent).toContain('I cannot cancel orders from this assistant.');
    expect(fixture.nativeElement.textContent).toContain('Try one of these');
    expect(fixture.nativeElement.textContent).toContain('Assistant details');
  });

  it('preserves previous messages on error and retries the last question', () => {
    createComponent();

    submitQuestion('Show order order-1');

    const failedRequest = http.expectOne(assistantUrl);
    failedRequest.flush('Request failed', {
      status: 500,
      statusText: 'Server Error'
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Show order order-1');
    expect(fixture.nativeElement.textContent).toContain('Assistant response could not be loaded. Please try again.');

    const retryButton = fixture.nativeElement.querySelector('.error-row .secondary-button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    const retryRequest = http.expectOne(assistantUrl);

    expect(retryRequest.request.body).toEqual({
      question: 'Show order order-1'
    });

    retryRequest.flush({
      answer: 'Order order-1 is Created.',
      toolsUsed: ['orders_get_order_by_id'],
      dataScope: 'orders',
      unsupported: false
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Show order order-1');
    expect(fixture.nativeElement.textContent).toContain('Order order-1 is Created.');
    expect(fixture.nativeElement.textContent).not.toContain('Assistant response could not be loaded. Please try again.');
    http.expectNone(mcpUrl);
  });
});
