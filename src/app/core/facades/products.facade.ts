import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { ProductApi } from '../api/product.api';
import { InventoryApi } from '../api/inventory.api';
import { ProductMapper } from '../mappers/product.mapper';
import { InventoryMapper } from '../mappers/inventory.mapper';
import { NotificationService } from '../services/notification.service';
import type { Inventory } from '../models/inventory.model';
import type { Product } from '../models/product.model';
import { FALLBACK_PRODUCTS } from '../../features/products/fallback-products.data';

type InventoryLoadState = Inventory | 'loading' | 'error';

@Injectable({ providedIn: 'root' })
export class ProductsFacade {
  private readonly api = inject(ProductApi);
  private readonly inventoryApi = inject(InventoryApi);
  private readonly productMapper = inject(ProductMapper);
  private readonly inventoryMapper = inject(InventoryMapper);
  private readonly notify = inject(NotificationService);

  private readonly _products = signal<Product[] | null>(null);
  private readonly _selectedProduct = signal<Product | null>(null);
  private readonly _loading = signal(false);
  private readonly _detailLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _usingFallback = signal(false);
  private readonly _inventoryMap = signal<Record<number, InventoryLoadState | undefined>>({});

  readonly products = this._products.asReadonly();
  readonly selectedProduct = this._selectedProduct.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly usingFallback = this._usingFallback.asReadonly();
  readonly inventoryMap = this._inventoryMap.asReadonly();

  readonly hasProducts = computed(() => (this._products()?.length ?? 0) > 0);

  loadAll(): void {
    this._products.set(this.productMapper.toDomainList(FALLBACK_PRODUCTS));
    this._usingFallback.set(true);
    this._loading.set(true);
    this._error.set(null);

    this.api
      .getAll()
      .pipe(
        map((dtos) => this.productMapper.toDomainList(dtos)),
        finalize(() => this._loading.set(false)),
      )
      .subscribe({
        next: (products) => {
          this._products.set(products);
          this._usingFallback.set(false);
          this._error.set(null);
        },
        error: (err) => {
          const message = this.resolveErrorMessage(err);
          this._error.set(message);
        },
      });
  }

  loadById(id: number): void {
    this._detailLoading.set(true);
    this._error.set(null);
    this._usingFallback.set(false);
    this._selectedProduct.set(null);

    this.api
      .getById(id)
      .pipe(
        map((dto) => this.productMapper.toDomain(dto)),
        finalize(() => this._detailLoading.set(false)),
      )
      .subscribe({
        next: (product) => {
          this._selectedProduct.set(product);
          this._usingFallback.set(false);
        },
        error: (err) => {
          const fallback = this.productMapper
            .toDomainList(FALLBACK_PRODUCTS)
            .find((product) => product.id === id);

          if (fallback) {
            this._selectedProduct.set(fallback);
            this._usingFallback.set(true);
            this._error.set(this.resolveErrorMessage(err));
            return;
          }

          this._error.set(this.resolveErrorMessage(err, 'Unable to load product'));
          this.notify.error('Could not load product details');
        },
      });
  }

  search(term: string): void {
    this._loading.set(true);
    this._error.set(null);
    this._usingFallback.set(false);

    this.api
      .search(term)
      .pipe(
        map((dtos) => this.productMapper.toDomainList(dtos)),
        finalize(() => this._loading.set(false)),
      )
      .subscribe({
        next: (products) => this._products.set(products),
        error: (err) => {
          this._error.set(this.resolveErrorMessage(err));
          this.notify.error('Product search failed');
        },
      });
  }

  create(payload: ReturnType<ProductMapper['toPayload']>): void {
    this.api.create(payload).pipe(map((dto) => this.productMapper.toDomain(dto))).subscribe({
      next: (product) => {
        this._products.update((current) => (current ? [product, ...current] : [product]));
        this.notify.success('Product created');
      },
      error: () => this.notify.error('Failed to create product'),
    });
  }

  update(id: number, payload: ReturnType<ProductMapper['toPayload']>): void {
    this.api.update(id, payload).pipe(map((dto) => this.productMapper.toDomain(dto))).subscribe({
      next: (product) => {
        this._products.update((current) =>
          current?.map((item) => (item.id === id ? product : item)) ?? null,
        );
        if (this._selectedProduct()?.id === id) {
          this._selectedProduct.set(product);
        }
        this.notify.success('Product updated');
      },
      error: () => this.notify.error('Failed to update product'),
    });
  }

  delete(id: number): void {
    this.api.delete(id).subscribe({
      next: () => {
        this._products.update((current) => current?.filter((item) => item.id !== id) ?? null);
        this.notify.success('Product deleted');
      },
      error: () => this.notify.error('Failed to delete product'),
    });
  }

  loadInventory(productId: number): void {
    if (this._inventoryMap()[productId] !== undefined) return;

    this._inventoryMap.update((map) => ({ ...map, [productId]: 'loading' }));

    this.inventoryApi.getInventory(productId).subscribe({
      next: (response) => {
        const inventory = response.data
          ? this.inventoryMapper.toDomain(response.data)
          : 'error';
        this._inventoryMap.update((map) => ({ ...map, [productId]: inventory }));
      },
      error: () => {
        this._inventoryMap.update((map) => ({ ...map, [productId]: 'error' }));
      },
    });
  }

  inventoryFor(productId: number): Inventory | null {
    const state = this._inventoryMap()[productId];
    return state && typeof state === 'object' ? state : null;
  }

  inventoryState(productId: number): InventoryLoadState | undefined {
    return this._inventoryMap()[productId];
  }

  clearError(): void {
    this._error.set(null);
  }

  private resolveErrorMessage(err: { status?: number; error?: { message?: string }; message?: string }, fallback = 'Something went wrong. Showing sample products.'): string {
    if (err?.status === 0) {
      return 'Unable to connect to the server. Showing sample products.';
    }
    return err?.error?.message ?? err?.message ?? fallback;
  }
}
