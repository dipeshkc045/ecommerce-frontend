import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { formatMoney } from '../../core/shop/money';
import { messageFor } from '../../core/shop/problem';
import { ShopApi } from '../../core/shop/shop.api';
import type { PaymentMethod } from '../../core/shop/shop.types';

/** Only http(s) addresses are followed; the payment page is never taken from anything else. */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

@Component({
  standalone: true,
  selector: 'app-checkout-page',
  imports: [FormsModule, RouterLink],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <h1>Checkout</h1>
      @if (error()) {
        <p class="notice notice--error" role="alert">
          {{ error() }} <a routerLink="/cart">Back to cart</a>
        </p>
      }
      @if (!cart.cart()) {
        <div class="skeleton" aria-busy="true"></div>
      } @else if (cart.totalItems() === 0) {
        <div class="card center"><p>Your cart is empty.</p><a class="btn" routerLink="/products">Browse products</a></div>
      } @else {
        <form class="layout-2" (ngSubmit)="place()">
          <fieldset class="card methods">
            <legend><h2>Payment method</h2></legend>
            <label class="method">
              <input type="radio" name="method" value="KHALTI" [ngModel]="method()" (ngModelChange)="method.set($event)" />
              <span><strong>Pay with Khalti</strong><br /><span class="muted">You pay on the Khalti page, then come back here.</span></span>
            </label>
            <label class="method">
              <input type="radio" name="method" value="COD" [ngModel]="method()" (ngModelChange)="method.set($event)" />
              <span><strong>Cash on delivery</strong><br /><span class="muted">Pay when your order arrives.</span></span>
            </label>
          </fieldset>
          <aside class="card summary" aria-label="Order summary">
            <h2>Summary</h2>
            <div class="summary-row"><span>Items ({{ cart.totalItems() }})</span><span>{{ money(cart.cart()?.subtotal) }}</span></div>
            <div class="summary-row"><span>Delivery</span><span>{{ money(cart.cart()?.delivery) }}</span></div>
            <div class="summary-row summary-row--total"><span>Total</span><span>{{ money(cart.cart()?.total) }}</span></div>
            <p class="muted">Prices include 13% VAT.</p>
            <button class="btn btn--block" type="submit" [disabled]="busy()">
              {{ busy() ? 'Placing your order…' : method() === 'KHALTI' ? 'Pay with Khalti' : 'Place order' }}
            </button>
          </aside>
        </form>
      }
    </div>
  `,
})
export class CheckoutPage implements OnInit {
  readonly cart = inject(CartService);
  private readonly api = inject(ShopApi);
  private readonly router = inject(Router);

  readonly method = signal<PaymentMethod>('KHALTI');
  money = formatMoney;
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  /** One key per attempt: pressing the button twice, or a retry after a lost answer, cannot make two orders. */
  private key = newKey();

  ngOnInit(): void {
    this.cart.load().subscribe({ error: (e) => this.error.set(messageFor(e, 'We could not load your cart.')) });
  }


  place(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.placeOrder(this.method(), this.key).subscribe({
      next: (placement) => {
        const url = placement.next_action?.url;
        if (placement.status === 'AWAITING_CUSTOMER_ACTION' && url && isHttpUrl(url)) {
          window.location.assign(url); // leave for the payment page; the cart empties when payment completes
          return;
        }
        this.cart.reset();
        void this.router.navigate(['/orders', placement.order_id], { queryParams: { placed: 1 } });
      },
      error: (e) => {
        this.busy.set(false);
        // A lost connection may still have created the order: keep the key so a retry returns it.
        // Any answer from the server is final for this attempt; the next one starts fresh.
        if (e?.status !== 0) this.key = newKey();
        this.error.set(messageFor(e, 'We could not place your order.'));
        this.cart.load().subscribe({ error: () => undefined });
      },
    });
  }
}

function newKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
