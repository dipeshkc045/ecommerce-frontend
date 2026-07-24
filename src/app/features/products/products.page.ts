import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProductsFacade } from '../../core/facades/products.facade';
import { CartFacade } from '../../core/facades/cart.facade';
import { PRICE_RANGES, PRODUCT_CATEGORIES } from '../../core/models/product.model';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { toProductCardModelList } from '../../shared/ui/product-card/product-card.adapter';
import type { ProductCardModel } from '../../shared/ui/product-card/product-card.model';

@Component({
  standalone: true,
  selector: 'app-products-page',
  imports: [
    FormsModule,
    ProductCardComponent,
    EmptyStateComponent,
  ],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage implements OnInit {
  readonly facade = inject(ProductsFacade);
  private readonly cart = inject(CartFacade);

  readonly categories = [...PRODUCT_CATEGORIES];
  readonly priceRanges = PRICE_RANGES;
  readonly skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  readonly selectedCategories = signal<string[]>([]);
  readonly selectedPriceRange = signal<string | null>(null);
  readonly sortBy = signal<string>('default');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly fallbackDismissed = signal(false);
  readonly addingProductId = signal<number | null>(null);

  readonly isLoading = this.facade.loading;
  readonly loadError = this.facade.error;
  readonly usingFallback = this.facade.usingFallback;

  readonly filteredProducts = computed(() => {
    let products = this.facade.products() ?? [];

    const cats = this.selectedCategories();
    if (cats.length > 0) {
      products = products.filter((p) => p.categoryName && cats.includes(p.categoryName));
    }

    const rangeId = this.selectedPriceRange();
    if (rangeId) {
      const range = this.priceRanges.find((r) => r.id === rangeId);
      if (range) {
        products = products.filter((p) => p.price >= range.min && p.price < range.max);
      }
    }

    const sort = this.sortBy();
    if (sort !== 'default') {
      products = [...products].sort((a, b) => {
        switch (sort) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
    }

    return toProductCardModelList(products);
  });

  ngOnInit(): void {
    this.facade.loadAll();
  }

  loadProducts(): void {
    this.fallbackDismissed.set(false);
    this.facade.loadAll();
  }

  dismissFallbackBanner(): void {
    this.fallbackDismissed.set(true);
  }

  retryLoad(): void {
    this.loadProducts();
  }

  toggleCategory(cat: string): void {
    this.selectedCategories.update((cats) =>
      cats.includes(cat) ? cats.filter((c) => c !== cat) : [...cats, cat],
    );
  }

  selectPriceRange(rangeId: string | null): void {
    this.selectedPriceRange.set(rangeId);
  }

  resetFilters(): void {
    this.selectedCategories.set([]);
    this.selectedPriceRange.set(null);
    this.sortBy.set('default');
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);
  }

  getPriceRangeLabel(rangeId: string): string {
    return this.priceRanges.find((r) => r.id === rangeId)?.label ?? rangeId;
  }

  addToCart(product: ProductCardModel): void {
    this.addingProductId.set(product.id);
    this.cart.addProduct(product.id, 1);
    setTimeout(() => this.addingProductId.set(null), 600);
  }
}
