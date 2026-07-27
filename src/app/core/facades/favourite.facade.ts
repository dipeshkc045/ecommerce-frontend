import { Injectable, inject } from '@angular/core';

import { FavouriteService } from '../services/favourite.service';
import { AuthRequiredService } from '../auth/auth-required.service';
import { NotificationService } from '../services/notification.service';
import type { ProductCardApiItem } from '../api/product.api';

@Injectable({ providedIn: 'root' })
export class FavouriteFacade {
  private readonly favourites = inject(FavouriteService);
  private readonly authRequired = inject(AuthRequiredService);
  private readonly notify = inject(NotificationService);

  readonly favouriteIds = this.favourites.favouriteIds;
  readonly favouriteProducts = this.favourites.favouriteProducts;
  readonly loading = this.favourites.loading;
  readonly error = this.favourites.error;
  readonly count = this.favourites.count;

  isFavourite(productId: number): boolean {
    return this.favourites.isFavourite(productId);
  }

  toggleFavourite(productId: number): boolean {
    if (!this.authRequired.guard()) return false;

    const wasFavourite = this.isFavourite(productId);
    this.favourites.toggleFavourite(productId);

    if (wasFavourite) {
      this.notify.info('Removed from wishlist');
    } else {
      this.notify.success('Added to wishlist');
    }

    return true;
  }

  refresh(): void {
    this.favourites.loadFavourites();
  }
}
