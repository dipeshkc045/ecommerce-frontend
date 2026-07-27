import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { GlobalApiResponse } from './types';

export interface UserAddress {
  id: string;
  userId?: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export type CreateAddressRequest = Omit<UserAddress, 'id'>;

@Injectable({ providedIn: 'root' })
export class UserAddressApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/user-service/api/addresses';

  /** Fetch all saved addresses for the authenticated user */
  getAddresses(): Observable<UserAddress[]> {
    return this.http.get<GlobalApiResponse<UserAddress[]> | UserAddress[]>(this.baseUrl).pipe(
      map((res) => {
        if (Array.isArray(res)) return res;
        return res.data ?? [];
      }),
      catchError(() => of([]))
    );
  }

  /** Add a new address for the authenticated user */
  createAddress(request: CreateAddressRequest): Observable<UserAddress> {
    return this.http.post<GlobalApiResponse<UserAddress> | UserAddress>(this.baseUrl, request).pipe(
      map((res) => ('data' in res && res.data ? res.data : (res as UserAddress)))
    );
  }

  /** Delete a saved address */
  deleteAddress(id: string): Observable<boolean> {
    return this.http.delete<GlobalApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
