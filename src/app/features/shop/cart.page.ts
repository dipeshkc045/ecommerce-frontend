import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { MoneyPipe, NumPipe, TPipe, WhenPipe } from '../../core/i18n/pipes';
import { messageFor } from '../../core/shop/problem';

const MAX_QUANTITY = 20;

@Component({
  standalone: true,
  selector: 'app-cart-page',
  imports: [RouterLink, TPipe, MoneyPipe, NumPipe],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <h1>{{ 'Your cart' | t }}</h1>
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() | t }}</p>
      }
      @if (!cart.cart()) {
        <div class="skeleton" aria-busy="true"></div>
      } @else if (lines().length === 0) {
        <div class="card center">
          <p>{{ 'Your cart is empty.' | t }}</p>
          <a class="btn" routerLink="/products">{{ 'Browse products' | t }}</a>
        </div>
      } @else {
        <div class="layout-2">
          <section class="card" [attr.aria-label]="'Items in your cart' | t">
            <ul class="lines">
              @for (l of lines(); track l.sku_id) {
                <li class="line">
                  <div>
                    <div class="line-name">{{ l.product_name }}</div>
                    @if (l.option) { <div class="muted">{{ l.option }}</div> }
                    <div class="muted">{{ '{price} each' | t: { price: (l.unit_price | money) } }}</div>
                    @if (l.message) { <div class="badge badge--bad" role="status">{{ l.message | t }}</div> }
                  </div>
                  <div class="line-total">{{ l.line_total | money }}</div>
                  <div class="line-actions">
                    <div class="stepper" role="group" [attr.aria-label]="'Quantity of {name}' | t: { name: l.product_name }">
                      <button type="button" [attr.aria-label]="'One less' | t" [disabled]="busy() || l.quantity <= 1"
                              (click)="change(l.sku_id, l.quantity - 1)">−</button>
                      <output>{{ l.quantity | num }}</output>
                      <button type="button" [attr.aria-label]="'One more' | t" [disabled]="busy() || l.quantity >= max"
                              (click)="change(l.sku_id, l.quantity + 1)">+</button>
                    </div>
                    <button class="btn btn--link" type="button" [disabled]="busy()" (click)="remove(l.sku_id)">{{ 'Remove' | t }}</button>
                  </div>
                </li>
              }
            </ul>
          </section>
          <aside class="card summary" [attr.aria-label]="'Order summary' | t">
            <h2>{{ 'Summary' | t }}</h2>
            <div class="summary-row"><span>{{ 'Items ({n})' | t: { n: (cart.totalItems() | num) } }}</span><span>{{ cart.cart()!.subtotal | money }}</span></div>
            <div class="summary-row"><span>{{ 'Delivery' | t }}</span><span>{{ cart.cart()!.delivery | money }}</span></div>
            <div class="summary-row summary-row--total">
              <span>{{ 'Total' | t }}</span><span>{{ cart.cart()!.total | money }}</span>
            </div>
            <p class="muted">{{ 'Prices include 13% VAT. The exact VAT is shown on your order.' | t }}</p>
            @if (blocked()) {
              <p class="notice notice--warn">{{ 'Remove the unavailable items to continue.' | t }}</p>
            }
            <a class="btn btn--block" routerLink="/checkout" [class.disabled]="blocked()"
               [attr.aria-disabled]="blocked() ? 'true' : null" [attr.tabindex]="blocked() ? -1 : null">{{ 'Checkout' | t }}</a>
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
