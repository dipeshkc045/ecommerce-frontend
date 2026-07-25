import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { ProductApi, type ProductResponse } from '../../core/api/product.api';
import { AuthRequiredService } from '../../core/auth/auth-required.service';
import { FALLBACK_PRODUCTS } from '../products/fallback-products.data';

type CartLine = {
  productId: string;
  quantity: number;
  product: ProductResponse | null;
};

const TAX_RATE = 0.084;
const SHIPPING_FLAT = 5.0;
const FREE_SHIPPING_THRESHOLD = 150;

@Component({
  standalone: true,
  selector: 'app-cart-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  protected readonly cart = inject(CartService);
  private readonly products = inject(ProductApi);
  private readonly authRequired = inject(AuthRequiredService);
  private readonly router = inject(Router);

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

  readonly quantityOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  private readonly cartItems$ = toObservable(this.cart.items);

  // ─── Cart lines (product enriched) ──────────────────────────────
  readonly lines = toSignal(
    this.cartItems$.pipe(
      switchMap((items) => {
        if (items.length === 0) return of([] as CartLine[]);

        const lines$ = items.map((item) =>
          this.products.getByIdCached(Number(item.productId)).pipe(
            map((product) => ({
              productId: item.productId,
              quantity: item.quantity,
              product,
            })),
            catchError(() =>
              of({
                productId: item.productId,
                quantity: item.quantity,
                product: this.lookupFallback(item.productId),
              })
            )
          )
        );

        return combineLatest(lines$);
      })
    ),
    { initialValue: [] as CartLine[] }
  );

  // ─── Order summary computed values ──────────────────────────────
  readonly subtotal = computed(() => {
    return this.lines().reduce((sum, l) => {
      const price = l.product ? Number(l.product.price) : 0;
      return sum + price * l.quantity;
    }, 0);
  });

  readonly shippingEstimate = computed(() => {
    const sub = this.subtotal();
    if (sub === 0) return 0;
    return sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  });

  readonly taxEstimate = computed(() => {
    return +(this.subtotal() * TAX_RATE).toFixed(2);
  });

  readonly orderTotal = computed(() => {
    return +(
      this.subtotal() +
      this.shippingEstimate() +
      this.taxEstimate()
    ).toFixed(2);
  });

  // ─── Recommendations (4 random from fallback, not in cart) ──────
  readonly recommendations = computed(() => {
    const cartIds = new Set(this.lines().map((l) => Number(l.productId)));
    const available = FALLBACK_PRODUCTS.filter((p) => !cartIds.has(p.id));
    return this.shuffleAndTake(available, 4);
  });

  // ─── Handlers ───────────────────────────────────────────────────
  onQuantityChange(productId: string, event: Event): void {
    const qty = Number((event.target as HTMLSelectElement).value);
    this.cart.updateQuantity(productId, qty);
  }

  goToCheckout(): void {
    if (!this.authRequired.guard()) return;
    this.router.navigateByUrl('/checkout');
  }

  // ─── Helpers ────────────────────────────────────────────────────
  private lookupFallback(productId: string): ProductResponse {
    const numId = Number(productId);
    if (!isNaN(numId)) {
      const match = FALLBACK_PRODUCTS.find((p) => p.id === numId);
      if (match) return match;
    }

    const dashboardMap: Record<string, number> = {
      'p-101': 9069,
      'p-102': 9074,
      'p-103': 9071,
      'p-104': 9084,
      'p-105': 9072,
    };
    const mappedId = dashboardMap[productId];
    if (mappedId) {
      const match = FALLBACK_PRODUCTS.find((p) => p.id === mappedId);
      if (match) return match;
    }

    const hash = Math.abs(this.hashCode(productId)) % FALLBACK_PRODUCTS.length;
    const base = FALLBACK_PRODUCTS[hash] || FALLBACK_PRODUCTS[0];
    return {
      ...base,
      id: !isNaN(numId) ? numId : 9999,
      name: base.name || `Item ${productId}`,
    };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  private shuffleAndTake<T>(arr: T[], n: number): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }
}
