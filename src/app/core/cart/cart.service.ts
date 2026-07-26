import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from '../auth/auth.service';

export type CartItem = {
  productId: string;
  quantity: number;
};

const CART_KEY_PREFIX = 'ecommerce.cart';
const GUEST_CART_KEY = `${CART_KEY_PREFIX}.guest`;
const LEGACY_CART_KEY = CART_KEY_PREFIX;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly itemsSignal = signal<CartItem[]>([]);

  readonly items = this.itemsSignal.asReadonly();
  readonly totalItems = computed(() => this.itemsSignal().reduce((sum, i) => sum + i.quantity, 0));

  constructor() {
    this.cleanupLegacyCartStorage();

    effect(
      () => {
        const userId = this.auth.userId();
        if (!this.isBrowser) {
          this.itemsSignal.set([]);
          return;
        }

        this.itemsSignal.set(userId ? this.safeReadUserCart(userId) : this.safeReadGuestCart());
      },
      { allowSignalWrites: true }
    );
  }

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
    this.safeClear();
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
        .map((x) => x as { productId?: unknown; quantity?: unknown })
        .filter((x) => typeof x.productId === 'string' && typeof x.quantity === 'number')
        .map((x) => ({ productId: x.productId as string, quantity: x.quantity as number }));
    } catch {
      return [];
    }
  }
}
