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

  addProduct(productId: number | string, quantity = 1): boolean {
    if (!this.authRequired.guard()) return false;
    this.cart.add(String(productId), quantity);
    this.notify.success('Added to cart');
    return true;
  }

  removeProduct(productId: string): void {
    this.cart.remove(productId);
  }

  updateQuantity(productId: string, quantity: number): void {
    this.cart.updateQuantity(productId, quantity);
  }

  clear(): void {
    this.cart.clear();
  }
}
