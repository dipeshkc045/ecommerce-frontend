import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  // The server has no tokens; let it render and let the browser decide after it takes over.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(AuthService);
  auth.ensureLoaded();
  if (auth.isLoggedIn()) return true;

  return inject(Router).createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};
