import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { CatalogApiClient } from '../../../catalog/data/catalog-api.client';
import { AdminProductsApiClient } from '../data/admin-products-api.client';
import { AdminProductEditPageComponent } from './admin-product-edit-page.component';

describe('AdminProductEditPageComponent', () => {
  let fixture: ComponentFixture<AdminProductEditPageComponent>;
  let paramMap: BehaviorSubject<ParamMap>;
  let catalogApi: {
    getProduct: ReturnType<typeof vi.fn>;
  };
  let adminProductsApi: {
    updateProductDetails: ReturnType<typeof vi.fn>;
    updateProductPrice: ReturnType<typeof vi.fn>;
  };

  function createComponent(): void {
    paramMap = new BehaviorSubject(convertToParamMap({
      productId: 'product-1'
    }));
    catalogApi = {
      getProduct: vi.fn(() => of({
        id: 'product-1',
        name: 'Coffee Beans',
        description: 'Whole bean coffee',
        sku: 'COF-001',
        price: 12.5,
        currencyCode: 'USD',
        isActive: true
      }))
    };
    adminProductsApi = {
      updateProductDetails: vi.fn(() => of({})),
      updateProductPrice: vi.fn(() => of({}))
    };

    TestBed.configureTestingModule({
      imports: [AdminProductEditPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap.asObservable()
          }
        },
        {
          provide: CatalogApiClient,
          useValue: catalogApi
        },
        {
          provide: AdminProductsApiClient,
          useValue: adminProductsApi
        }
      ]
    });

    fixture = TestBed.createComponent(AdminProductEditPageComponent);
    fixture.detectChanges();
  }

  it('loads the product and displays the SKU read-only', () => {
    createComponent();

    expect(catalogApi.getProduct).toHaveBeenCalledWith('product-1');
    expect(fixture.nativeElement.textContent).toContain('COF-001');
    expect(fixture.nativeElement.textContent).toContain('Current price');
  });

  it('sends the update details request body', () => {
    createComponent();

    fixture.componentInstance.detailsForm.setValue({
      name: ' Updated Coffee ',
      description: ' Updated description '
    });
    fixture.componentInstance.submitDetails();

    expect(adminProductsApi.updateProductDetails).toHaveBeenCalledWith('product-1', {
      name: 'Updated Coffee',
      description: 'Updated description'
    });
  });

  it('sends only price in the update price request body', () => {
    createComponent();

    fixture.componentInstance.priceForm.setValue({
      price: 19.99
    });
    fixture.componentInstance.submitPrice();

    expect(adminProductsApi.updateProductPrice).toHaveBeenCalledWith('product-1', {
      price: 19.99
    });
  });
});
