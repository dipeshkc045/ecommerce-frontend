import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { CartFacade } from '../../core/facades/cart.facade';
import { FavouriteFacade } from '../../core/facades/favourite.facade';
import { ProductApi, type ProductResponse } from '../../core/api/product.api';
import { FALLBACK_PRODUCTS } from '../products/fallback-products.data';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { toProductCardModelFromApiList } from '../../shared/ui/product-card/product-card.adapter';
import type { ProductCardModel } from '../../shared/ui/product-card/product-card.model';

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
  imports: [RouterLink, CurrencyPipe, ProductCardComponent],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage implements OnInit {
  protected readonly cart = inject(CartService);
  private readonly cartFacade = inject(CartFacade);
  private readonly favouriteFacade = inject(FavouriteFacade);
  private readonly products = inject(ProductApi);
  private readonly router = inject(Router);

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

  readonly quantityOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  private readonly cartItems$ = toObservable(this.cart.items);

  // ─── Cart lines (product enriched & API fallback) ────────────────
  readonly lines = toSignal(
    this.cartItems$.pipe(
      switchMap((items) => {
        if (items.length === 0) return of([] as CartLine[]);

        const lines$ = items.map((item) => {
          if (item.price != null && item.productName) {
            const product: ProductResponse = {
              id: Number(item.productId) || 0,
              name: item.productName,
              description: null,
              price: String(item.price),
              sku: item.sku ?? item.productId,
              categoryId: null,
              categoryName: item.categoryName ?? null,
              active: true,
              imageUrl: item.imageUrl ?? null,
              createdAt: null,
              updatedAt: null,
            };
            return of({ productId: item.productId, quantity: item.quantity, product });
          }

          return this.products.getByIdCached(Number(item.productId)).pipe(
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
          );
        });

        return combineLatest(lines$);
      })
    ),
    { initialValue: [] as CartLine[] }
  );

  // ─── Order summary computed values ──────────────────────────────
  readonly totalItems = computed(() => {
    return this.lines().reduce((sum, l) => sum + l.quantity, 0);
  });

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

  readonly freeShippingRemaining = computed(() => {
    const remaining = FREE_SHIPPING_THRESHOLD - this.subtotal();
    return remaining > 0 ? remaining : 0;
  });

  readonly shippingProgress = computed(() => {
    const pct = (this.subtotal() / FREE_SHIPPING_THRESHOLD) * 100;
    return Math.min(pct, 100);
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

  // ─── Recommendations (from API, filtered by cart) ────────────────
  private readonly _recoRaw = signal<ProductCardModel[]>([]);
  readonly recoLoading = signal(true);

  readonly recommendations = computed(() => {
    return this._recoRaw().slice(0, 5);
  });

  ngOnInit(): void {
    this.loadRecommendations();
  }

  private loadRecommendations(): void {
    this.recoLoading.set(true);
    this.products.getTrending().subscribe({
      next: (data) => {
        this._recoRaw.set(toProductCardModelFromApiList(data));
        this.recoLoading.set(false);
      },
      error: () => {
        this._recoRaw.set([]);
        this.recoLoading.set(false);
      },
    });
  }

  onAddToCart(product: ProductCardModel): void {
    this.cartFacade.addProduct(product.id, 1, {
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.categoryName ?? undefined,
      sku: product.sku,
    });
  }

  onWishlistToggle(product: ProductCardModel): void {
    this.favouriteFacade.toggleFavourite(product.id);
  }

  // ─── Handlers ───────────────────────────────────────────────────
  incrementQuantity(productId: string, currentQty: number): void {
    if (currentQty < 10) {
      this.cart.updateQuantity(productId, currentQty + 1);
    }
  }

  decrementQuantity(productId: string, currentQty: number): void {
    if (currentQty > 1) {
      this.cart.updateQuantity(productId, currentQty - 1);
    }
  }

  goToCheckout(): void {
    this.router.navigateByUrl('/checkout');
  }

  getLineTotal(line: CartLine): number {
    const price = line.product ? Number(line.product.price) : 0;
    return price * line.quantity;
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
}
