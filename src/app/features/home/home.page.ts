import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';

import { HeroSectionComponent } from './hero-section/hero-section.component';
import { CategoriesSectionComponent } from './categories-section/categories-section.component';
import { FeaturedProductsComponent } from './featured-products/featured-products.component';
import { AdvertisementSectionComponent } from './advertisement-section/advertisement-section.component';
import { ProductApi } from '../../core/api/product.api';
import type { ProductCardApiItem } from '../../core/api/product.api';
import type { ProductCardModel } from '../../shared/ui/product-card/product-card.model';

const PLACEHOLDER_IMAGE = '/images/headphones.svg';
const ACCENT_CYCLE = ['blue', 'pink', 'orange', 'teal', 'purple'] as const;

function toProductCardModel(item: ProductCardApiItem, index: number): ProductCardModel {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    price: item.price,
    oldPrice: item.oldPrice,
    discountPercentage: item.discountPercentage,
    imageUrl: item.imageUrl ?? PLACEHOLDER_IMAGE,
    badge: item.badge,
    rating: item.rating,
    reviewCount: item.reviewCount,
    categoryName: item.categoryName,
    sku: item.sku,
    accent: item.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length],
    features: item.features ?? [],
    stockStatus: item.stockStatus,
    stockQuantity: item.stockQuantity,
    wishlisted: item.wishlisted,
    tags: item.tags ?? [],
  };
}

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [
    HeroSectionComponent,
    CategoriesSectionComponent,
    FeaturedProductsComponent,
    AdvertisementSectionComponent,
  ],
  template: `
    <app-hero-section />
    <app-categories-section />

    @if (featuredLoading()) {
      <div class="section-skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-grid">
          @for (_ of skeletonItems; track $index) {
            <div class="skeleton-card"></div>
          }
        </div>
      </div>
    } @else if (featuredError()) {
      <div class="section-error">
        <span>⚠️ Could not load Featured Products — <button (click)="loadFeatured()">Retry</button></span>
      </div>
    } @else {
      <app-featured-products
        [title]="'Featured Products'"
        [subtitle]="'Handpicked just for you'"
        [products]="featuredProducts()"
        variant="showcase"
        [columns]="5"
        cardMinWidth="220px"
        [showRating]="true"
        [showFeatures]="true"
        [showDescription]="true"
        [showBadge]="false"
      />
    }

    @if (trendingLoading()) {
      <div class="section-skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-grid">
          @for (_ of skeletonItems; track $index) {
            <div class="skeleton-card"></div>
          }
        </div>
      </div>
    } @else if (trendingError()) {
      <div class="section-error">
        <span>⚠️ Could not load Trending Now — <button (click)="loadTrending()">Retry</button></span>
      </div>
    } @else {
      <app-featured-products
        [title]="'Trending Now'"
        [subtitle]="'Most popular products this week'"
        [products]="trendingProducts()"
        variant="grid"
        [columns]="5"
        cardMinWidth="200px"
        [showRating]="true"
        [showBadge]="true"
        [showOldPrice]="true"
        [showDiscount]="true"
        [showWishlist]="true"
        [animated]="true"
      />
    }

    <app-advertisement-section />
  `,
  styles: [`
    :host {
      display: block;
      background: var(--bg-page);
    }

    /* ── Skeleton loader ─────────────────────────────────────── */
    .section-skeleton {
      max-width: 1400px;
      margin: 0 auto;
      padding: 48px 40px;
    }

    .skeleton-title {
      width: 220px;
      height: 28px;
      border-radius: 6px;
      background: var(--color-bg-card);
      margin-bottom: 32px;
      animation: shimmer 1.4s infinite linear;
      background-size: 400% 100%;
      background-image: linear-gradient(
        90deg,
        var(--color-bg-card) 25%,
        var(--color-bg-muted) 50%,
        var(--color-bg-card) 75%
      );
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
    }

    .skeleton-card {
      height: 280px;
      border-radius: 12px;
      animation: shimmer 1.4s infinite linear;
      background-size: 400% 100%;
      background-image: linear-gradient(
        90deg,
        var(--color-bg-card) 25%,
        var(--color-bg-muted) 50%,
        var(--color-bg-card) 75%
      );
    }

    @keyframes shimmer {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    /* ── Error banner ────────────────────────────────────────── */
    .section-error {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px 40px;
      color: var(--color-danger);
      font-size: 14px;
    }

    .section-error button {
      background: none;
      border: none;
      color: var(--color-accent);
      cursor: pointer;
      font-weight: 600;
      text-decoration: underline;
    }

    @media (max-width: 1024px) {
      .skeleton-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 640px) {
      .section-skeleton { padding: 32px 16px; }
      .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly productApi = inject(ProductApi);

  // ── Featured ──────────────────────────────────────────────────────
  private readonly _featuredRaw = signal<ProductCardApiItem[]>([]);
  readonly featuredLoading = signal(true);
  readonly featuredError = signal(false);
  readonly featuredProducts = computed(() =>
    this._featuredRaw().map((item, i) => toProductCardModel(item, i))
  );

  // ── Trending ──────────────────────────────────────────────────────
  private readonly _trendingRaw = signal<ProductCardApiItem[]>([]);
  readonly trendingLoading = signal(true);
  readonly trendingError = signal(false);
  readonly trendingProducts = computed(() =>
    this._trendingRaw().map((item, i) => toProductCardModel(item, i))
  );

  readonly skeletonItems = Array(5).fill(null);

  ngOnInit(): void {
    this.loadFeatured();
    this.loadTrending();
  }

  loadFeatured(): void {
    this.featuredLoading.set(true);
    this.featuredError.set(false);
    this.productApi.getFeatured().subscribe({
      next: (data) => {
        this._featuredRaw.set(data);
        this.featuredLoading.set(false);
      },
      error: () => {
        this.featuredError.set(true);
        this.featuredLoading.set(false);
      },
    });
  }

  loadTrending(): void {
    this.trendingLoading.set(true);
    this.trendingError.set(false);
    this.productApi.getTrending().subscribe({
      next: (data) => {
        this._trendingRaw.set(data);
        this.trendingLoading.set(false);
      },
      error: () => {
        this.trendingError.set(true);
        this.trendingLoading.set(false);
      },
    });
  }
}
