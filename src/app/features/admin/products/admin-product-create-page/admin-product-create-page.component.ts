import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { AdminProductsApiClient } from '../data/admin-products-api.client';

@Component({
  selector: 'zy-admin-product-create-page',
  imports: [PageHeaderComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-create-page.component.html',
  styleUrl: './admin-product-create-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProductCreatePageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly adminProductsApi = inject(AdminProductsApiClient);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly form = this.formBuilder.group({
    sku: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0.01)]]
  });

  submit(): void {
    this.form.markAllAsTouched();
    this.errorMessage.set(null);

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const request = this.form.getRawValue();
    this.submitting.set(true);

    this.adminProductsApi.createProduct({
      sku: request.sku.trim(),
      name: request.name.trim(),
      description: request.description.trim(),
      price: request.price
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigate(['/admin/products'], {
          queryParams: {
            adminStatus: 'created'
          }
        });
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.toAdminMessage(error, 'Product could not be created. Please try again.'));
      }
    });
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
