import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

export interface PromotionValidationResult {
  valid: boolean;
  discountAmount: number;
  message?: string;
}

/**
 * Promo codes must never live in shipped client JS — anyone can read
 * them in devtools and apply them indefinitely with no spend cap or
 * usage limit. This validates server-side against the promotions
 * service, which owns eligibility, min-spend, and usage-count rules.
 */
@Injectable({ providedIn: 'root' })
export class PromotionApi {
  private readonly http = inject(HttpClient);

  validate(code: string, subtotal: number): Observable<PromotionValidationResult> {
    return this.http
      .post<PromotionValidationResult>('/api/promotions/validate', { code, subtotal })
      .pipe(
        catchError(() =>
          of<PromotionValidationResult>({
            valid: false,
            discountAmount: 0,
            message: 'Could not validate that code right now. Please try again.',
          })
        )
      );
  }
}
