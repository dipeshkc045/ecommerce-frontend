import { Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { ShopApi } from '../shop/shop.api';
import type { Cart } from '../shop/shop.types';

/**
 * The shopper's cart as the server shows it. Prices and stock always come from the server.
 *
 * Guests have a cart too (ADR-0025): the server keys it by an HttpOnly `guest_cart` cookie, so the app sends the same
 * calls with no token. When someone is signed in, the guest cart is merged into theirs first (the merge is safe to
 * repeat and, with no guest cookie, just returns the customer's cart).
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ShopApi);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly state = signal<Cart | null>(null);
  readonly cart = this.state.asReadonly();
  readonly totalItems = computed(() => this.state()?.item_count ?? 0);

  /** A merge still on its way: reads wait for it, so they never show the cart from before the merge. */
  private merging: Observable<unknown> | null = null;

  constructor() {
    if (this.isBrowser) {
      this.auth.ensureLoaded(); // know who is signed in before the first read, so a customer never asks for a guest cart
      // Signing in merges the guest cart into the customer's; signing out shows the (now empty) guest cart.
      effect(() => {
        const signedIn = this.auth.isLoggedIn();
        untracked(() => {
          this.state.set(null);
          (signedIn ? this.merge() : this.load()).subscribe({ error: () => undefined });
        });
      });
    }
  }

  load(): Observable<Cart> {
    const read$ = this.api.cart().pipe(tap((c) => this.state.set(c)));
    return this.merging ? this.merging.pipe(switchMap(() => read$)) : read$;
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

  /** Moves the guest cart into the signed-in customer's cart and shows the result. */
  private merge(): Observable<Cart> {
    const merge$: Observable<Cart> = this.api.mergeCart().pipe(
      map((m) => m.cart),
      tap((c) => this.state.set(c)),
      finalize(() => {
        if (this.merging === wait$) this.merging = null;
      }),
      shareReplay(1),
    );
    const wait$ = merge$.pipe(catchError(() => of(null))); // a failed merge must not stop the cart from being read
    this.merging = wait$;
    return merge$;
  }
}
