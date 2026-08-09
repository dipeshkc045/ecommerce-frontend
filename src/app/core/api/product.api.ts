import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs';
import type { Observable } from 'rxjs';

import type {
  GlobalApiResponse, PageResponse, ProductCardApiItem,
  ProductCategoryPageResponse, ProductPayload,
  ProductResponse,
  ProductSearchFilterPayload
} from './types';

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);

  private readonly byIdCache = new Map<number, Observable<ProductResponse>>();


  getAll() {
    return this.http
      .get<GlobalApiResponse<ProductResponse[]>>('/product-service/api/products')
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as unknown as ProductResponse[]))));
  }

  getById(id: number) {
    return this.http
      .get<GlobalApiResponse<ProductResponse>>(`/product-service/api/products/${id}`)
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as unknown as ProductResponse))));
  }

  getByCategory(categoryId: number, page = 1, size = 12) {
    return this.http.get<GlobalApiResponse<ProductCategoryPageResponse>>(
      `/product-service/api/products/category/${categoryId}`,
      { params: { page, size } },
    ).pipe(map((res) => ('data' in res && res.data ? res.data : (res as unknown as ProductCategoryPageResponse))));
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

  /** POST search endpoint with request body payload */
  searchWithFilters(payload: ProductSearchFilterPayload): Observable<any> {
    return this.http.post<any>('/product-service/api/products/search', payload);
  }

  getFeatured(): Observable<ProductCardApiItem[]> {
    return this.http
      .post<GlobalApiResponse<PageResponse<ProductCardApiItem>>>('/product-service/api/products/featured', {})
      .pipe(map((res) => res.data?.content ?? []));
  }

  getTrending(): Observable<ProductCardApiItem[]> {
    return this.http
      .post<GlobalApiResponse<PageResponse<ProductCardApiItem>>>('/product-service/api/products/trending', {})
      .pipe(map((res) => res.data?.content ?? []));
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

