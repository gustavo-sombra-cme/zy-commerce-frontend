import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { CartItem } from '../data/cart.models';
import { CartStateService } from '../data/cart-state.service';

@Component({
  selector: 'zy-cart-page',
  imports: [CurrencyPipe, PageHeaderComponent, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartPageComponent {
  private readonly cartState = inject(CartStateService);

  readonly items = this.cartState.items;
  readonly totalQuantity = this.cartState.totalQuantity;
  readonly displaySubtotal = this.cartState.displaySubtotal;

  updateQuantity(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cartState.updateQuantity(item.productId, Number(input.value));
  }

  removeItem(productId: string): void {
    this.cartState.removeItem(productId);
  }

  clearCart(): void {
    this.cartState.clear();
  }

  itemInitial(item: CartItem): string {
    return item.snapshot?.name.trim().charAt(0).toUpperCase() || 'P';
  }
}
