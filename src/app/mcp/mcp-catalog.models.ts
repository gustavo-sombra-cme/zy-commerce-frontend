export const CATALOG_SEARCH_PRODUCTS_TOOL = 'catalog_search_products';
export const CATALOG_GET_PRODUCT_BY_ID_TOOL = 'catalog_get_product_by_id';

export const APPROVED_READONLY_CATALOG_TOOLS = [
  CATALOG_SEARCH_PRODUCTS_TOOL,
  CATALOG_GET_PRODUCT_BY_ID_TOOL
] as const;

export type ApprovedReadonlyCatalogTool = typeof APPROVED_READONLY_CATALOG_TOOLS[number];

export interface CatalogSearchProductsInput {
  readonly searchTerm?: string | null;
  readonly isActive?: boolean | null;
  readonly pageNumber?: number | null;
  readonly pageSize?: number | null;
}

export interface CatalogGetProductByIdInput {
  readonly productId: string;
}

export interface McpCatalogProductSummary {
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface McpCatalogProductsPage {
  readonly items: readonly McpCatalogProductSummary[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

export interface McpCatalogProductDetails extends McpCatalogProductSummary {
  readonly updatedAt: string | null;
}

export function isApprovedReadonlyCatalogTool(toolName: string): toolName is ApprovedReadonlyCatalogTool {
  return APPROVED_READONLY_CATALOG_TOOLS.includes(toolName as ApprovedReadonlyCatalogTool);
}
