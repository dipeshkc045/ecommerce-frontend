import { describe, expect, it } from 'vitest';
import type { Route } from '@angular/router';

import { routes } from './app.routes';
import { authGuard } from './core/auth/auth.guard';

/** Each path with whether a sign-in guard sits on it or on any parent. */
function guarded(list: Route[], parent = '', parentGuarded = false): Map<string, boolean> {
  const out = new Map<string, boolean>();
  for (const r of list) {
    const path = [parent, r.path].filter(Boolean).join('/');
    const g = parentGuarded || !!r.canActivate?.includes(authGuard);
    if (r.loadComponent) out.set(path, g);
    for (const [k, v] of guarded(r.children ?? [], path, g)) out.set(k, v);
  }
  return out;
}

describe('routes', () => {
  const map = guarded(routes);

  it('lets guests use the cart and checkout (doc 01 §3, ADR-0025)', () => {
    expect(map.get('cart')).toBe(false);
    expect(map.get('checkout')).toBe(false);
    expect(map.get('checkout/return')).toBe(false);
  });

  it('keeps order history behind sign-in', () => {
    expect(map.get('orders')).toBe(true);
    expect(map.get('orders/:id')).toBe(true);
  });
});
