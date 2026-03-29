import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type CartItem = {
  productId: string;
  quantity: number;
};

const CART_KEY = 'ecommerce.cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly itemsSignal = signal<CartItem[]>(this.isBrowser ? this.safeRead() : []);

  readonly items = this.itemsSignal.asReadonly();
  readonly totalItems = computed(() => this.itemsSignal().reduce((sum, i) => sum + i.quantity, 0));

  add(productId: string, quantity = 1): void {
    const items = this.itemsSignal();
    const existing = items.find((i) => i.productId === productId);

    const next = existing
      ? items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i))
      : [...items, { productId, quantity }];

    this.itemsSignal.set(next);
    this.safeWrite(next);
  }

  remove(productId: string): void {
    const next = this.itemsSignal().filter((i) => i.productId !== productId);
    this.itemsSignal.set(next);
    this.safeWrite(next);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }
    const next = this.itemsSignal().map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    this.itemsSignal.set(next);
    this.safeWrite(next);
  }

  clear(): void {
    this.itemsSignal.set([]);
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // ignore storage errors
    }
  }

  private safeRead(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((x) => x && typeof x === 'object')
        .map((x) => x as { productId?: unknown; quantity?: unknown })
        .filter((x) => typeof x.productId === 'string' && typeof x.quantity === 'number')
        .map((x) => ({ productId: x.productId as string, quantity: x.quantity as number }));
    } catch {
      return [];
    }
  }

  private safeWrite(items: CartItem[]): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }
}
