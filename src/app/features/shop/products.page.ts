import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MoneyPipe, NumPipe, TPipe, WhenPipe } from '../../core/i18n/pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { messageFor } from '../../core/shop/problem';
import { ProductPicture } from './product-picture';
import { ShopApi } from '../../core/shop/shop.api';
import type { Product } from '../../core/shop/shop.types';
import { lowestPrice, stockBadge } from './product-view';

@Component({
  standalone: true,
  selector: 'app-products-page',
  imports: [RouterLink, ProductPicture, TPipe, MoneyPipe],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <h1>{{ 'Products' | t }}</h1>
      @if (error()) {
        <p class="notice notice--error" role="alert">
          {{ error() | t }} <button class="btn btn--link" type="button" (click)="load(true)">{{ 'Try again' | t }}</button>
        </p>
      }
      @if (loading() && products().length === 0) {
        <ul class="grid" aria-busy="true">
          @for (n of [1, 2, 3, 4]; track n) { <li class="skeleton"></li> }
        </ul>
      } @else if (products().length === 0 && !error()) {
        <p class="center muted">{{ 'No products yet.' | t }}</p>
      } @else {
        <ul class="grid">
          @for (p of products(); track p.id) {
            <li>
              <a class="card product-card" [routerLink]="['/products', p.id]">
                <app-product-picture [image]="p.images?.[0]" sizes="(max-width: 500px) calc(100vw - 64px), (max-width: 760px) calc(50vw - 48px), 260px" />
                <h3>{{ p.name }}</h3>
                <span class="price">
                  @if (low(p); as l) { @if (p.skus.length > 1) { {{ 'From' | t }} } {{ l | money }} } @else { {{ 'Price not set' | t }} }
                </span>
                <span class="badge" [class]="badge(p).css">{{ badge(p).label | t }}</span>
              </a>
            </li>
          }
        </ul>
        @if (more()) {
          <p class="center">
            <button class="btn btn--ghost" type="button" [disabled]="loading()" (click)="load(false)">
              {{ (loading() ? 'Loading…' : 'Show more') | t }}
            </button>
          </p>
        }
      }
    </div>
  `,
})
export class ProductsPage {
  private readonly api = inject(ShopApi);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly more = signal(false);
  readonly error = signal<string | null>(null);
  private cursor: string | null = null;

  private readonly i18n = inject(I18nService);

  constructor() {
    // The first load, and again whenever the language changes: product names come from the catalog in that language
    effect(() => {
      this.i18n.lang();
      untracked(() => this.load(true));
    });
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

  low = lowestPrice;

  badge(p: Product) {
    return stockBadge(p.skus);
  }
}
