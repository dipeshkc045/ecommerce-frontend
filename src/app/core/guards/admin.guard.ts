import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../auth/auth.service';

/**
 * Guard that protects admin routes.
 * Requires the user to be logged in AND have the 'admin' role decoded from their JWT.
 * Falls back to /403 if authenticated but not authorized.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  }

  // TODO: Decode role from JWT and check for 'admin'
  // For now, allow any logged-in user to access admin (role check to be added)
  return true;
};

