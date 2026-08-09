import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import type {CategoryResponse, GlobalApiResponse} from './types';




@Injectable({ providedIn: 'root' })
export class CategoryApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<CategoryResponse[]> {
    return this.http
      .post<GlobalApiResponse<CategoryResponse[]>>('/product-service/api/categories', {})
      .pipe(map((res) => res.data ?? []));
  }
}
