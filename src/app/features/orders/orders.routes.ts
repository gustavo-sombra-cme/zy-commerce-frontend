import { Routes } from '@angular/router';

import { CheckoutPageComponent } from './checkout-page/checkout-page.component';
import { OrderDetailsPageComponent } from './order-details-page/order-details-page.component';
import { OrdersPageComponent } from './orders-page/orders-page.component';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: OrdersPageComponent
  },
  {
    path: 'checkout',
    component: CheckoutPageComponent
  },
  {
    path: ':orderId',
    component: OrderDetailsPageComponent
  }
];
