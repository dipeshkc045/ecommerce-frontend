import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Utility service to gate actions behind authentication.
 *
 * Call `guard()` before any action that requires a logged-in user
 * (add to cart, checkout, wishlist, etc.). Returns `true` if the
 * user is authenticated, otherwise redirects to `/login` with
 * the current URL as a `redirect` query-param and returns `false`.
 */
@Injectable({ providedIn: 'root' })
export class AuthRequiredService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Returns `true` when the user is logged in.
   * Redirects to `/login?redirect=<currentUrl>` and returns `false` otherwise.
   */
  guard(): boolean {
    if (this.auth.isLoggedIn()) {
      return true;
    }

    const currentUrl = this.router.url; // e.g. "/products/42"
    this.router.navigate(['/login'], {
      queryParams: { redirect: currentUrl },
    });
    return false;
  }
}
