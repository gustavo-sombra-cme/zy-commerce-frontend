export interface CreateProductRequest {
  readonly sku: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
}

export interface UpdateProductDetailsRequest {
  readonly name: string;
  readonly description: string;
}

export interface UpdateProductPriceRequest {
  readonly price: number;
}
