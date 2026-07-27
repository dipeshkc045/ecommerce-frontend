import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { FavouriteApi } from '../api/favourite.api';
import type { ProductCardApiItem } from '../api/product.api';

@Injectable({ providedIn: 'root' })
export class FavouriteService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(FavouriteApi);

  private readonly _favouriteIds = signal<Set<number>>(new Set());
  private readonly _favouriteProducts = signal<ProductCardApiItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _togglingIds = signal<Set<number>>(new Set());

  readonly favouriteIds = this._favouriteIds.asReadonly();
  readonly favouriteProducts = this._favouriteProducts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly togglingIds = this._togglingIds.asReadonly();
  readonly count = computed(() => this._favouriteIds().size);

  readonly isFavourite = (productId: number): boolean => {
    return this._favouriteIds().has(productId);
  };

  constructor() {
    effect(() => {
      const isLoggedIn = this.auth.isLoggedIn();
      if (isLoggedIn) {
        this.loadFavourites();
      } else {
        this._favouriteIds.set(new Set());
        this._favouriteProducts.set([]);
      }
    }, { allowSignalWrites: true });
  }

  loadFavourites(): void {
    if (!this.auth.isLoggedIn()) return;

    this._loading.set(true);
    this._error.set(null);

    this.api.getFavourites().pipe(
      tap((products) => {
        const ids = new Set(products.map((p) => p.id));
        this._favouriteIds.set(ids);
        this._favouriteProducts.set(products);
        this._loading.set(false);
      }),
      catchError(() => {
        this._error.set('Failed to load favourites');
        this._loading.set(false);
        return of(null);
      }),
    ).subscribe();
  }

  toggleFavourite(productId: number): void {
    if (this._togglingIds().has(productId)) return;

    const wasFavourite = this._favouriteIds().has(productId);
    const newFavourite = !wasFavourite;

    // Optimistic update
    this._updateLocalState(productId, newFavourite);
    this._togglingIds.update((s) => {
      const next = new Set(s);
      next.add(productId);
      return next;
    });

    this.api.toggleFavourite(productId, newFavourite).pipe(
      catchError(() => {
        // Rollback
        this._updateLocalState(productId, wasFavourite);
        return of(null);
      }),
      tap(() => {
        this._togglingIds.update((s) => {
          const next = new Set(s);
          next.delete(productId);
          return next;
        });
        this.loadFavourites();
      }),
    ).subscribe();
  }

  private _updateLocalState(productId: number, favourite: boolean): void {
    this._favouriteIds.update((s) => {
      const next = new Set(s);
      if (favourite) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });

    if (!favourite) {
      this._favouriteProducts.update((products) =>
        products.filter((p) => p.id !== productId),
      );
    }
  }
}
