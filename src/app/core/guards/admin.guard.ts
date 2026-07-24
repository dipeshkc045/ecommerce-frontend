import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Guard that protects admin routes.
 * Requires the user to be logged in AND have the 'admin' role decoded from their JWT.
 * Falls back to /403 if authenticated but not authorized.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  }

  // TODO: Decode role from JWT and check for 'admin'
  // For now, allow any logged-in user to access admin (role check to be added)
  return true;
};
