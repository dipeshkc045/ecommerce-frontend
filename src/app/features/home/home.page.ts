import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HeroSectionComponent } from './hero-section/hero-section.component';
import { CategoriesSectionComponent } from './categories-section/categories-section.component';
import { FeaturedProductsComponent } from './featured-products/featured-products.component';
import { AdvertisementSectionComponent } from './advertisement-section/advertisement-section.component';
import { MOCK_FEATURED_PRODUCTS } from '../../shared/mock/featured-products.mock';
import { MOCK_TRENDING_PRODUCTS } from '../../shared/mock/trending-products.mock';

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
    <app-featured-products
      [title]="'Featured Products'"
      [subtitle]="'Handpicked just for you'"
      [products]="featuredProducts"
      variant="showcase"
      [columns]="5"
      cardMinWidth="220px"
      [showRating]="true"
      [showFeatures]="true"
      [showDescription]="true"
      [showBadge]="false"
    />
    <app-featured-products
      [title]="'Trending Now'"
      [subtitle]="'Most popular products this week'"
      [products]="trendingProducts"
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
    <app-advertisement-section />
  `,
  styles: [`
    :host {
      display: block;
      background: var(--bg-page);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage {
  readonly featuredProducts = MOCK_FEATURED_PRODUCTS;
  readonly trendingProducts = MOCK_TRENDING_PRODUCTS;
}
