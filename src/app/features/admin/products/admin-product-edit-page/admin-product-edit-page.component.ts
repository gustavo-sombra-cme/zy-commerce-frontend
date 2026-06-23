import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, merge, Observable, of, Subject, switchMap, tap } from 'rxjs';

import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { CatalogApiClient } from '../../../catalog/data/catalog-api.client';
import { CatalogProduct } from '../../../catalog/data/catalog.models';
import { AdminProductsApiClient } from '../data/admin-products-api.client';

type AdminProductEditViewModel =
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
  selector: 'zy-admin-product-edit-page',
  imports: [CurrencyPipe, PageHeaderComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-edit-page.component.html',
  styleUrl: './admin-product-edit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProductEditPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly catalogApi = inject(CatalogApiClient);
  private readonly adminProductsApi = inject(AdminProductsApiClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reloadRequests = new Subject<void>();

  readonly currentProductId = signal('');
  readonly viewModel = signal<AdminProductEditViewModel>({
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
  readonly detailsSubmitting = signal(false);
  readonly priceSubmitting = signal(false);
  readonly actionMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly detailsForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]]
  });
  readonly priceForm = this.formBuilder.group({
    price: [0, [Validators.required, Validators.min(0.01)]]
  });

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

  submitDetails(): void {
    this.detailsForm.markAllAsTouched();
    this.actionMessage.set(null);
    this.actionError.set(null);

    const product = this.product();

    if (!product || this.detailsForm.invalid || this.detailsSubmitting()) {
      return;
    }

    const request = this.detailsForm.getRawValue();
    this.detailsSubmitting.set(true);

    this.adminProductsApi.updateProductDetails(product.id, {
      name: request.name.trim(),
      description: request.description.trim()
    }).subscribe({
      next: () => {
        this.detailsSubmitting.set(false);
        this.actionMessage.set('Product details updated.');
        this.reloadRequests.next();
      },
      error: (error: unknown) => {
        this.detailsSubmitting.set(false);
        this.actionError.set(this.toAdminMessage(error, 'Product details could not be updated. Please try again.'));
      }
    });
  }

  submitPrice(): void {
    this.priceForm.markAllAsTouched();
    this.actionMessage.set(null);
    this.actionError.set(null);

    const product = this.product();

    if (!product || this.priceForm.invalid || this.priceSubmitting()) {
      return;
    }

    this.priceSubmitting.set(true);

    this.adminProductsApi.updateProductPrice(product.id, {
      price: this.priceForm.getRawValue().price
    }).subscribe({
      next: () => {
        this.priceSubmitting.set(false);
        this.actionMessage.set('Product price updated.');
        this.reloadRequests.next();
      },
      error: (error: unknown) => {
        this.priceSubmitting.set(false);
        this.actionError.set(this.toAdminMessage(error, 'Product price could not be updated. Please try again.'));
      }
    });
  }

  finish(): void {
    void this.router.navigate(['/admin/products'], {
      queryParams: {
        adminStatus: 'updated'
      }
    });
  }

  private loadProduct(productId: string): Observable<AdminProductEditViewModel> {
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
      tap((product) => this.syncForms(product)),
      map((product) => ({
        status: 'loaded' as const,
        productId,
        product
      })),
      catchError((error: unknown) => of(this.toErrorViewModel(productId, error)))
    );
  }

  private syncForms(product: CatalogProduct): void {
    this.detailsForm.setValue({
      name: product.name,
      description: product.description ?? ''
    }, { emitEvent: false });
    this.priceForm.setValue({
      price: product.price ?? 0
    }, { emitEvent: false });
  }

  private toErrorViewModel(productId: string, error: unknown): AdminProductEditViewModel {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return {
        status: 'notFound',
        productId
      };
    }

    return {
      status: 'error',
      productId,
      message: this.toAdminMessage(error, 'Product details could not be loaded. Please try again.')
    };
  }

  private toAdminMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'Admin access required.';
    }

    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Your session is no longer valid. Please sign in again.';
    }

    return fallback;
  }
}
