import { Injectable, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

import { jwtSubject, isJwtExpired } from './jwt.util';
import type { Session } from '../shop/shop.types';

const ACCESS_KEY = 'ecommerce.accessToken';
const REFRESH_KEY = 'ecommerce.refreshToken';

/**
 * Holds the customer's tokens. Until the BFF exists (ADR-0021) they live in the browser's localStorage, which a
 * script on the page could read: keep the page free of third-party scripts. SSR-safe: the server never sees them.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly access = signal<string | null>(null);
  private readonly refresh = signal<string | null>(null);

  readonly accessToken = this.access.asReadonly();
  readonly refreshToken = this.refresh.asReadonly();
  /** Signed in means we hold a refresh token, or an access token that has not expired. */
  readonly isLoggedIn = computed(() => {
    const token = this.access();
    return (!!token && !isJwtExpired(token)) || !!this.refresh();
  });
  readonly customerId = computed(() => jwtSubject(this.access()));

  constructor() {
    if (this.isBrowser) {
      // The server renders signed out; read storage once the browser has taken over.
      afterNextRender(() => this.loadFromStorage());
      window.addEventListener('storage', (e) => {
        if (e.key === ACCESS_KEY || e.key === REFRESH_KEY) this.loadFromStorage();
      });
    }
  }

  /** Reads storage now (used by guards, which can run before the first render). */
  ensureLoaded(): void {
    if (this.isBrowser && !this.access() && !this.refresh()) this.loadFromStorage();
  }

  setSession(session: Pick<Session, 'access_token' | 'refresh_token'>): void {
    this.access.set(session.access_token);
    this.refresh.set(session.refresh_token);
    this.write(ACCESS_KEY, session.access_token);
    this.write(REFRESH_KEY, session.refresh_token);
  }

  logout(): void {
    this.access.set(null);
    this.refresh.set(null);
    this.write(ACCESS_KEY, null);
    this.write(REFRESH_KEY, null);
  }

  async logoutAndRedirect(redirectTo = '/login', returnTo?: string): Promise<void> {
    this.logout();
    await this.router.navigate([redirectTo], returnTo ? { queryParams: { redirect: returnTo } } : {});
  }

  private loadFromStorage(): void {
    this.access.set(this.read(ACCESS_KEY));
    this.refresh.set(this.read(REFRESH_KEY));
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string | null): void {
    if (!this.isBrowser) return;
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // storage may be blocked (private mode); the session then lasts until the page closes
    }
  }
}
