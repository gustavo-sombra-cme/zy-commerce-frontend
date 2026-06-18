export interface CartProductSnapshot {
  readonly name: string;
  readonly sku?: string | null;
  readonly price?: number | null;
  readonly currencyCode?: string | null;
  readonly imageUrl?: string | null;
  readonly isActive?: boolean;
}

export interface CartItem {
  readonly productId: string;
  readonly quantity: number;
  readonly snapshot?: CartProductSnapshot;
}

export interface PersistedCartItem {
  readonly productId: string;
  readonly quantity: number;
  readonly snapshot?: CartProductSnapshot;
}

export interface PersistedCart {
  readonly items: readonly PersistedCartItem[];
}
