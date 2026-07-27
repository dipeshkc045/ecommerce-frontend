import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import type { GlobalApiResponse } from './types';
import type { ProductCardApiItem } from './product.api';

@Injectable({ providedIn: 'root' })
export class FavouriteApi {
  private readonly http = inject(HttpClient);

  toggleFavourite(productId: number, favourite: boolean): Observable<void> {
    return this.http
      .post<GlobalApiResponse<void> | void>(
        `/product-service/api/products/${productId}/favourite`,
        { favourite },
      )
      .pipe(map(() => undefined));
  }

  getFavourites(): Observable<ProductCardApiItem[]> {
    return this.http
      .get<any>(
        '/product-service/api/users/me/favourites',
      )
      .pipe(
        map((res) => {
          const data = res?.data;
          if (Array.isArray(data)) return data;
          if (data?.items && Array.isArray(data.items)) return data.items;
          return [];
        }),
      );
  }
}
