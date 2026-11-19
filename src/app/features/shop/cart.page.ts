import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { formatMoney } from '../../core/shop/money';
import { messageFor } from '../../core/shop/problem';

const MAX_QUANTITY = 20;

@Component({
  standalone: true,
  selector: 'app-cart-page',
  imports: [RouterLink],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <h1>Your cart</h1>
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }
      @if (!cart.cart()) {
        <div class="skeleton" aria-busy="true"></div>
      } @else if (lines().length === 0) {
        <div class="card center">
          <p>Your cart is empty.</p>
          <a class="btn" routerLink="/products">Browse products</a>
        </div>
      } @else {
        <div class="layout-2">
          <section class="card" aria-label="Items in your cart">
            <ul class="lines">
              @for (l of lines(); track l.sku_id) {
                <li class="line">
                  <div>
                    <div class="line-name">{{ l.product_name }}</div>
                    @if (l.option) { <div class="muted">{{ l.option }}</div> }
                    <div class="muted">{{ money(l.unit_price) }} each</div>
                    @if (l.message) { <div class="badge badge--bad" role="status">{{ l.message }}</div> }
                  </div>
                  <div class="line-total">{{ money(l.line_total) }}</div>
                  <div class="line-actions">
                    <div class="stepper" role="group" [attr.aria-label]="'Quantity of ' + l.product_name">
                      <button type="button" aria-label="One less" [disabled]="busy() || l.quantity <= 1"
                              (click)="change(l.sku_id, l.quantity - 1)">−</button>
                      <output>{{ l.quantity }}</output>
                      <button type="button" aria-label="One more" [disabled]="busy() || l.quantity >= max"
                              (click)="change(l.sku_id, l.quantity + 1)">+</button>
                    </div>
                    <button class="btn btn--link" type="button" [disabled]="busy()" (click)="remove(l.sku_id)">Remove</button>
                  </div>
                </li>
              }
            </ul>
          </section>
          <aside class="card summary" aria-label="Order summary">
            <h2>Summary</h2>
            <div class="summary-row"><span>Items ({{ cart.totalItems() }})</span><span>{{ money(cart.cart()!.subtotal) }}</span></div>
            <div class="summary-row"><span>Delivery</span><span>{{ money(cart.cart()!.delivery) }}</span></div>
            <div class="summary-row summary-row--total">
              <span>Total</span><span>{{ money(cart.cart()!.total) }}</span>
            </div>
            <p class="muted">Prices include 13% VAT. The exact VAT is shown on your order.</p>
            @if (blocked()) {
              <p class="notice notice--warn">Remove the unavailable items to continue.</p>
            }
            <a class="btn btn--block" routerLink="/checkout" [class.disabled]="blocked()"
               [attr.aria-disabled]="blocked() ? 'true' : null" [attr.tabindex]="blocked() ? -1 : null">Checkout</a>
          </aside>
        </div>
      }
    </div>
  `,
})
export class CartPage implements OnInit {
  readonly cart = inject(CartService);
  readonly max = MAX_QUANTITY;
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly lines = computed(() => this.cart.cart()?.lines ?? []);
  readonly blocked = computed(() => this.lines().some((l) => !l.buyable));

  money = formatMoney;

  ngOnInit(): void {
    this.cart.load().subscribe({ error: (e) => this.error.set(messageFor(e, 'We could not load your cart.')) });
  }

  change(skuId: string, quantity: number): void {
    this.run(this.cart.setQuantity(skuId, quantity));
  }
  remove(skuId: string): void {
    this.run(this.cart.remove(skuId));
  }

  private run(call: ReturnType<CartService['remove']>): void {
    this.busy.set(true);
    this.error.set(null);
    call.subscribe({
      next: () => this.busy.set(false),
      error: (e) => {
        this.busy.set(false);
        this.error.set(messageFor(e, 'We could not change your cart.'));
      },
    });
  }
}
