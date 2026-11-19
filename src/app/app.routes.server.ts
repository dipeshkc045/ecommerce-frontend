import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Browse pages are rendered on the server. Everything that needs a signed-in customer is rendered in the
 * browser: the server has no tokens, so it could only render an error.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'products', renderMode: RenderMode.Server },
  { path: 'products/:id', renderMode: RenderMode.Server },
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'checkout/return', renderMode: RenderMode.Client },
  { path: 'orders', renderMode: RenderMode.Client },
  { path: 'orders/:id', renderMode: RenderMode.Client },
  { path: 'login', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
