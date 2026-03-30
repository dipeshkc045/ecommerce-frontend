import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductApi, type ProductResponse } from '../../core/api/product.api';
import { CartService } from '../../core/cart/cart.service';
import { InventoryApi, type InventoryResponse } from '../../core/api/inventory.api';
import { FALLBACK_PRODUCTS } from './fallback-products.data';

@Component({
  standalone: true,
  selector: 'app-products-page',
  imports: [
    RouterLink,
    FormsModule,
    CurrencyPipe,
  ],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPage implements OnInit {
  private readonly api = inject(ProductApi);
  private readonly cart = inject(CartService);
  private readonly inventoryApi = inject(InventoryApi);

  /** undefined = loading, null = error, array = loaded */
  readonly allProducts = signal<ProductResponse[] | null | undefined>(undefined);
  readonly loadError = signal<string | null>(null);
  readonly usingFallback = signal(false);
  readonly fallbackDismissed = signal(false);
  readonly isLoading = computed(() => this.allProducts() === undefined);
  readonly fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

  readonly categories = ['Women', 'Men', 'Accessories', 'Footwear', 'Electronics', 'Home'];
  readonly priceRanges = [
    { id: '0-50', label: 'Under $50', min: 0, max: 50 },
    { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
    { id: '100-200', label: '$100 - $200', min: 100, max: 200 },
    { id: '200+', label: 'Over $200', min: 200, max: Infinity }
  ];

  readonly skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  readonly selectedCategories = signal<string[]>([]);
  readonly selectedPriceRange = signal<string | null>(null);
  readonly sortBy = signal<string>('default');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly filtersExpanded = signal(false);
  readonly activeFilterCount = computed(() =>
    this.selectedCategories().length + (this.selectedPriceRange() ? 1 : 0)
  );

  readonly filteredProducts = computed(() => {
    let products = this.allProducts() ?? [];

    const cats = this.selectedCategories();
    if (cats.length > 0) {
      products = products.filter(p => p.categoryName && cats.includes(p.categoryName));
    }

    const rangeId = this.selectedPriceRange();
    if (rangeId) {
      const range = this.priceRanges.find(r => r.id === rangeId);
      if (range) {
        products = products.filter(p => +p.price >= range.min && +p.price < range.max);
      }
    }

    const sort = this.sortBy();
    if (sort !== 'default') {
      products = [...products].sort((a, b) => {
        switch (sort) {
          case 'price-asc':  return +a.price - +b.price;
          case 'price-desc': return +b.price - +a.price;
          case 'name-asc':   return a.name.localeCompare(b.name);
          case 'name-desc':  return b.name.localeCompare(a.name);
          default:           return 0;
        }
      });
    }

    return products;
  });

  private readonly inventoryMap = signal<
    Record<number, InventoryResponse | 'loading' | 'error' | undefined>
  >({});

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.allProducts.set(undefined);
    this.loadError.set(null);
    this.usingFallback.set(false);
    this.fallbackDismissed.set(false);

    this.api.getAll().subscribe({
      next: (products) => {
        this.allProducts.set(products);
        this.usingFallback.set(false);
      },
      error: (err) => {
        console.warn('Products API unavailable, loading sample catalog:', err?.message ?? err);
        this.allProducts.set(FALLBACK_PRODUCTS);
        this.usingFallback.set(true);
        this.loadError.set(
          err?.status === 0
            ? 'Unable to connect to the server. Showing sample products.'
            : err?.error?.message ?? 'Something went wrong. Showing sample products.'
        );
      },
    });
  }

  dismissFallbackBanner(): void {
    this.fallbackDismissed.set(true);
  }

  retryLoad(): void {
    this.loadProducts();
  }

  toggleCategory(cat: string): void {
    this.selectedCategories.update(cats => 
      cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]
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

  toggleFiltersPanel(): void {
    this.filtersExpanded.update((open) => !open);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);
  }

  getPriceRangeLabel(rangeId: string): string {
    return this.priceRanges.find(r => r.id === rangeId)?.label ?? rangeId;
  }

  addToCart(productId: number): void {
    this.cart.add(String(productId), 1);
  }

  badgeType(index: number): string {
    const types = ['bestseller', 'new', 'sale', 'hot'];
    return types[index % types.length];
  }

  badgeText(index: number): string {
    const texts = ['Bestseller', 'New', 'Sale', 'Hot'];
    return texts[index % texts.length];
  }

  inventoryState(productId: number): InventoryResponse | 'loading' | 'error' | undefined {
    return this.inventoryMap()[productId];
  }

  inventoryValue(productId: number): InventoryResponse | null {
    const state = this.inventoryMap()[productId];
    return typeof state === 'object' && state !== null ? state : null;
  }

  loadInventory(productId: number): void {
    if (this.inventoryMap()[productId] !== undefined) return;
    this.inventoryMap.update((m) => ({ ...m, [productId]: 'loading' }));

    this.inventoryApi.getInventory(productId).subscribe({
      next: (res) => {
        this.inventoryMap.update((m) => ({ ...m, [productId]: res.data ?? 'error' }));
      },
      error: () => {
        this.inventoryMap.update((m) => ({ ...m, [productId]: 'error' }));
      }
    });
  }
}
