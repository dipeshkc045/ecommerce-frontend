import { Injectable, inject } from '@angular/core';

import { CartService } from '../cart/cart.service';
import { AuthRequiredService } from '../auth/auth-required.service';
import { NotificationService } from '../services/notification.service';

@Injectable({ providedIn: 'root' })
export class CartFacade {
  private readonly cart = inject(CartService);
  private readonly authRequired = inject(AuthRequiredService);
  private readonly notify = inject(NotificationService);

  readonly items = this.cart.items;
  readonly totalItems = this.cart.totalItems;
  readonly loading = this.cart.loading;
  readonly error = this.cart.error;

  addProduct(productId: number | string, quantity = 1, product?: { name?: string; price?: number; imageUrl?: string; categoryName?: string; sku?: string }): boolean {
    if (!this.authRequired.guard()) return false;
    this.cart.add(String(productId), quantity, product);
    this.notify.success('Added to cart');
    return true;
  }

  removeProduct(productId: string): void {
    this.cart.remove(productId);
    this.notify.info('Item removed from cart');
  }

  updateQuantity(productId: string, quantity: number): void {
    this.cart.updateQuantity(productId, quantity);
  }

  clear(): void {
    this.cart.clear();
    this.notify.info('Cart cleared');
  }

  refreshCart(): void {
    this.cart.loadCartFromServer();
  }
}
