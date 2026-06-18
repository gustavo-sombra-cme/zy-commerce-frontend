export interface CatalogProduct {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly sku?: string | null;
  readonly price?: number | null;
  readonly currencyCode?: string | null;
  readonly imageUrl?: string | null;
  readonly isActive: boolean;
}

export interface CatalogProductDto {
  readonly id?: string;
  readonly productId?: string;
  readonly name: string;
  readonly description?: string | null;
  readonly sku?: string | null;
  readonly price?: number | null;
  readonly currencyCode?: string | null;
  readonly imageUrl?: string | null;
  readonly isActive: boolean;
}

export interface CatalogProductsRequest {
  readonly searchTerm?: string;
  readonly isActive?: boolean;
  readonly pageNumber: number;
  readonly pageSize: number;
}

export interface CatalogProductsPage {
  readonly items: readonly CatalogProduct[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

export interface CatalogProductsPageDto {
  readonly items?: readonly CatalogProductDto[];
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly totalPages?: number;
  readonly hasPreviousPage?: boolean;
  readonly hasNextPage?: boolean;
}

export type CatalogActiveFilter = 'all' | 'active' | 'inactive';
