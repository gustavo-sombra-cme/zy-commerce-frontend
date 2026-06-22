import { computed, Injectable, signal } from '@angular/core';

import { CatalogProduct } from '../../catalog/data/catalog.models';
import { CartItem, CartProductSnapshot, PersistedCart } from './cart.models';

const CART_STORAGE_KEY = 'zy-commerce.cart.v1';
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  private readonly cartItems = signal<readonly CartItem[]>(this.readPersistedItems());

  readonly items = this.cartItems.asReadonly();
  readonly totalQuantity = computed(() => this.cartItems().reduce((total, item) => total + item.quantity, 0));
  readonly distinctItemCount = computed(() => this.cartItems().length);
  readonly displaySubtotal = computed(() => this.cartItems().reduce((total, item) => {
    const price = item.snapshot?.price;
    return typeof price === 'number' ? total + (price * item.quantity) : total;
  }, 0));

  addProduct(product: CatalogProduct, quantity = 1): void {
    const productId = product.id?.trim();

    if (!productId) {
      return;
    }

    this.addItem(productId, quantity, this.toSnapshot(product));
  }

  addItem(productId: string, quantity = 1, snapshot?: CartProductSnapshot): void {
    const normalizedProductId = productId.trim();

    if (!normalizedProductId) {
      return;
    }

    const quantityToAdd = this.normalizeQuantity(quantity);
    const existingItem = this.cartItems().find((item) => item.productId === normalizedProductId);
    const nextItems = existingItem
      ? this.cartItems().map((item) => item.productId === normalizedProductId
        ? {
          ...item,
          quantity: this.normalizeQuantity(item.quantity + quantityToAdd),
          snapshot: snapshot ?? item.snapshot
        }
        : item)
      : [
        ...this.cartItems(),
        {
          productId: normalizedProductId,
          quantity: quantityToAdd,
          snapshot
        }
      ];

    this.replaceItems(nextItems);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < MIN_QUANTITY) {
      this.removeItem(productId);
      return;
    }

    this.replaceItems(this.cartItems().map((item) => item.productId === productId
      ? {
        ...item,
        quantity: this.normalizeQuantity(quantity)
      }
      : item));
  }

  removeItem(productId: string): void {
    this.replaceItems(this.cartItems().filter((item) => item.productId !== productId));
  }

  clear(): void {
    this.replaceItems([]);
  }

  private replaceItems(items: readonly CartItem[]): void {
    this.cartItems.set(items);
    this.persist(items);
  }

  private toSnapshot(product: CatalogProduct): CartProductSnapshot {
    return {
      name: product.name,
      sku: product.sku,
      price: product.price,
      currencyCode: product.currencyCode,
      imageUrl: product.imageUrl,
      isActive: product.isActive
    };
  }

  private normalizeQuantity(quantity: number): number {
    if (!Number.isFinite(quantity)) {
      return MIN_QUANTITY;
    }

    return Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, Math.floor(quantity)));
  }

  private readPersistedItems(): readonly CartItem[] {
    const storage = this.getStorage();
    const rawCart = storage?.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      return [];
    }

    try {
      const cart = JSON.parse(rawCart) as Partial<PersistedCart>;
      return Array.isArray(cart.items)
        ? cart.items
          .filter((item) => typeof item.productId === 'string' && item.productId.trim())
          .map((item) => ({
            productId: item.productId.trim(),
            quantity: this.normalizeQuantity(Number(item.quantity)),
            snapshot: item.snapshot
          }))
        : [];
    } catch {
      return [];
    }
  }

  private persist(items: readonly CartItem[]): void {
    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    try {
      storage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
    } catch {
      return;
    }
  }

  private getStorage(): Storage | null {
    try {
      return globalThis.sessionStorage ?? null;
    } catch {
      return null;
    }
  }
}
