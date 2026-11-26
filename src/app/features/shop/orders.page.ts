import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MoneyPipe, NumPipe, TPipe, WhenPipe } from '../../core/i18n/pipes';
import { messageFor } from '../../core/shop/problem';
import { ShopApi } from '../../core/shop/shop.api';
import type { OrderSummary } from '../../core/shop/shop.types';
import { statusLabel } from './order-view';

@Component({
  standalone: true,
  selector: 'app-orders-page',
  imports: [RouterLink, TPipe, MoneyPipe, NumPipe, WhenPipe],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <h1>{{ 'My orders' | t }}</h1>
      @if (error()) {
        <p class="notice notice--error" role="alert">
          {{ error() | t }} <button class="btn btn--link" type="button" (click)="load(true)">{{ 'Try again' | t }}</button>
        </p>
      }
      @if (loading() && orders().length === 0) {
        <div class="skeleton" aria-busy="true"></div>
      } @else if (orders().length === 0 && !error()) {
        <div class="card center"><p>{{ 'You have not ordered anything yet.' | t }}</p><a class="btn" routerLink="/products">{{ 'Browse products' | t }}</a></div>
      } @else {
        <ul class="orders">
          @for (o of orders(); track o.order_id) {
            <li>
              <a class="card order-row" [routerLink]="['/orders', o.order_id]">
                <strong>{{ o.order_number }}</strong>
                <span class="price">{{ o.total | money }}</span>
                <span class="muted">{{ o.placed_at | when }} · {{ (o.item_count === 1 ? '{n} item' : '{n} items') | t: { n: (o.item_count | num) } }}</span>
                <span [class]="status(o.status).css">{{ status(o.status).label | t }}</span>
              </a>
            </li>
          }
        </ul>
        @if (more()) {
          <p class="center">
            <button class="btn btn--ghost" type="button" [disabled]="loading()" (click)="load(false)">
              {{ (loading() ? 'Loading…' : 'Show older orders') | t }}
            </button>
          </p>
        }
      }
    </div>
  `,
})
export class OrdersPage implements OnInit {
  private readonly api = inject(ShopApi);

  readonly orders = signal<OrderSummary[]>([]);
  readonly loading = signal(false);
  readonly more = signal(false);
  readonly error = signal<string | null>(null);
  private cursor: string | null = null;

  status = statusLabel;

  ngOnInit(): void {
    this.load(true);
  }

  load(reset: boolean): void {
    if (reset) {
      this.cursor = null;
      this.orders.set([]);
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.orders(this.cursor).subscribe({
      next: (page) => {
        this.orders.update((l) => [...l, ...page.items]);
        this.cursor = page.next_cursor;
        this.more.set(page.has_more);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(messageFor(e, 'We could not load your orders.'));
      },
    });
  }
}
