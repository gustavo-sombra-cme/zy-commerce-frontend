import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { AssistantApiClient } from '../data/assistant-api.client';
import { AssistantQueryResponse } from '../data/assistant.models';

interface SuggestedQuestionGroup {
  readonly label: string;
  readonly questions: readonly string[];
}

interface UserChatMessage {
  readonly id: number;
  readonly role: 'user';
  readonly question: string;
}

interface AssistantChatMessage {
  readonly id: number;
  readonly role: 'assistant';
  readonly answer: string;
  readonly toolsUsed: readonly string[];
  readonly dataScope: string;
  readonly unsupported: boolean;
  readonly richContent: RichAssistantContent | null;
}

type ChatMessage = UserChatMessage | AssistantChatMessage;

interface OrderCard {
  readonly orderId: string;
  readonly status: string;
  readonly createdAt: string;
  readonly totalAmount: number;
  readonly lineCount?: number;
}

interface ProductCard {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly sku?: string;
  readonly price?: number;
  readonly currencyCode?: string;
  readonly isActive?: boolean;
  readonly quantity?: number;
  readonly frequency?: number;
}

interface AnalyticsMetric {
  readonly label: string;
  readonly value: string | number;
  readonly kind: 'currency' | 'number' | 'text';
}

type RichAssistantContent =
  | {
      readonly kind: 'orders';
      readonly orders: readonly OrderCard[];
    }
  | {
      readonly kind: 'products';
      readonly products: readonly ProductCard[];
    }
  | {
      readonly kind: 'analytics';
      readonly title: string;
      readonly metrics: readonly AnalyticsMetric[];
    };

@Component({
  selector: 'zy-mcp-assistant-page',
  imports: [CurrencyPipe, DatePipe, PageHeaderComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './mcp-assistant-page.component.html',
  styleUrl: './mcp-assistant-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class McpAssistantPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly assistantApi = inject(AssistantApiClient);
  private nextMessageId = 1;
  private lastQuestion: string | null = null;

  readonly questionControl = new FormControl('', { nonNullable: true });
  readonly messages = signal<readonly ChatMessage[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly suggestedQuestionGroups: readonly SuggestedQuestionGroup[] = [
    {
      label: 'Orders',
      questions: [
        'Show my recent orders',
        'Show my latest order',
        'What products did I order?',
        'Which orders contain product 4444?'
      ]
    },
    {
      label: 'Spending',
      questions: [
        'What is my total spend?',
        'What did I buy most often?'
      ]
    },
    {
      label: 'Products',
      questions: [
        'Find products under 20',
        'Search products named 4444'
      ]
    }
  ];

  canSubmit(): boolean {
    return this.questionControl.value.trim().length > 0 && !this.isLoading();
  }

  canRetry(): boolean {
    return Boolean(this.lastQuestion) && !this.isLoading();
  }

  submitQuestion(): void {
    const question = this.questionControl.value.trim();

    if (!question || this.isLoading()) {
      return;
    }

    this.questionControl.setValue('', { emitEvent: false });
    this.sendQuestion(question, true);
  }

  retryLastQuestion(): void {
    if (!this.lastQuestion || this.isLoading()) {
      return;
    }

    this.sendQuestion(this.lastQuestion, false);
  }

  submitSuggestedQuestion(question: string): void {
    if (this.isLoading()) {
      return;
    }

    this.questionControl.setValue('', { emitEvent: false });
    this.sendQuestion(question, true);
  }

  trackMessage(_: number, message: ChatMessage): number {
    return message.id;
  }

  trackQuestion(_: number, question: string): string {
    return question;
  }

  trackOrder(_: number, order: OrderCard): string {
    return order.orderId;
  }

  trackProduct(_: number, product: ProductCard): string {
    return product.id;
  }

  trackMetric(_: number, metric: AnalyticsMetric): string {
    return metric.label;
  }

  private sendQuestion(question: string, appendUserMessage: boolean): void {
    this.lastQuestion = question;
    this.errorMessage.set(null);
    this.isLoading.set(true);

    if (appendUserMessage) {
      this.appendMessage({
        id: this.nextMessageId++,
        role: 'user',
        question
      });
    }

    this.assistantApi.query(question).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.errorMessage.set('Assistant response could not be loaded. Please try again.');
        this.isLoading.set(false);
        return EMPTY;
      })
    ).subscribe((response) => {
      this.appendMessage(this.toAssistantMessage(response));
      this.isLoading.set(false);
    });
  }

  private appendMessage(message: ChatMessage): void {
    this.messages.update((messages) => [...messages, message]);
  }

  private toAssistantMessage(response: AssistantQueryResponse): AssistantChatMessage {
    return {
      id: this.nextMessageId++,
      role: 'assistant',
      answer: response.answer,
      toolsUsed: response.toolsUsed,
      dataScope: response.dataScope,
      unsupported: response.unsupported,
      richContent: buildRichContent(response)
    };
  }
}

function buildRichContent(response: AssistantQueryResponse): RichAssistantContent | null {
  if (!response.responseType || response.data === undefined || response.data === null) {
    return null;
  }

  switch (response.responseType) {
    case 'recentOrders':
    case 'matchingOrders':
      return buildOrdersContent(response.data);
    case 'orderedProducts':
    case 'catalogProducts':
    case 'catalogProduct':
      return buildProductsContent(response.responseType, response.data);
    case 'orderSummaryAnalytics':
      return buildAnalyticsContent(response.data);
    case 'productFrequency':
      return buildProductFrequencyContent(response.data);
    default:
      return null;
  }
}

function buildOrdersContent(data: unknown): RichAssistantContent | null {
  const orders = arrayFromData(data, ['orders', 'items'])
    .map(toOrderCard)
    .filter((order): order is OrderCard => order !== null);

  return orders.length > 0 ? { kind: 'orders', orders } : null;
}

function buildProductsContent(responseType: string, data: unknown): RichAssistantContent | null {
  const products = (responseType === 'catalogProduct' ? [productFromData(data)] : arrayFromData(data, ['products']))
    .map(toProductCard)
    .filter((product): product is ProductCard => product !== null);

  return products.length > 0 ? { kind: 'products', products } : null;
}

function productFromData(data: unknown): unknown {
  return isRecord(data) ? data['product'] : null;
}

function buildAnalyticsContent(data: unknown): RichAssistantContent | null {
  if (!isRecord(data)) {
    return null;
  }

  const metrics = [
    metricFrom(data, 'totalSpend', 'Total spend', 'currency'),
    metricFrom(data, 'totalAmount', 'Total amount', 'currency'),
    metricFrom(data, 'orderCount', 'Orders', 'number'),
    metricFrom(data, 'totalOrders', 'Orders', 'number'),
    metricFrom(data, 'averageOrderValue', 'Average order value', 'currency'),
    metricFrom(data, 'productCount', 'Products', 'number')
  ].filter((metric): metric is AnalyticsMetric => metric !== null);

  return metrics.length > 0 ? { kind: 'analytics', title: 'Order summary', metrics } : null;
}

function buildProductFrequencyContent(data: unknown): RichAssistantContent | null {
  if (!isRecord(data)) {
    return null;
  }

  const product = asString(data['product'])
    ?? asString(data['productName'])
    ?? productNameFromRecord(data['product']);
  const quantity = asNumber(data['quantity']);
  const orderCount = asNumber(data['orderCount']);

  if (!product || (quantity === null && orderCount === null)) {
    return null;
  }

  const metrics: AnalyticsMetric[] = [
    { label: 'Product', value: product, kind: 'text' },
    ...(quantity === null ? [] : [{ label: 'Quantity', value: quantity, kind: 'number' as const }]),
    ...(orderCount === null ? [] : [{ label: 'Orders', value: orderCount, kind: 'number' as const }])
  ];

  return { kind: 'analytics', title: 'Product frequency', metrics };
}

function productNameFromRecord(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return asString(value['name'] ?? value['productName']);
}

function metricFrom(
  data: Record<string, unknown>,
  key: string,
  label: string,
  kind: AnalyticsMetric['kind']
): AnalyticsMetric | null {
  const value = kind === 'text' ? asString(data[key]) : asNumber(data[key]);

  return value === null ? null : { label, value, kind };
}

function toOrderCard(candidate: unknown): OrderCard | null {
  if (!isRecord(candidate)) {
    return null;
  }

  const orderId = asString(candidate['orderId'] ?? candidate['id']);
  const status = asString(candidate['status']);
  const createdAt = asString(candidate['createdAt'] ?? candidate['createdDate']);
  const totalAmount = asNumber(candidate['totalAmount'] ?? candidate['total']);

  if (!orderId || !status || !createdAt || totalAmount === null) {
    return null;
  }

  const lineCount = asNumber(candidate['lineCount']);

  return {
    orderId,
    status,
    createdAt,
    totalAmount,
    ...(lineCount === null ? {} : { lineCount })
  };
}

function toProductCard(candidate: unknown): ProductCard | null {
  if (!isRecord(candidate)) {
    return null;
  }

  const id = asString(candidate['id'] ?? candidate['productId'] ?? candidate['productName'] ?? candidate['name']);
  const name = asString(candidate['name'] ?? candidate['productName']);

  if (!id) {
    return null;
  }

  const description = asString(candidate['description']);
  const sku = asString(candidate['sku'] ?? candidate['productSku']);
  const price = asNumber(candidate['price'] ?? candidate['unitPrice']);
  const currencyCode = asString(candidate['currencyCode']);
  const isActive = asBoolean(candidate['isActive']);
  const quantity = asNumber(candidate['quantity']);
  const frequency = asNumber(candidate['frequency'] ?? candidate['count'] ?? candidate['orderCount']);

  return {
    id,
    name: name ?? id,
    ...(description ? { description } : {}),
    ...(sku ? { sku } : {}),
    ...(price === null ? {} : { price }),
    ...(currencyCode ? { currencyCode } : {}),
    ...(isActive === null ? {} : { isActive }),
    ...(quantity === null ? {} : { quantity }),
    ...(frequency === null ? {} : { frequency })
  };
}

function arrayFromData(data: unknown, keys: readonly string[]): readonly unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (!isRecord(data)) {
    return [];
  }

  for (const key of keys) {
    const value = data[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}
