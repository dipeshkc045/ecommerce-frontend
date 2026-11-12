import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  Cart, CodeSent, OrderDetail, OrderSummary, Page, PaymentMethod, Placement, Product, Session,
} from './shop.types';

const V1 = '/web/v1';

/** Every HTTP call to commerce-core lives here. */
@Injectable({ providedIn: 'root' })
export class ShopApi {
  private readonly http = inject(HttpClient);

  requestCode(phone: string): Observable<CodeSent> {
    return this.http.post<CodeSent>(`${V1}/auth/otp/request`, { phone });
  }
  verifyCode(phone: string, code: string): Observable<Session> {
    return this.http.post<Session>(`${V1}/auth/otp/verify`, { phone, code });
  }
  refresh(refreshToken: string): Observable<Session> {
    return this.http.post<Session>(`${V1}/auth/refresh`, { refresh_token: refreshToken });
  }

  products(cursor?: string | null, limit = 12): Observable<Page<Product>> {
    let params = new HttpParams().set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<Page<Product>>(`${V1}/products`, { params });
  }
  product(id: string): Observable<Product> {
    return this.http.get<Product>(`${V1}/products/${encodeURIComponent(id)}`);
  }

  cart(): Observable<Cart> {
    return this.http.get<Cart>(`${V1}/cart`);
  }
  setQuantity(skuId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${V1}/cart/lines/${skuId}`, { quantity });
  }
  removeLine(skuId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${V1}/cart/lines/${skuId}`);
  }

  /** The same key must be reused when the customer retries the same attempt (it makes the retry safe). */
  placeOrder(method: PaymentMethod, idempotencyKey: string): Observable<Placement> {
    return this.http.post<Placement>(
      `${V1}/orders`,
      { from_cart: true, payment_method: method },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }
  placementStatus(sagaId: string): Observable<Placement> {
    return this.http.get<Placement>(`${V1}/orders/placements/${sagaId}`);
  }
  /** Khalti sends the customer back with ?pidx=; the server confirms it by asking Khalti, not from the URL. */
  checkoutReturn(pidx: string): Observable<Placement> {
    return this.http.get<Placement>(`${V1}/checkout/return`, { params: { pidx } });
  }

  orders(cursor?: string | null, limit = 10): Observable<Page<OrderSummary>> {
    let params = new HttpParams().set('limit', limit);
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<Page<OrderSummary>>(`${V1}/orders`, { params });
  }
  order(id: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${V1}/orders/${encodeURIComponent(id)}`);
  }
}
