import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

/**
 * Root application routes.
 *
 * Architecture: Shell Layout Pattern
 * - Each layout (Public, Customer, Admin, Auth, Error) is a lazy-loaded standalone component
 * - Layout components own the chrome (header, sidebar, footer)
 * - Feature pages are rendered inside <router-outlet> inside the layout
 * - No feature page renders its own header/footer/sidebar
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/public-layout/public-layout.component').then(
        m => m.PublicLayoutComponent
      ),
    children: [
      {
        path: '',
        data: { breadcrumb: 'Home' },
        loadComponent: () => import('./features/home/home.page').then(m => m.HomePage),
      },
      {
        path: 'products',
        data: { breadcrumb: 'Products' },
        loadComponent: () => import('./features/products/products.page').then(m => m.ProductsPage),
      },
      {
        path: 'products/:id',
        data: { breadcrumb: 'Product Details' },
        loadComponent: () =>
          import('./features/products/product-details.page').then(m => m.ProductDetailsPage),
      },
    ],
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/customer-layout/customer-layout.component').then(
        m => m.CustomerLayoutComponent
      ),
    children: [
      {
        path: 'cart',
        data: { breadcrumb: 'Cart' },
        loadComponent: () => import('./features/cart/cart.page').then(m => m.CartPage),
      },
      {
        path: 'checkout',
        data: { breadcrumb: 'Checkout' },
        loadComponent: () =>
          import('./features/checkout/checkout.page').then(m => m.CheckoutPage),
      },
      {
        path: 'orders',
        data: { breadcrumb: 'My Orders' },
        loadComponent: () =>
          import('./features/account/orders.page').then(m => m.OrdersPage),
      },
      {
        path: 'wishlist',
        data: { breadcrumb: 'Wishlist' },
        loadComponent: () =>
          import('./features/wishlist/wishlist.page').then(m => m.WishlistPage),
      },
      {
        path: 'account',
        data: { breadcrumb: 'My Account' },
        children: [
          {
            path: '',
            data: { breadcrumb: 'Dashboard' },
            loadComponent: () =>
              import('./features/account/dashboard.page').then(m => m.DashboardPage),
          },
          {
            path: 'profile',
            data: { breadcrumb: 'Profile' },
            loadComponent: () =>
              import('./features/account/profile.page').then(m => m.ProfilePage),
          },
        ],
      },
    ],
  },

  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./core/layout/admin-layout/admin-layout.component').then(
        m => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.page').then(
            m => m.AdminDashboardPage
          ),
      },
      {
        path: 'products',
        data: { breadcrumb: 'Products' },
        loadComponent: () =>
          import('./features/products/admin-products.page').then(m => m.AdminProductsPage),
      },
    ],
  },

  {
    path: '',
    loadComponent: () =>
      import('./core/layout/auth-layout/auth-layout.component').then(
        m => m.AuthLayoutComponent
      ),
    children: [
      {
        path: 'login',
        data: { breadcrumb: 'Sign In' },
        loadComponent: () =>
          import('./features/account/login.page').then(m => m.LoginPage),
      },
      {
        path: 'register',
        data: { breadcrumb: 'Create Account' },
        loadComponent: () =>
          import('./features/account/register.page').then(m => m.RegisterPage),
      },
    ],
  },

  {
    path: '',
    loadComponent: () =>
      import('./core/layout/error-layout/error-layout.component').then(
        m => m.ErrorLayoutComponent
      ),
    children: [
      {
        path: '403',
        loadComponent: () =>
          import('./features/errors/forbidden.page').then(m => m.ForbiddenPage),
      },
      {
        path: '500',
        loadComponent: () =>
          import('./features/errors/server-error.page').then(m => m.ServerErrorPage),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found.page').then(m => m.NotFoundPage),
  },
];
