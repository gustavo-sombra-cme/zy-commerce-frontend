import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { CatalogApiClient } from '../../../catalog/data/catalog-api.client';
import { CatalogProductsPage } from '../../../catalog/data/catalog.models';
import { AdminProductsApiClient } from '../data/admin-products-api.client';
import { AdminProductsPageComponent } from './admin-products-page.component';

describe('AdminProductsPageComponent', () => {
  let fixture: ComponentFixture<AdminProductsPageComponent>;
  let queryParamMap: BehaviorSubject<ParamMap>;
  let catalogApi: {
    getProducts: ReturnType<typeof vi.fn>;
  };
  let adminProductsApi: {
    deactivateProduct: ReturnType<typeof vi.fn>;
    reactivateProduct: ReturnType<typeof vi.fn>;
  };
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
      },
      {
        id: 'product-2',
        name: 'Tea Tin',
        description: 'Loose leaf tea',
        sku: 'TEA-001',
        price: 8,
        currencyCode: 'USD',
        isActive: false
      }
    ],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  };

  function createComponent(
    page: CatalogProductsPage = productsPage,
    queryParams: Record<string, string> = {
      searchTerm: 'coffee',
      pageNumber: '1'
    }
  ): void {
    queryParamMap = new BehaviorSubject(convertToParamMap(queryParams));
    catalogApi = {
      getProducts: vi.fn(() => of(page))
    };
    adminProductsApi = {
      deactivateProduct: vi.fn(() => of({})),
      reactivateProduct: vi.fn(() => of({}))
    };
    routeStub = {
      queryParamMap: queryParamMap.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [AdminProductsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: routeStub
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

    fixture = TestBed.createComponent(AdminProductsPageComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders products in a management table with admin actions', () => {
    createComponent();

    expect(catalogApi.getProducts).toHaveBeenCalledWith({
      searchTerm: 'coffee',
      pageNumber: 1,
      pageSize: 10
    });
    expect(fixture.nativeElement.textContent).toContain('Coffee Beans');
    expect(fixture.nativeElement.textContent).toContain('COF-001');
    expect(fixture.nativeElement.textContent).toContain('Edit');
    expect(fixture.nativeElement.textContent).toContain('Price');
    expect(fixture.nativeElement.textContent).toContain('Deactivate');
    expect(fixture.nativeElement.textContent).toContain('Reactivate');
  });

  it('renders combined toolbar controls with the new product action', () => {
    createComponent();

    const toolbar = fixture.nativeElement.querySelector('.admin-toolbar') as HTMLFormElement;

    expect(toolbar).toBeTruthy();
    expect(toolbar.querySelector('input[type="search"]')).toBeTruthy();
    expect(toolbar.querySelector('button[type="submit"]')?.textContent).toContain('Search');
    expect(toolbar.querySelector('.segmented-control')?.textContent).toContain('All');
    expect(toolbar.querySelector('.segmented-control')?.textContent).toContain('Active');
    expect(toolbar.querySelector('.segmented-control')?.textContent).toContain('Inactive');
    expect(toolbar.querySelector('select')?.textContent).toContain('10');
    expect(toolbar.querySelector('.toolbar-create-link')?.textContent).toContain('New product');
  });

  it('renders the expected product table columns', () => {
    createComponent();

    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLTableCellElement>
    ).map((heading) => heading.textContent?.trim());

    expect(headings).toEqual([
      'SKU',
      'Name',
      'Description',
      'Price',
      'Currency',
      'Status',
      'Actions'
    ]);
  });

  it('updates search, status, and per-page controls through query navigation', () => {
    createComponent();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const searchInput = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    searchInput.value = 'tea';
    searchInput.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('.admin-toolbar').dispatchEvent(new Event('submit'));

    expect(navigateSpy).toHaveBeenLastCalledWith([], {
      relativeTo: routeStub,
      queryParams: {
        searchTerm: 'tea',
        pageNumber: 1,
        pageSize: 10
      }
    });

    const inactiveButton = Array.from(
      fixture.nativeElement.querySelectorAll('.segmented-control button') as NodeListOf<HTMLButtonElement>
    )
      .find((button) => button.textContent?.trim() === 'Inactive') as HTMLButtonElement;
    inactiveButton.click();

    expect(navigateSpy).toHaveBeenLastCalledWith([], {
      relativeTo: routeStub,
      queryParams: {
        searchTerm: 'coffee',
        pageNumber: 1,
        pageSize: 10,
        isActive: false
      }
    });

    const pageSizeSelect = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    pageSizeSelect.value = pageSizeSelect.options[1].value;
    pageSizeSelect.dispatchEvent(new Event('change'));

    expect(navigateSpy).toHaveBeenLastCalledWith([], {
      relativeTo: routeStub,
      queryParams: {
        searchTerm: 'coffee',
        pageNumber: 1,
        pageSize: 24
      }
    });
  });

  it('deactivates active products and refreshes the list after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    createComponent();

    const deactivateButton = fixture.nativeElement.querySelector('.danger-button') as HTMLButtonElement;
    deactivateButton.click();
    fixture.detectChanges();

    expect(adminProductsApi.deactivateProduct).toHaveBeenCalledWith('product-1');
    expect(catalogApi.getProducts).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Product deactivated.');
  });

  it('reactivates inactive products and refreshes the list after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    createComponent();

    const reactivateButton = fixture.nativeElement.querySelector('.secondary-button.compact') as HTMLButtonElement;
    reactivateButton.click();
    fixture.detectChanges();

    expect(adminProductsApi.reactivateProduct).toHaveBeenCalledWith('product-2');
    expect(catalogApi.getProducts).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Product reactivated.');
  });

  it('shows Admin access required when the admin list receives a forbidden response', () => {
    queryParamMap = new BehaviorSubject(convertToParamMap({}));
    catalogApi = {
      getProducts: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 403 })))
    };
    adminProductsApi = {
      deactivateProduct: vi.fn(),
      reactivateProduct: vi.fn()
    };
    routeStub = {
      queryParamMap: queryParamMap.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [AdminProductsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: routeStub
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

    fixture = TestBed.createComponent(AdminProductsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin access required.');
  });
});
