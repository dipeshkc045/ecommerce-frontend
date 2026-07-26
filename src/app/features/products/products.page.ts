import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LayoutService } from '../../core/layout/layout.service';
import { ProductsFacade } from '../../core/facades/products.facade';
import { CartFacade } from '../../core/facades/cart.facade';
import type { ProductSearchFilterPayload } from '../../core/api/product.api';
import {
  PRICE_RANGES,
  PRODUCT_CATEGORIES,
  BRANDS,
  COLORS,
  RATING_OPTIONS,
  AVAILABILITY_OPTIONS,
  DISCOUNT_OPTIONS,
  CATEGORY_NAME_TO_ID,
} from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { toProductCardModelList } from '../../shared/ui/product-card/product-card.adapter';
import type { ProductCardModel } from '../../shared/ui/product-card/product-card.model';

const ITEMS_PER_PAGE = 12;

@Component({
  standalone: true,
  selector: 'app-products-page',
  imports: [
    FormsModule,
    RouterLink,
    ProductCardComponent,
  ],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage implements OnInit {
  readonly facade = inject(ProductsFacade);
  readonly layout = inject(LayoutService);
  private readonly cart = inject(CartFacade);
  private readonly route = inject(ActivatedRoute);

  readonly categories = [...PRODUCT_CATEGORIES];
  readonly priceRanges = PRICE_RANGES;
  readonly brands = BRANDS;
  readonly colors = COLORS;
  readonly ratingOptions = RATING_OPTIONS;
  readonly availabilityOptions = AVAILABILITY_OPTIONS;
  readonly discountOptions = DISCOUNT_OPTIONS;
  readonly skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  readonly selectedCategories = signal<string[]>([]);
  readonly selectedPriceRange = signal<string | null>(null);
  readonly selectedBrands = signal<string[]>([]);
  readonly selectedColors = signal<string[]>([]);
  readonly selectedRating = signal<string | null>(null);
  readonly selectedAvailability = signal<string[]>([]);
  readonly selectedDiscount = signal<string | null>(null);
  readonly sortBy = signal<string>('most-popular');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly fallbackDismissed = signal(false);
  readonly addingProductId = signal<number | null>(null);
  readonly visibleCount = signal(ITEMS_PER_PAGE);
  readonly searchQuery = signal('');
  readonly openFilters = signal<Set<string>>(new Set(['cat', 'price', 'brand']));

  _tog(id: string): void {
    this.openFilters.update((s) => {
      const next = new Set(s);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  _isOpen(id: string): boolean {
    return this.openFilters().has(id);
  }

  readonly isLoading = this.facade.loading;
  readonly loadError = this.facade.error;
  readonly usingFallback = this.facade.usingFallback;

  readonly filteredProducts = computed(() => {
    let products = this.facade.products() ?? [];

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(query)),
      );
    }

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
    if (sort !== 'most-popular') {
      products = [...products].sort((a, b) => {
        switch (sort) {
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          case 'newest': return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
          case 'highest-rated': return (b as any).rating - (a as any).rating || 0;
          default: return 0;
        }
      });
    }

    return toProductCardModelList(products);
  });

  readonly displayedProducts = computed(() =>
    this.filteredProducts().slice(0, this.visibleCount()),
  );

  readonly hasMore = computed(() => this.visibleCount() < this.filteredProducts().length);

  readonly totalCount = computed(() => this.filteredProducts().length);

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedCategories().length) count += this.selectedCategories().length;
    if (this.selectedPriceRange()) count += 1;
    if (this.selectedBrands().length) count += this.selectedBrands().length;
    if (this.selectedColors().length) count += this.selectedColors().length;
    if (this.selectedRating()) count += 1;
    if (this.selectedAvailability().length) count += this.selectedAvailability().length;
    if (this.selectedDiscount()) count += 1;
    return count;
  });

  ngOnInit(): void {
    const categoryParam = this.route.snapshot.queryParamMap.get('category');
    if (categoryParam) {
      this.selectedCategories.set([categoryParam]);
      const categoryId = CATEGORY_NAME_TO_ID[categoryParam];
      if (categoryId) {
        this.facade.loadByCategory(categoryId, categoryParam);
        return;
      }
    }
    this.loadProducts();
  }

  loadProducts(): void {
    this.fallbackDismissed.set(false);
    this.fetchServerProducts();
  }

  fetchServerProducts(): void {
    const selectedRange = this.priceRanges.find((r) => r.id === this.selectedPriceRange());
    const payload: ProductSearchFilterPayload = {
      query: this.searchQuery() || undefined,
      categories: this.selectedCategories().length > 0 ? this.selectedCategories() : undefined,
      priceRange: selectedRange
        ? { min: selectedRange.min, max: selectedRange.max }
        : undefined,
      brands: this.selectedBrands().length > 0 ? this.selectedBrands() : undefined,
      colors: this.selectedColors().length > 0 ? this.selectedColors() : undefined,
      minRating: this.selectedRating() ? Number.parseFloat(this.selectedRating()!) : undefined,
      availability: this.selectedAvailability().length > 0 ? this.selectedAvailability() : undefined,
      minDiscount: this.selectedDiscount() ? Number.parseInt(this.selectedDiscount()!, 10) : undefined,
      sortBy: this.sortBy(),
      pagination: {
        page: 1,
        size: this.visibleCount(),
      },
    };

    this.facade.searchWithFilters(payload);
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

  toggleBrand(brand: string): void {
    this.selectedBrands.update((b) =>
      b.includes(brand) ? b.filter((x) => x !== brand) : [...b, brand],
    );
  }

  toggleColor(color: string): void {
    this.selectedColors.update((c) =>
      c.includes(color) ? c.filter((x) => x !== color) : [...c, color],
    );
  }

  toggleAvailability(opt: string): void {
    this.selectedAvailability.update((a) =>
      a.includes(opt) ? a.filter((x) => x !== opt) : [...a, opt],
    );
  }

  selectPriceRange(rangeId: string | null): void {
    this.selectedPriceRange.set(rangeId);
  }

  selectRating(rating: string | null): void {
    this.selectedRating.set(rating);
  }

  selectDiscount(discount: string | null): void {
    this.selectedDiscount.set(discount);
  }

  resetFilters(): void {
    this.selectedCategories.set([]);
    this.selectedPriceRange.set(null);
    this.selectedBrands.set([]);
    this.selectedColors.set([]);
    this.selectedRating.set(null);
    this.selectedAvailability.set([]);
    this.selectedDiscount.set(null);
    this.sortBy.set('most-popular');
    this.searchQuery.set('');
  }

  onSortChange(value: string): void {
    this.sortBy.set(value);
  }

  loadMore(): void {
    this.visibleCount.update((c) => c + ITEMS_PER_PAGE);
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
