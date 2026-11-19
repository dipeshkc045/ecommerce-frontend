import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/**
 * Shell layout pattern: each layout owns the chrome, feature pages render inside its outlet.
 * Customer pages (cart, checkout, orders) sit behind the sign-in guard.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        title: 'Products',
        loadComponent: () => import('./features/shop/products.page').then(m => m.ProductsPage),
      },
      {
        path: 'products/:id',
        title: 'Product',
        loadComponent: () => import('./features/shop/product.page').then(m => m.ProductPage),
      },
      {
        path: '',
        canActivate: [authGuard],
        children: [
          {
            path: 'cart',
            title: 'Your cart',
            loadComponent: () => import('./features/shop/cart.page').then(m => m.CartPage),
          },
          {
            path: 'checkout',
            title: 'Checkout',
            loadComponent: () => import('./features/shop/checkout.page').then(m => m.CheckoutPage),
          },
          {
            path: 'checkout/return',
            title: 'Your payment',
            loadComponent: () =>
              import('./features/shop/checkout-return.page').then(m => m.CheckoutReturnPage),
          },
          {
            path: 'orders',
            title: 'My orders',
            loadComponent: () => import('./features/shop/orders.page').then(m => m.OrdersPage),
          },
          {
            path: 'orders/:id',
            title: 'Order',
            loadComponent: () => import('./features/shop/order.page').then(m => m.OrderPage),
          },
        ],
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        title: 'Sign in',
        loadComponent: () => import('./features/shop/login.page').then(m => m.LoginPage),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/errors/not-found.page').then(m => m.NotFoundPage),
  },
];
