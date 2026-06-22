import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { CatalogApiClient } from '../data/catalog-api.client';
import { CatalogProductsPage } from '../data/catalog.models';
import { CartStateService } from '../../cart/data/cart-state.service';
import { CartPageComponent } from '../../cart/cart-page/cart-page.component';
import { CatalogPageComponent } from './catalog-page.component';

describe('CatalogPageComponent', () => {
  let fixture: ComponentFixture<CatalogPageComponent>;
  let queryParamMap: BehaviorSubject<ParamMap>;
  let catalogApi: {
    getProducts: ReturnType<typeof vi.fn>;
  };
  let cartState: CartStateService;
  let routeStub: {
    queryParamMap: ReturnType<BehaviorSubject<ParamMap>['asObservable']>;
  };

  const productsPage: CatalogProductsPage = {
    items: [
      {
        id: 'product-1',
        name: 'Coffee Beans',
        description: 'Whole bean coffee',
        sku: 'COF-001',
        price: 12.5,
        currencyCode: 'USD',
        isActive: true
      }
    ],
    pageNumber: 2,
    pageSize: 12,
    totalCount: 25,
    totalPages: 3,
    hasPreviousPage: true,
    hasNextPage: true
  };

  function createComponent(page: CatalogProductsPage = productsPage): void {
    globalThis.sessionStorage.clear();
    queryParamMap = new BehaviorSubject(convertToParamMap({
      searchTerm: 'coffee',
      isActive: 'true',
      pageNumber: '2',
      pageSize: '12'
    }));
    catalogApi = {
      getProducts: vi.fn(() => of(page))
    };
    routeStub = {
      queryParamMap: queryParamMap.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [CatalogPageComponent, CartPageComponent],
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
    fixture = TestBed.createComponent(CatalogPageComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    globalThis.sessionStorage.clear();
  });

  it('loads products from URL query params and renders product cards', () => {
    createComponent();

    expect(catalogApi.getProducts).toHaveBeenCalledWith({
      searchTerm: 'coffee',
      isActive: true,
      pageNumber: 2,
      pageSize: 12
    });
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('Whole bean coffee');
    expect(fixture.nativeElement.textContent).toContain('Showing 13-24 of 25');
  });

  it('links product cards to the product details route', () => {
    createComponent();

    const productCard = fixture.nativeElement.querySelector('.product-card-link') as HTMLAnchorElement | null;

    expect(productCard?.getAttribute('href')).toBe('/products/product-1');
    expect(productCard?.getAttribute('aria-label')).toBe('View details for Coffee Beans');
  });

  it('adds catalog products to the real local cart from the button click', () => {
    createComponent();

    const addButton = fixture.nativeElement.querySelector('.add-button') as HTMLButtonElement;
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
    expect(addButton.textContent).toContain('Added');

    const cartFixture = TestBed.createComponent(CartPageComponent);
    cartFixture.detectChanges();

    expect(cartFixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(cartFixture.nativeElement.textContent).toContain('COF-001');
  });

  it('keeps the add button outside the product details router link', () => {
    createComponent();

    const productLink = fixture.nativeElement.querySelector('.product-card-link') as HTMLAnchorElement;
    const addButton = fixture.nativeElement.querySelector('.add-button') as HTMLButtonElement;

    expect(productLink.contains(addButton)).toBe(false);
  });

  it('shows a loading state while products are loading', () => {
    const pendingResponse = new Subject<CatalogProductsPage>();
    queryParamMap = new BehaviorSubject(convertToParamMap({}));
    catalogApi = {
      getProducts: vi.fn(() => pendingResponse.asObservable())
    };
    routeStub = {
      queryParamMap: queryParamMap.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [CatalogPageComponent],
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

    fixture = TestBed.createComponent(CatalogPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading products...');

    pendingResponse.complete();
  });

  it('shows an empty state when no products are returned', () => {
    createComponent({
      items: [],
      pageNumber: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    });

    expect(fixture.nativeElement.textContent).toContain('No products found.');
  });

  it('shows an error state when product loading fails', () => {
    queryParamMap = new BehaviorSubject(convertToParamMap({}));
    catalogApi = {
      getProducts: vi.fn(() => throwError(() => new Error('Request failed')))
    };
    routeStub = {
      queryParamMap: queryParamMap.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [CatalogPageComponent],
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

    fixture = TestBed.createComponent(CatalogPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Products could not be loaded. Please try again.');
  });

  it('submits search and writes active filter state to URL query params', () => {
    createComponent();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const searchForm = fixture.nativeElement.querySelector('.catalog-toolbar') as HTMLFormElement;

    fixture.componentInstance.searchControl.setValue('  tea  ');
    searchForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    fixture.componentInstance.setActiveFilter('all');
    fixture.componentInstance.setActiveFilter('active');
    fixture.componentInstance.setActiveFilter('inactive');

    expect(navigate).toHaveBeenNthCalledWith(1, [], {
      relativeTo: routeStub,
      queryParams: {
        searchTerm: 'tea',
        pageNumber: 1,
        pageSize: 12,
        isActive: true
      }
    });
    expect(navigate).toHaveBeenNthCalledWith(2, [], {
      relativeTo: routeStub,
      queryParams: {
        searchTerm: 'coffee',
        pageNumber: 1,
        pageSize: 12
      }
    });
    expect(navigate).toHaveBeenNthCalledWith(3, [], {
      relativeTo: routeStub,
      queryParams: {
        searchTerm: 'coffee',
        pageNumber: 1,
        pageSize: 12,
        isActive: true
      }
    });
    expect(navigate).toHaveBeenNthCalledWith(4, [], {
      relativeTo: routeStub,
      queryParams: {
        searchTerm: 'coffee',
        pageNumber: 1,
        pageSize: 12,
        isActive: false
      }
    });
  });

  it('reloads catalog products when search query params change', () => {
    createComponent();

    queryParamMap.next(convertToParamMap({
      searchTerm: 'tea',
      isActive: 'false',
      pageNumber: '1',
      pageSize: '24'
    }));
    fixture.detectChanges();

    expect(catalogApi.getProducts).toHaveBeenLastCalledWith({
      searchTerm: 'tea',
      isActive: false,
      pageNumber: 1,
      pageSize: 24
    });
  });

  it('omits isActive from the catalog request state when all products are selected', () => {
    createComponent();

    queryParamMap.next(convertToParamMap({
      searchTerm: 'tea',
      pageNumber: '1',
      pageSize: '24'
    }));
    fixture.detectChanges();

    expect(catalogApi.getProducts).toHaveBeenLastCalledWith({
      searchTerm: 'tea',
      pageNumber: 1,
      pageSize: 24
    });
  });
});
