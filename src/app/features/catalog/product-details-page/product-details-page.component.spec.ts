import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { CatalogApiClient } from '../data/catalog-api.client';
import { CatalogProduct } from '../data/catalog.models';
import { CartStateService } from '../../cart/data/cart-state.service';
import { ProductDetailsPageComponent } from './product-details-page.component';

describe('ProductDetailsPageComponent', () => {
  let fixture: ComponentFixture<ProductDetailsPageComponent>;
  let paramMap: BehaviorSubject<ParamMap>;
  let catalogApi: {
    getProduct: ReturnType<typeof vi.fn>;
  };
  let cartState: CartStateService;
  let routeStub: {
    paramMap: ReturnType<BehaviorSubject<ParamMap>['asObservable']>;
  };

  const product: CatalogProduct = {
    id: 'product-1',
    name: 'Coffee Beans',
    description: 'Whole bean coffee',
    sku: 'COF-001',
    price: 12.5,
    currencyCode: 'USD',
    isActive: true
  };

  function createComponent(productResponse = of(product)): void {
    globalThis.sessionStorage.clear();
    paramMap = new BehaviorSubject(convertToParamMap({
      productId: 'product-1'
    }));
    catalogApi = {
      getProduct: vi.fn(() => productResponse)
    };
    routeStub = {
      paramMap: paramMap.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [ProductDetailsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CatalogApiClient,
          useValue: catalogApi
        },
        {
          provide: ActivatedRoute,
          useValue: routeStub
        }
      ]
    });

    cartState = TestBed.inject(CartStateService);
    fixture = TestBed.createComponent(ProductDetailsPageComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    globalThis.sessionStorage.clear();
  });

  it('loads product details from the route product ID', () => {
    createComponent();

    expect(catalogApi.getProduct).toHaveBeenCalledWith('product-1');
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('Whole bean coffee');
    expect(fixture.nativeElement.textContent).toContain('COF-001');
    expect(fixture.nativeElement.textContent).toContain('$12.50');
  });

  it('shows a loading state while product details are loading', () => {
    const pendingResponse = new Subject<CatalogProduct>();

    createComponent(pendingResponse.asObservable());

    expect(fixture.nativeElement.textContent).toContain('Loading product...');

    pendingResponse.complete();
  });

  it('shows not found state for 404 responses', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 404 })));

    expect(fixture.nativeElement.textContent).toContain('Product not found');
    expect(fixture.nativeElement.textContent).toContain('No product exists for this ID.');
  });

  it('shows an error state for non-404 failures', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(fixture.nativeElement.textContent).toContain('Product details could not be loaded. Please try again.');
  });

  it('retries the current product request', () => {
    createComponent(throwError(() => new HttpErrorResponse({ status: 500 })));

    fixture.componentInstance.retry();

    expect(catalogApi.getProduct).toHaveBeenCalledTimes(2);
    expect(catalogApi.getProduct).toHaveBeenCalledWith('product-1');
  });

  it('adds the loaded product to the real local cart from the button click', () => {
    createComponent();

    const addButton = fixture.nativeElement.querySelector('.primary-button') as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();

    expect(cartState.items()).toEqual([
      {
        productId: 'product-1',
        quantity: 1,
        snapshot: {
          name: 'Coffee Beans',
          sku: 'COF-001',
          price: 12.5,
          currencyCode: 'USD',
          imageUrl: undefined,
          isActive: true
        }
      }
    ]);
    expect(cartState.totalQuantity()).toBe(1);
    expect(addButton.textContent).toContain('Added to cart');
  });
});
