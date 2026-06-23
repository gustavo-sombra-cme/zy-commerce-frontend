import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './core/layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'catalog'
      },
      {
        path: 'catalog',
        loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES)
      },
      {
        path: 'cart',
        loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES)
      },
      {
        path: 'products/:productId',
        loadChildren: () => import('./features/catalog/product-details.routes').then((m) => m.PRODUCT_DETAILS_ROUTES)
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES)
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
      },
      {
        path: 'assistant',
        loadChildren: () => import('./features/mcp-assistant/mcp-assistant.routes').then((m) => m.MCP_ASSISTANT_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'catalog'
  }
];
