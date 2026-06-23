import { Routes } from '@angular/router';

import { adminGuard } from '../../core/auth/admin.guard';
import { AdminAccessDeniedPageComponent } from './admin-access-denied-page/admin-access-denied-page.component';
import { AdminProductCreatePageComponent } from './products/admin-product-create-page/admin-product-create-page.component';
import { AdminProductEditPageComponent } from './products/admin-product-edit-page/admin-product-edit-page.component';
import { AdminProductsPageComponent } from './products/admin-products-page/admin-products-page.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'access-denied',
    component: AdminAccessDeniedPageComponent
  },
  {
    path: 'products',
    canActivate: [adminGuard],
    component: AdminProductsPageComponent
  },
  {
    path: 'products/new',
    canActivate: [adminGuard],
    component: AdminProductCreatePageComponent
  },
  {
    path: 'products/:productId/edit',
    canActivate: [adminGuard],
    component: AdminProductEditPageComponent
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'products'
  }
];
