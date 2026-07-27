import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FavouriteFacade } from '../../core/facades/favourite.facade';
import { CartFacade } from '../../core/facades/cart.facade';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { toProductCardModelFromApiList } from '../../shared/ui/product-card/product-card.adapter';
import type { ProductCardModel } from '../../shared/ui/product-card/product-card.model';

@Component({
  standalone: true,
  selector: 'app-wishlist-page',
  imports: [RouterLink, ProductCardComponent],
  template: `
    <div class="wishlist-page">
      <nav class="wishlist-breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/">Home</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span class="wishlist-breadcrumb__current">Wishlist</span>
      </nav>

      <div class="wishlist-header">
        <h1>My Wishlist</h1>
        @if (products().length > 0) {
          <p>{{ products().length }} {{ products().length === 1 ? 'item' : 'items' }} saved</p>
        }
      </div>

      @if (loading()) {
        <div class="wishlist-skeleton">
          @for (_ of skeletonItems; track $index) {
            <div class="wishlist-skeleton__card">
              <div class="wishlist-skeleton__image"></div>
              <div class="wishlist-skeleton__body">
                <div class="wishlist-skeleton__line short"></div>
                <div class="wishlist-skeleton__line wide"></div>
                <div class="wishlist-skeleton__line medium"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="wishlist-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <h2>Couldn't load your wishlist</h2>
          <p>{{ error() }}</p>
          <button class="wishlist-retry" (click)="retry()">Try Again</button>
        </div>
      } @else if (products().length === 0) {
        <div class="wishlist-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <h2>Your Wishlist is Empty</h2>
          <p>Save items you love to your wishlist and revisit them anytime.</p>
          <a routerLink="/products" class="wishlist-cta">Explore Products</a>
        </div>
      } @else {
        <div class="wishlist-grid">
          @for (p of products(); track p.id) {
            <app-product-card
              [product]="p"
              [showWishlist]="true"
              [showRating]="true"
              [showBadge]="true"
              [showOldPrice]="true"
              [showDiscount]="true"
              (addToCart)="onAddToCart($event)"
              (wishlistToggle)="onWishlistToggle($event)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-page); }

    .wishlist-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px 40px 80px;
    }

    /* ── Breadcrumb ────────────────────────────────────────── */
    .wishlist-breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
      font-size: 13px;
      color: var(--color-text-muted, #666);
    }
    .wishlist-breadcrumb a {
      color: var(--color-text-muted, #666);
      text-decoration: none;
      transition: color 0.2s;
    }
    .wishlist-breadcrumb a:hover { color: var(--color-accent); }
    .wishlist-breadcrumb__current { color: var(--color-text-primary, #111); font-weight: 500; }

    /* ── Header ────────────────────────────────────────────── */
    .wishlist-header {
      margin-bottom: 32px;
    }
    .wishlist-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary, #111);
      margin: 0 0 4px;
    }
    .wishlist-header p {
      color: var(--color-text-muted, #666);
      font-size: 14px;
      margin: 0;
    }

    /* ── Grid ──────────────────────────────────────────────── */
    .wishlist-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    /* ── Skeleton ──────────────────────────────────────────── */
    .wishlist-skeleton {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .wishlist-skeleton__card {
      border-radius: 12px;
      overflow: hidden;
      background: var(--color-bg-card);
    }
    .wishlist-skeleton__image {
      aspect-ratio: 1;
      animation: shimmer 1.4s infinite linear;
      background-size: 400% 100%;
      background-image: linear-gradient(90deg, var(--color-bg-card) 25%, var(--color-bg-muted) 50%, var(--color-bg-card) 75%);
    }
    .wishlist-skeleton__body { padding: 16px; }
    .wishlist-skeleton__line {
      height: 14px;
      border-radius: 4px;
      margin-bottom: 10px;
      animation: shimmer 1.4s infinite linear;
      background-size: 400% 100%;
      background-image: linear-gradient(90deg, var(--color-bg-card) 25%, var(--color-bg-muted) 50%, var(--color-bg-card) 75%);
    }
    .wishlist-skeleton__line.short { width: 50%; }
    .wishlist-skeleton__line.wide { width: 80%; }
    .wishlist-skeleton__line.medium { width: 65%; }

    /* ── Empty state ───────────────────────────────────────── */
    .wishlist-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 80px 24px;
      text-align: center;
      color: var(--color-text-muted, #666);
    }
    .wishlist-empty h2 {
      color: var(--color-text-primary, #111);
      font-size: 22px;
      margin: 0;
    }
    .wishlist-empty p {
      font-size: 14px;
      max-width: 320px;
      margin: 0;
    }
    .wishlist-cta {
      display: inline-flex;
      align-items: center;
      padding: 12px 24px;
      background: var(--color-accent);
      color: #fff;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .wishlist-cta:hover { background: var(--color-accent-hover); }

    /* ── Error state ───────────────────────────────────────── */
    .wishlist-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 80px 24px;
      text-align: center;
      color: var(--color-text-muted, #666);
    }
    .wishlist-error h2 {
      color: var(--color-text-primary, #111);
      font-size: 22px;
      margin: 0;
    }
    .wishlist-retry {
      padding: 10px 20px;
      background: var(--color-accent);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .wishlist-retry:hover { background: var(--color-accent-hover); }

    @keyframes shimmer {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    @media (max-width: 1024px) {
      .wishlist-grid, .wishlist-skeleton { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .wishlist-page { padding: 24px 16px 60px; }
      .wishlist-grid, .wishlist-skeleton { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .wishlist-grid, .wishlist-skeleton { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPage {
  private readonly favouriteFacade = inject(FavouriteFacade);
  private readonly cartFacade = inject(CartFacade);

  readonly loading = this.favouriteFacade.loading;
  readonly error = this.favouriteFacade.error;
  readonly skeletonItems = Array(8).fill(null);

  readonly products = computed(() =>
    toProductCardModelFromApiList(this.favouriteFacade.favouriteProducts()),
  );

  onWishlistToggle(product: ProductCardModel): void {
    this.favouriteFacade.toggleFavourite(product.id);
  }

  onAddToCart(product: ProductCardModel): void {
    this.cartFacade.addProduct(product.id, 1, {
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.categoryName ?? undefined,
      sku: product.sku,
    });
  }

  retry(): void {
    this.favouriteFacade.refresh();
  }
}
