import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, merge, Observable, of, Subject, switchMap } from 'rxjs';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { CartStateService } from '../../cart/data/cart-state.service';
import { CatalogApiClient } from '../data/catalog-api.client';
import { CatalogProduct } from '../data/catalog.models';

type ProductDetailsViewModel =
  | {
    readonly status: 'loading';
    readonly productId: string;
  }
  | {
    readonly status: 'loaded';
    readonly productId: string;
    readonly product: CatalogProduct;
  }
  | {
    readonly status: 'notFound';
    readonly productId: string;
  }
  | {
    readonly status: 'error';
    readonly productId: string;
    readonly message: string;
  };

@Component({
  selector: 'zy-product-details-page',
  imports: [CurrencyPipe, PageHeaderComponent, RouterLink],
  templateUrl: './product-details-page.component.html',
  styleUrl: './product-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailsPageComponent {
  private readonly catalogApi = inject(CatalogApiClient);
  private readonly cartState = inject(CartStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly reloadRequests = new Subject<void>();

  readonly currentProductId = signal('');
  readonly viewModel = signal<ProductDetailsViewModel>({
    status: 'loading',
    productId: ''
  });
  readonly product = computed(() => {
    const viewModel = this.viewModel();
    return viewModel.status === 'loaded' ? viewModel.product : null;
  });
  readonly errorMessage = computed(() => {
    const viewModel = this.viewModel();
    return viewModel.status === 'error' ? viewModel.message : null;
  });
  readonly addedToCart = signal(false);

  constructor() {
    const productIdChanges$ = this.route.paramMap.pipe(
      map((paramMap) => paramMap.get('productId')?.trim() ?? ''),
      distinctUntilChanged()
    );
    const reloads$ = this.reloadRequests.pipe(map(() => this.currentProductId()));

    merge(productIdChanges$, reloads$).pipe(
      switchMap((productId) => this.loadProduct(productId)),
      takeUntilDestroyed()
    ).subscribe((viewModel) => this.viewModel.set(viewModel));
  }

  retry(): void {
    this.reloadRequests.next();
  }

  productInitial(product: CatalogProduct): string {
    return product.name.trim().charAt(0).toUpperCase() || 'P';
  }

  addToCart(product: CatalogProduct): void {
    if (!product.id.trim()) {
      return;
    }

    this.cartState.addProduct(product);
    this.addedToCart.set(true);
  }

  private loadProduct(productId: string): Observable<ProductDetailsViewModel> {
    this.currentProductId.set(productId);

    if (!productId) {
      return of({
        status: 'notFound',
        productId
      });
    }

    this.viewModel.set({
      status: 'loading',
      productId
    });

    return this.catalogApi.getProduct(productId).pipe(
      map((product) => ({
        status: 'loaded' as const,
        productId,
        product
      })),
      catchError((error: unknown) => of(this.toErrorViewModel(productId, error)))
    );
  }

  private toErrorViewModel(productId: string, error: unknown): ProductDetailsViewModel {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return {
        status: 'notFound',
        productId
      };
    }

    return {
      status: 'error',
      productId,
      message: 'Product details could not be loaded. Please try again.'
    };
  }
}
