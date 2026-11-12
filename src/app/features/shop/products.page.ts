import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney } from '../../core/shop/money';
import { messageFor } from '../../core/shop/problem';
import { ShopApi } from '../../core/shop/shop.api';
import type { Product } from '../../core/shop/shop.types';
import { lowestPrice, stockBadge } from './product-view';

@Component({
  standalone: true,
  selector: 'app-products-page',
  imports: [RouterLink],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <h1>Products</h1>
      @if (error()) {
        <p class="notice notice--error" role="alert">
          {{ error() }} <button class="btn btn--link" type="button" (click)="load(true)">Try again</button>
        </p>
      }
      @if (loading() && products().length === 0) {
        <ul class="grid" aria-busy="true">
          @for (n of [1, 2, 3, 4]; track n) { <li class="skeleton"></li> }
        </ul>
      } @else if (products().length === 0 && !error()) {
        <p class="center muted">No products yet.</p>
      } @else {
        <ul class="grid">
          @for (p of products(); track p.id) {
            <li>
              <a class="card product-card" [routerLink]="['/products', p.id]">
                <h3>{{ p.name }}</h3>
                <span class="price">{{ price(p) }}</span>
                <span class="badge" [class]="badge(p).css">{{ badge(p).label }}</span>
              </a>
            </li>
          }
        </ul>
        @if (more()) {
          <p class="center">
            <button class="btn btn--ghost" type="button" [disabled]="loading()" (click)="load(false)">
              {{ loading() ? 'Loading…' : 'Show more' }}
            </button>
          </p>
        }
      }
    </div>
  `,
})
export class ProductsPage implements OnInit {
  private readonly api = inject(ShopApi);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly more = signal(false);
  readonly error = signal<string | null>(null);
  private cursor: string | null = null;

  ngOnInit(): void {
    this.load(true);
  }

  load(reset: boolean): void {
    if (reset) {
      this.cursor = null;
      this.products.set([]);
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.products(this.cursor).subscribe({
      next: (page) => {
        this.products.update((list) => [...list, ...page.items]);
        this.cursor = page.next_cursor;
        this.more.set(page.has_more);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(messageFor(e, 'We could not load the products.'));
        this.loading.set(false);
      },
    });
  }

  price(p: Product): string {
    const low = lowestPrice(p);
    if (!low) return 'Price not set';
    return (p.skus.length > 1 ? 'From ' : '') + formatMoney(low);
  }

  badge(p: Product) {
    return stockBadge(p.skus);
  }
}
