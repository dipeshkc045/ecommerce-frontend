import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { isJwtExpired } from '../auth/jwt.util';
import { ShopApi } from '../shop/shop.api';

const AUTH_PATH = '/web/v1/auth/';

/** One refresh at a time: parallel requests that all need a new token share the same call. */
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

  const refreshOnce = (refreshToken: string): Observable<string> => {
    inFlight ??= api.refresh(refreshToken).pipe(
      map((session) => {
        auth.setSession(session);
        return session.access_token;
      }),
      finalize(() => (inFlight = null)),
      shareReplay(1),
    );
    return inFlight;
  };

  const sendWithRefresh = (refreshToken: string) =>
    refreshOnce(refreshToken).pipe(
      switchMap((token) => next(withToken(req, token))),
      catchError((error: HttpErrorResponse) => {
        // A used or expired refresh token (401) ends the session.
        if (error.status === 401) signOut();
        return throwError(() => error);
      }),
    );

  // A token that has already expired is renewed first, so the server is not asked with a token it must refuse.
  const current = auth.accessToken();
  const refreshToken = auth.refreshToken();
  if (current && refreshToken && isJwtExpired(current)) return sendWithRefresh(refreshToken);

  return next(withToken(req, current)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !refreshToken) {
        if (error.status === 401 && current) signOut();
        return throwError(() => error);
      }
      return sendWithRefresh(refreshToken);
    }),
  );
};
