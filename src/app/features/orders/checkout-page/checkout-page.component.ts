import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { CartStateService } from '../../cart/data/cart-state.service';
import { buildCreateOrderRequest } from '../data/create-order.mapper';
import { OrdersApiClient } from '../data/orders-api.client';
import { OrderConfirmation } from '../data/orders.models';

type CheckoutStatus = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'zy-checkout-page',
  imports: [CurrencyPipe, PageHeaderComponent, RouterLink],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutPageComponent {
  private readonly cartState = inject(CartStateService);
  private readonly ordersApi = inject(OrdersApiClient);

  readonly items = this.cartState.items;
  readonly totalQuantity = this.cartState.totalQuantity;
  readonly displaySubtotal = this.cartState.displaySubtotal;
  readonly status = signal<CheckoutStatus>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly confirmation = signal<OrderConfirmation | null>(null);
  readonly canSubmit = computed(() => this.items().length > 0 && this.status() !== 'submitting');

  createOrder(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.status.set('submitting');
    this.errorMessage.set(null);

    this.ordersApi.createOrder(buildCreateOrderRequest(this.items())).subscribe({
      next: (confirmation) => {
        this.confirmation.set(confirmation);
        this.cartState.clear();
        this.status.set('success');
      },
      error: () => {
        this.errorMessage.set('Order could not be created. Please try again.');
        this.status.set('error');
      }
    });
  }

  confirmationId(): string {
    return this.confirmationOrderId() ?? 'Pending';
  }

  confirmationOrderId(): string | null {
    const confirmation = this.confirmation();
    return confirmation?.orderId ?? confirmation?.id ?? null;
  }
}
