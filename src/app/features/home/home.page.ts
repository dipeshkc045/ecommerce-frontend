import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HeroSectionComponent } from './hero-section/hero-section.component';
import { CategoriesSectionComponent } from './categories-section/categories-section.component';
import { FeaturedProductsComponent } from './featured-products/featured-products.component';
import { ClipsSectionComponent } from './clips-section/clips-section.component';
import { AdvertisementSectionComponent } from './advertisement-section/advertisement-section.component';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [
    HeroSectionComponent,
    CategoriesSectionComponent,
    FeaturedProductsComponent,
    ClipsSectionComponent,
    AdvertisementSectionComponent,
  ],
  template: `
    <app-hero-section />
    <app-categories-section />
    <app-featured-products />
    <app-clips-section />
    <app-advertisement-section />
  `,
  styles: [`
    :host {
      display: block;
      background: #fff;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage { }
