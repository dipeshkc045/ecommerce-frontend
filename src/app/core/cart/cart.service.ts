import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from '../auth/auth.service';
import { CartApi, type CartItemApiDto } from '../api/cart.api';

export type CartItem = {
  productId: string;
  quantity: number;
  productName?: string;
  price?: number;
  imageUrl?: string;
  categoryName?: string;
  sku?: string;
};

const CART_KEY_PREFIX = 'ecommerce.cart';
const GUEST_CART_KEY = `${CART_KEY_PREFIX}.guest`;
const LEGACY_CART_KEY = CART_KEY_PREFIX;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly cartApi = inject(CartApi);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly itemsSignal = signal<CartItem[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly items = this.itemsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly totalItems = computed(() => this.itemsSignal().reduce((sum, i) => sum + i.quantity, 0));

  constructor() {
    this.cleanupLegacyCartStorage();

    effect(
      () => {
        const userId = this.auth.userId();
        const isLoggedIn = this.auth.isLoggedIn();

        if (!this.isBrowser) {
          this.itemsSignal.set([]);
          return;
        }

        if (isLoggedIn && userId) {
          // Check if there are guest cart items to merge
          const guestItems = this.safeReadGuestCart();
          if (guestItems.length > 0) {
            this.mergeGuestCartWithServer(guestItems);
          } else {
            this.loadCartFromServer();
          }
        } else {
          this.itemsSignal.set(this.safeReadGuestCart());
        }
      },
      { allowSignalWrites: true }
    );
  }

  /** Load cart from server API */
  loadCartFromServer(): void {
    if (!this.auth.isLoggedIn()) return;

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.cartApi.getCart().subscribe({
      next: (cartResponse) => {
        const mappedItems = this.mapApiItemsToDomain(cartResponse.items ?? []);
        this.itemsSignal.set(mappedItems);
        if (this.auth.userId()) {
          this.safeWrite(mappedItems);
        }
        this.loadingSignal.set(false);
      },
      error: () => {
        // Fallback to local storage if API call fails
        const userId = this.auth.userId();
        if (userId) {
          this.itemsSignal.set(this.safeReadUserCart(userId));
        }
        this.loadingSignal.set(false);
      },
    });
  }

  /** Add item to cart (optimistic + API sync) */
  add(productId: string, quantity = 1, product?: { name?: string; price?: number; imageUrl?: string; categoryName?: string; sku?: string }): void {
    const items = this.itemsSignal();
    const existing = items.find((i) => i.productId === productId);

    const next = existing
      ? items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i))
      : [...items, {
          productId,
          quantity,
          productName: product?.name,
          price: product?.price,
          imageUrl: product?.imageUrl,
          categoryName: product?.categoryName,
          sku: product?.sku,
        }];

    // Optimistic local update
    this.itemsSignal.set(next);
    this.safeWrite(next);

    // Sync with backend API if user is logged in
    if (this.auth.isLoggedIn()) {
      this.cartApi.addItem({ productId, quantity }).subscribe({
        next: (cartResponse) => {
          if (cartResponse?.items) {
            this.itemsSignal.set(this.mapApiItemsToDomain(cartResponse.items));
          }
        },
        error: () => {
          // Keep local state on error
        },
      });
    }
  }

  /** Remove item from cart (optimistic + API sync) */
  remove(productId: string): void {
    const next = this.itemsSignal().filter((i) => i.productId !== productId);

    // Optimistic local update
    this.itemsSignal.set(next);
    this.safeWrite(next);

    // Sync with backend API if user is logged in
    if (this.auth.isLoggedIn()) {
      this.cartApi.removeItem(productId).subscribe({
        next: (res) => {
          if (res && 'items' in res && res.items) {
            this.itemsSignal.set(this.mapApiItemsToDomain(res.items));
          }
        },
        error: () => {
          // Keep local state on error
        },
      });
    }
  }

  /** Update quantity of cart item (optimistic + API sync) */
  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }

    const next = this.itemsSignal().map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );

    // Optimistic local update
    this.itemsSignal.set(next);
    this.safeWrite(next);

    // Sync with backend API if user is logged in
    if (this.auth.isLoggedIn()) {
      this.cartApi.updateItemQuantity(productId, quantity).subscribe({
        next: (cartResponse) => {
          if (cartResponse?.items) {
            this.itemsSignal.set(this.mapApiItemsToDomain(cartResponse.items));
          }
        },
        error: () => {
          // Keep local state on error
        },
      });
    }
  }

  /** Clear all items from cart (optimistic + API sync) */
  clear(): void {
    this.itemsSignal.set([]);
    this.safeClear();

    if (this.auth.isLoggedIn()) {
      this.cartApi.clearCart().subscribe({
        error: () => {
          // Ignore error
        },
      });
    }
  }

  private mergeGuestCartWithServer(guestItems: CartItem[]): void {
    const payload = {
      items: guestItems.map((gi) => ({ productId: gi.productId, quantity: gi.quantity })),
    };

    this.loadingSignal.set(true);
    this.cartApi.mergeCart(payload).subscribe({
      next: (cartResponse) => {
        const mergedItems = this.mapApiItemsToDomain(cartResponse.items ?? []);
        this.itemsSignal.set(mergedItems);
        // Clear guest storage after successful merge
        try {
          sessionStorage.removeItem(GUEST_CART_KEY);
        } catch {
          // ignore storage error
        }
        if (this.auth.userId()) {
          this.safeWrite(mergedItems);
        }
        this.loadingSignal.set(false);
      },
      error: () => {
        // Fallback to loading server cart directly
        this.loadCartFromServer();
      },
    });
  }

  private mapApiItemsToDomain(apiItems: CartItemApiDto[]): CartItem[] {
    return apiItems.map((item) => ({
      productId: String(item.productId),
      quantity: item.quantity,
      productName: item.productName ?? undefined,
      price: item.unitPrice != null ? Number(item.unitPrice) : undefined,
      imageUrl: item.imageUrl ?? undefined,
      sku: item.sku ?? undefined,
    }));
  }

  private storageKey(userId: string): string {
    return `${CART_KEY_PREFIX}.${userId}`;
  }

  private safeReadUserCart(userId: string): CartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey(userId));
      return this.parseItems(raw);
    } catch {
      return [];
    }
  }

  private safeReadGuestCart(): CartItem[] {
    try {
      const raw = sessionStorage.getItem(GUEST_CART_KEY);
      return this.parseItems(raw);
    } catch {
      return [];
    }
  }

  private safeWrite(items: CartItem[]): void {
    if (!this.isBrowser) return;
    const userId = this.auth.userId();

    try {
      if (userId) {
        localStorage.setItem(this.storageKey(userId), JSON.stringify(items));
      } else {
        sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
      }
    } catch {
      // ignore storage errors
    }
  }

  private safeClear(): void {
    if (!this.isBrowser) return;
    const userId = this.auth.userId();

    try {
      if (userId) {
        localStorage.removeItem(this.storageKey(userId));
      } else {
        sessionStorage.removeItem(GUEST_CART_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }

  private cleanupLegacyCartStorage(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch {
      // ignore storage errors
    }
  }

  private parseItems(raw: string | null): CartItem[] {
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((x) => x && typeof x === 'object')
        .map((x) => x as { productId?: unknown; quantity?: unknown; productName?: unknown; price?: unknown; imageUrl?: unknown })
        .filter((x) => typeof x.productId === 'string' || typeof x.productId === 'number')
        .map((x) => ({
          productId: String(x.productId),
          quantity: typeof x.quantity === 'number' ? x.quantity : 1,
          productName: typeof x.productName === 'string' ? x.productName : undefined,
          price: typeof x.price === 'number' ? x.price : undefined,
          imageUrl: typeof x.imageUrl === 'string' ? x.imageUrl : undefined,
        }));
    } catch {
      return [];
    }
  }
}
