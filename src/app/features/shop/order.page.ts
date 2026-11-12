import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { formatMoney } from '../../core/shop/money';
import { messageFor } from '../../core/shop/problem';
import { ShopApi } from '../../core/shop/shop.api';
import type { OrderDetail } from '../../core/shop/shop.types';
import { methodLabel, statusLabel } from './order-view';

@Component({
  standalone: true,
  selector: 'app-order-page',
  imports: [RouterLink, DatePipe],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <p><a routerLink="/orders">← My orders</a></p>
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }
      @if (detail(); as d) {
        @if (placed && d.order.status !== 'CANCELLED') {
          <p class="notice notice--ok" role="status">Thank you! Your order {{ d.order.order_number }} was placed.</p>
        }
        <h1>Order {{ d.order.order_number }}</h1>
        <p>
          <span [class]="status(d.order.status).css">{{ status(d.order.status).label }}</span>
          <span class="muted"> · {{ d.order.placed_at | date: 'medium' }} · {{ method(d.order.payment_method) }}</span>
        </p>
        <div class="layout-2">
          <section class="card" aria-label="Items">
            <ul class="lines">
              @for (l of d.lines; track l.sku_id) {
                <li class="line">
                  <div>
                    <div class="line-name">{{ l.product_name }}</div>
                    @if (l.option) { <div class="muted">{{ l.option }}</div> }
                    <div class="muted">{{ l.quantity }} × {{ money(l.unit_price) }}</div>
                  </div>
                  <div class="line-total">{{ money(l.line_total) }}</div>
                </li>
              }
            </ul>
          </section>
          <aside class="card summary" aria-label="Totals">
            <h2>Totals</h2>
            <div class="summary-row"><span>Items</span><span>{{ money(d.items_total) }}</span></div>
            <div class="summary-row"><span>Delivery</span><span>{{ money(d.shipping_total) }}</span></div>
            <div class="summary-row summary-row--total"><span>Total</span><span>{{ money(d.order.total) }}</span></div>
            <p class="muted">
              {{ d.prices_include_vat ? 'Includes' : 'Plus' }} VAT of {{ money(d.vat_included) }}.
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

  money = formatMoney;
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
