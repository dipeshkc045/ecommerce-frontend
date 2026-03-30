import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage)
	},
	{
		path: 'home',
		pathMatch: 'full',
		redirectTo: ''
	},
	{
		path: 'products',
		loadComponent: () => import('./features/products/products.page').then((m) => m.ProductsPage)
	},
	{
		path: 'products/:id',
		loadComponent: () => import('./features/products/product-details.page').then((m) => m.ProductDetailsPage)
	},
	{
		path: 'cart',
		loadComponent: () => import('./features/cart/cart.page').then((m) => m.CartPage)
	},
	{
		path: 'checkout',
		loadComponent: () => import('./features/checkout/checkout.page').then((m) => m.CheckoutPage)
	},
	{
		path: 'login',
		loadComponent: () => import('./features/account/login.page').then((m) => m.LoginPage)
	},
	{
		path: 'register',
		loadComponent: () => import('./features/account/register.page').then((m) => m.RegisterPage)
	},
	{
		path: 'orders',
		canActivate: [authGuard],
		loadComponent: () => import('./features/account/orders.page').then((m) => m.OrdersPage)
	},
		{
			path: 'admin/products',
			canActivate: [authGuard],
			loadComponent: () =>
				import('./features/products/admin-products.page').then((m) => m.AdminProductsPage)
		},
	{ path: '**', redirectTo: '' }
];
