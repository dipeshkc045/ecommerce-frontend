import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs';
import type { Observable } from 'rxjs';

import type { GlobalApiResponse } from './types';

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

export type ProductCategoryPageResponse = {
  content: ProductResponse[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
};

/** Shape returned by /api/products/featured and /api/products/trending */
export type ProductCardApiItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  discountPercentage: number | null;
  imageUrl: string | null;
  badge: 'bestseller' | 'new' | 'sale' | 'hot' | null;
  rating: number;
  reviewCount: number;
  categoryName: string | null;
  sku: string;
  accent: 'blue' | 'pink' | 'orange' | 'teal' | 'purple' | null;
  features: Array<{ title: string; detail: string; color?: string }>;
  stockStatus: 'inStock' | 'lowStock' | 'outOfStock';
  stockQuantity: number;
  wishlisted: boolean;
  tags: string[];
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

export type ProductSearchFilterPayload = {
  query?: string;
  categories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  brands?: string[];
  colors?: string[];
  minRating?: number;
  availability?: string[];
  minDiscount?: number;
  sortBy?: string;
  pagination?: {
    page?: number;
    size?: number;
  };
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

  getByCategory(categoryId: number, page = 1, size = 12) {
    return this.http.get<ProductCategoryPageResponse>(
      `/product-service/api/products/category/${categoryId}`,
      { params: { page, size } },
    );
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
    return this.http.post<any>('/api/products/search', payload);
  }

  getFeatured(): Observable<ProductCardApiItem[]> {
    return this.http
      .get<GlobalApiResponse<ProductCardApiItem[]>>('/api/products/featured')
      .pipe(map((res) => res.data ?? []));
  }

  getTrending(): Observable<ProductCardApiItem[]> {
    return this.http
      .get<GlobalApiResponse<ProductCardApiItem[]>>('/api/products/trending')
      .pipe(map((res) => res.data ?? []));
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

