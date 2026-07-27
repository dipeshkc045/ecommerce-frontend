import { CanActivateFn, Router } from '@angular/router';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);
  const auth = inject(AuthService);
  const router = inject(Router);

  // During SSR, localStorage is not accessible on the server.
  // Allow SSR render to pass through so client hydration can inspect localStorage.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { redirect: state.url },
  });
};

