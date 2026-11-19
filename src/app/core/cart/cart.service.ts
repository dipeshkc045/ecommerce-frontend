import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, switchMap, tap } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { ShopApi } from '../shop/shop.api';
import type { Cart } from '../shop/shop.types';

/** The customer's cart as the server shows it. Prices and stock always come from the server. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ShopApi);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly state = signal<Cart | null>(null);
  readonly cart = this.state.asReadonly();
  readonly totalItems = computed(() => this.state()?.item_count ?? 0);

  constructor() {
    if (this.isBrowser) {
      // Load when someone signs in, forget when they sign out.
      effect(() => {
        if (this.auth.isLoggedIn()) this.load().subscribe({ error: () => undefined });
        else this.state.set(null);
      });
    }
  }

  load(): Observable<Cart> {
    return this.api.cart().pipe(tap((c) => this.state.set(c)));
  }
  setQuantity(skuId: string, quantity: number): Observable<Cart> {
    return this.api.setQuantity(skuId, quantity).pipe(tap((c) => this.state.set(c)));
  }
  /** Adds to what is already in the cart (the server API sets a quantity, so we add on top of the current one). */
  add(skuId: string, quantity: number): Observable<Cart> {
    const known$ = this.state() ? of(this.state() as Cart) : this.load();
    return known$.pipe(
      switchMap((cart) => {
        const current = cart.lines.find((l) => l.sku_id === skuId)?.quantity ?? 0;
        return this.setQuantity(skuId, current + quantity);
      }),
    );
  }
  remove(skuId: string): Observable<Cart> {
    return this.api.removeLine(skuId).pipe(tap((c) => this.state.set(c)));
  }
  /** Forget the local copy, for example after an order used the cart. */
  reset(): void {
    this.state.set(null);
  }
}
