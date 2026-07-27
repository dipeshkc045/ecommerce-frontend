import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { GlobalApiResponse } from './types';

export interface UserPaymentMethod {
  id: string;
  userId?: string;
  brand: string;
  last4: string;
  exp: string;
  name: string;
  isDefault?: boolean;
}

export type CreatePaymentMethodRequest = Omit<UserPaymentMethod, 'id'>;

@Injectable({ providedIn: 'root' })
export class UserPaymentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/user-service/api/payment-methods';

  /** Fetch saved payment cards for the authenticated user */
  getPaymentMethods(): Observable<UserPaymentMethod[]> {
    return this.http.get<GlobalApiResponse<UserPaymentMethod[]> | UserPaymentMethod[]>(this.baseUrl).pipe(
      map((res) => {
        if (Array.isArray(res)) return res;
        return res.data ?? [];
      }),
      catchError(() => of([]))
    );
  }

  /** Save a new payment card for the authenticated user */
  createPaymentMethod(request: CreatePaymentMethodRequest): Observable<UserPaymentMethod> {
    return this.http.post<GlobalApiResponse<UserPaymentMethod> | UserPaymentMethod>(this.baseUrl, request).pipe(
      map((res) => ('data' in res && res.data ? res.data : (res as UserPaymentMethod)))
    );
  }

  /** Delete a saved payment method */
  deletePaymentMethod(id: string): Observable<boolean> {
    return this.http.delete<GlobalApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
