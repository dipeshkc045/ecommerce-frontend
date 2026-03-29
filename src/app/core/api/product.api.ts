import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { shareReplay } from 'rxjs';
import type { Observable } from 'rxjs';

export type ProductResponse = {
  id: number;
  name: string;
  description: string | null;
  price: string; // BigDecimal serialized as string
  sku: string;
  categoryId: number | null;
  categoryName: string | null;
  active: boolean | null;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProductPayload = {
  name: string;
  description?: string | null;
  price: string;
  sku: string;
  categoryId?: number | null;
  active?: boolean | null;
  imageUrl?: string | null;
};

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);

  private readonly byIdCache = new Map<number, Observable<ProductResponse>>();


  getAll() {
    return this.http.get<ProductResponse[]>('/product-service/api/products');
  }

  getById(id: number) {
    return this.http.get<ProductResponse>(`/product-service/api/products/${id}`);
  }

  getByIdCached(id: number) {
    const existing = this.byIdCache.get(id);
    if (existing) return existing;

    const req = this.getById(id).pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.byIdCache.set(id, req);
    return req;
  }

  search(query: string) {
    return this.http.get<ProductResponse[]>('/product-service/api/products/search', {
      params: { query }
    });
  }

  create(payload: ProductPayload) {
    return this.http.post<ProductResponse>('/product-service/api/products', payload);
  }

  update(id: number, payload: ProductPayload) {
    return this.http.put<ProductResponse>(`/product-service/api/products/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`/product-service/api/products/${id}`);
  }
}
