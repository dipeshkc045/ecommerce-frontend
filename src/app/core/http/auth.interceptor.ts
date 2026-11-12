import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError, map } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { ShopApi } from '../shop/shop.api';

const AUTH_PATH = '/web/v1/auth/';

/** One refresh at a time: parallel requests that all got 401 share the same call. */
let inFlight: Observable<string> | null = null;

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const api = inject(ShopApi);
  const router = inject(Router);

  // Sign-in calls carry no token and must not trigger a refresh.
  if (req.url.includes(AUTH_PATH)) return next(req);

  const signOut = () => {
    auth.logout();
    void router.navigate(['/login'], { queryParams: { redirect: router.url } });
  };

  return next(withToken(req, auth.accessToken())).pipe(
    catchError((error: HttpErrorResponse) => {
      const refreshToken = auth.refreshToken();
      if (error.status !== 401 || !refreshToken) {
        if (error.status === 401 && auth.accessToken()) signOut();
        return throwError(() => error);
      }
      inFlight ??= api.refresh(refreshToken).pipe(
        map((session) => {
          auth.setSession(session);
          return session.access_token;
        }),
        finalize(() => (inFlight = null)),
        shareReplay(1),
      );
      return inFlight.pipe(
        switchMap((token) => next(withToken(req, token))),
        catchError((retryError: HttpErrorResponse) => {
          // A used or expired refresh token (401 on the refresh call) ends the session.
          if (retryError.status === 401) signOut();
          return throwError(() => retryError);
        }),
      );
    }),
  );
};
