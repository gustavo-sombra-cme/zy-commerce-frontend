import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminProductsApiClient } from '../data/admin-products-api.client';
import { AdminProductCreatePageComponent } from './admin-product-create-page.component';

describe('AdminProductCreatePageComponent', () => {
  let fixture: ComponentFixture<AdminProductCreatePageComponent>;
  let adminProductsApi: {
    createProduct: ReturnType<typeof vi.fn>;
  };

  function createComponent(): void {
    adminProductsApi = {
      createProduct: vi.fn(() => of({}))
    };

    TestBed.configureTestingModule({
      imports: [AdminProductCreatePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AdminProductsApiClient,
          useValue: adminProductsApi
        }
      ]
    });

    fixture = TestBed.createComponent(AdminProductCreatePageComponent);
    fixture.detectChanges();
  }

  it('sends the create product request body and navigates back to products', () => {
    createComponent();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.form.setValue({
      sku: ' COF-001 ',
      name: ' Coffee Beans ',
      description: ' Whole bean coffee ',
      price: 12.5
    });
    fixture.componentInstance.submit();

    expect(adminProductsApi.createProduct).toHaveBeenCalledWith({
      sku: 'COF-001',
      name: 'Coffee Beans',
      description: 'Whole bean coffee',
      price: 12.5
    });
    expect(navigate).toHaveBeenCalledWith(['/admin/products'], {
      queryParams: {
        adminStatus: 'created'
      }
    });
  });

  it('shows Admin access required when create is forbidden', () => {
    createComponent();
    adminProductsApi.createProduct.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    fixture.componentInstance.form.setValue({
      sku: 'COF-001',
      name: 'Coffee Beans',
      description: 'Whole bean coffee',
      price: 12.5
    });
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin access required.');
  });
});
