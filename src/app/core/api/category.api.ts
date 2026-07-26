import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import type { GlobalApiResponse } from './types';

export type CategoryResponse = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  bgColor: string;
  href: string;
  description: string | null;
};

@Injectable({ providedIn: 'root' })
export class CategoryApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<CategoryResponse[]> {
    return this.http
      .get<GlobalApiResponse<CategoryResponse[]>>('/api/categories')
      .pipe(map((res) => res.data ?? []));
  }
}
