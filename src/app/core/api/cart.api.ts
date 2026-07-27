import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import type { GlobalApiResponse } from './types';
import { AuthService } from '../auth/auth.service';

export type CartItemApiDto = {
  id?: number | string;
  productId: string | number;
  productName?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  unitPrice?: string | number | null;
  quantity: number;
  totalPrice?: string | number | null;
};

export type CartResponseDto = {
  id?: number | string;
  userId?: string | null;
  items: CartItemApiDto[];
  totalAmount?: string | number | null;
  totalItems?: number;
  updatedAt?: string | null;
};

export type AddCartItemRequest = {
  productId: string | number;
  quantity: number;
};

export type UpdateCartItemRequest = {
  quantity: number;
};

export type MergeCartRequest = {
  items: AddCartItemRequest[];
};

@Injectable({ providedIn: 'root' })
export class CartApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private get userIdHeader(): string {
    return this.auth.userId() ?? '';
  }

  private get authHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    if (this.userIdHeader) {
      headers['X-User-Id'] = this.userIdHeader;
    }
    const token = this.auth.accessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  /** GET user's active cart from server */
  getCart(): Observable<CartResponseDto> {
    return this.http
      .get<GlobalApiResponse<CartResponseDto> | CartResponseDto>('/cart-service/api/carts/me', {
        headers: this.authHeaders,
        params: new HttpParams().set('hydrateDisplayInfo', 'false'),
      })
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as CartResponseDto))));
  }

  /** POST add item to cart on server */
  addItem(item: AddCartItemRequest): Observable<CartResponseDto> {
    return this.http
      .post<GlobalApiResponse<CartResponseDto> | CartResponseDto>('/cart-service/api/carts/items', item, {
        headers: this.authHeaders,
      })
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as CartResponseDto))));
  }

  /** PUT update item quantity in cart on server */
  updateItemQuantity(productId: string | number, quantity: number): Observable<CartResponseDto> {
    return this.http
      .put<GlobalApiResponse<CartResponseDto> | CartResponseDto>(`/cart-service/api/carts/items/${productId}`, { quantity }, {
        headers: this.authHeaders,
      })
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as CartResponseDto))));
  }

  /** DELETE item from cart on server */
  removeItem(productId: string | number): Observable<CartResponseDto | void> {
    return this.http
      .delete<GlobalApiResponse<CartResponseDto> | CartResponseDto | void>(
        `/cart-service/api/carts/items/${productId}`,
        { headers: this.authHeaders }
      )
      .pipe(map((res) => (res && typeof res === 'object' && 'data' in res && res.data ? res.data : (res as CartResponseDto | void))));
  }

  /** DELETE clear entire cart on server */
  clearCart(): Observable<void> {
    return this.http.delete<void>('/cart-service/api/carts', {
      headers: this.authHeaders,
    });
  }

  /** POST merge guest cart items into user cart */
  mergeCart(payload: MergeCartRequest): Observable<CartResponseDto> {
    return this.http
      .post<GlobalApiResponse<CartResponseDto> | CartResponseDto>('/cart-service/api/carts/merge', payload, {
        headers: this.authHeaders,
      })
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as CartResponseDto))));
  }
}
