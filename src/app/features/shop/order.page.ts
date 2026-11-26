import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MoneyPipe, NumPipe, TPipe, WhenPipe } from '../../core/i18n/pipes';
import { messageFor } from '../../core/shop/problem';
import { ShopApi } from '../../core/shop/shop.api';
import type { OrderDetail } from '../../core/shop/shop.types';
import { methodLabel, statusLabel } from './order-view';

@Component({
  standalone: true,
  selector: 'app-order-page',
  imports: [RouterLink, TPipe, MoneyPipe, NumPipe, WhenPipe],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <p><a routerLink="/orders">{{ '← My orders' | t }}</a></p>
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() | t }}</p>
      }
      @if (detail(); as d) {
        @if (placed && d.order.status !== 'CANCELLED') {
          <p class="notice notice--ok" role="status">{{ 'Thank you! Your order {number} was placed.' | t: { number: d.order.order_number } }}</p>
        }
        <h1>{{ 'Order {number}' | t: { number: d.order.order_number } }}</h1>
        <p>
          <span [class]="status(d.order.status).css">{{ status(d.order.status).label | t }}</span>
          <span class="muted"> · {{ d.order.placed_at | when: true }} · {{ method(d.order.payment_method) | t }}</span>
        </p>
        <div class="layout-2">
          <section class="card" [attr.aria-label]="'Items' | t">
            <ul class="lines">
              @for (l of d.lines; track l.sku_id) {
                <li class="line">
                  <div>
                    <div class="line-name">{{ l.product_name }}</div>
                    @if (l.option) { <div class="muted">{{ l.option }}</div> }
                    <div class="muted">{{ l.quantity | num }} × {{ l.unit_price | money }}</div>
                  </div>
                  <div class="line-total">{{ l.line_total | money }}</div>
                </li>
              }
            </ul>
          </section>
          <aside class="card summary" [attr.aria-label]="'Totals' | t">
            <h2>{{ 'Totals' | t }}</h2>
            <div class="summary-row"><span>{{ 'Items' | t }}</span><span>{{ d.items_total | money }}</span></div>
            <div class="summary-row"><span>{{ 'Delivery' | t }}</span><span>{{ d.shipping_total | money }}</span></div>
            <div class="summary-row summary-row--total"><span>{{ 'Total' | t }}</span><span>{{ d.order.total | money }}</span></div>
            <p class="muted">
              {{ (d.prices_include_vat ? 'Includes VAT of {amount}.' : 'Plus VAT of {amount}.') | t: { amount: (d.vat_included | money) } }}
            </p>
          </aside>
        </div>
      } @else if (!error()) {
        <div class="skeleton" aria-busy="true"></div>
      }
    </div>
  `,
})
export class OrderPage {
  private readonly api = inject(ShopApi);
  readonly id = input.required<string>();

  readonly detail = signal<OrderDetail | null>(null);
  readonly error = signal<string | null>(null);
  readonly placed = inject(ActivatedRoute).snapshot.queryParamMap.has('placed');

  status = statusLabel;
  method = methodLabel;

  constructor() {
    effect(() => {
      this.detail.set(null);
      this.error.set(null);
      this.api.order(this.id()).subscribe({
        next: (d) => this.detail.set(d),
        error: (e) => this.error.set(e?.status === 404 ? 'We could not find this order.' : messageFor(e, 'We could not load this order.')),
      });
    });
  }
}
