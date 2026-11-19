import { ChangeDetectionStrategy, Component, computed, inject, input, signal, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { formatMoney } from '../../core/shop/money';
import { messageFor } from '../../core/shop/problem';
import { ShopApi } from '../../core/shop/shop.api';
import type { Product, Sku } from '../../core/shop/shop.types';
import { skuBadge } from './product-view';

@Component({
  standalone: true,
  selector: 'app-product-page',
  imports: [RouterLink],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <p><a routerLink="/products">← All products</a></p>
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }
      @if (product(); as p) {
        <article class="card">
          <h1>{{ p.name }}</h1>
          @if (p.description) { <p>{{ p.description }}</p> }

          @if (p.skus.length > 1) {
            <div class="field">
              <label for="sku">Option</label>
              <select id="sku" [value]="selectedId()" (change)="selectedId.set($any($event.target).value)">
                @for (s of p.skus; track s.sku_id) {
                  <option [value]="s.sku_id">{{ s.option || s.sku_code }}</option>
                }
              </select>
            </div>
          }

          @if (selected(); as s) {
            <p class="price">{{ s.price ? money(s.price) : 'Price not set' }}</p>
            <p><span [class]="badge(s).css">{{ badge(s).label }}</span> <span class="muted">Price includes VAT</span></p>
            <button class="btn" type="button" [disabled]="!canBuy(s) || adding()" (click)="add(s)">
              {{ adding() ? 'Adding…' : 'Add to cart' }}
            </button>
            @if (added()) {
              <p class="notice notice--ok" role="status">
                Added. <a routerLink="/cart">View cart</a>
              </p>
            }
          }
        </article>
      } @else if (!error()) {
        <div class="skeleton" aria-busy="true"></div>
      }
    </div>
  `,
})
export class ProductPage {
  private readonly api = inject(ShopApi);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Route parameter (component input binding is on). */
  readonly id = input.required<string>();

  readonly product = signal<Product | null>(null);
  readonly error = signal<string | null>(null);
  readonly selectedId = signal('');
  readonly adding = signal(false);
  readonly added = signal(false);
  readonly selected = computed<Sku | null>(() => {
    const p = this.product();
    return p ? (p.skus.find((s) => s.sku_id === this.selectedId()) ?? p.skus[0] ?? null) : null;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      this.product.set(null);
      this.error.set(null);
      this.api.product(id).subscribe({
        next: (p) => {
          this.product.set(p);
          const first = p.skus.find((s) => s.purchasable && s.availability !== 'OUT_OF_STOCK') ?? p.skus[0];
          this.selectedId.set(first?.sku_id ?? '');
        },
        error: (e) =>
          this.error.set(e?.status === 404 ? 'We could not find this product.' : messageFor(e, 'We could not load this product.')),
      });
    });
  }

  money = formatMoney;
  badge = skuBadge;

  canBuy(s: Sku): boolean {
    return s.purchasable && s.availability !== 'OUT_OF_STOCK' && !!s.price;
  }

  add(s: Sku): void {
    if (!this.auth.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.adding.set(true);
    this.added.set(false);
    this.error.set(null);
    this.cart.add(s.sku_id, 1).subscribe({
      next: () => {
        this.adding.set(false);
        this.added.set(true);
      },
      error: (e) => {
        this.adding.set(false);
        this.error.set(messageFor(e, 'We could not add this to your cart.'));
      },
    });
  }
}
