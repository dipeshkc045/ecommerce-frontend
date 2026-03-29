import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { jwtSubject } from './jwt.util';

const ACCESS_TOKEN_KEY = 'ecommerce.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly accessTokenSignal = signal<string | null>(this.isBrowser ? this.safeRead() : null);

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.accessTokenSignal());
  readonly userId = computed(() => jwtSubject(this.accessTokenSignal()));

  setAccessToken(token: string): void {
    this.accessTokenSignal.set(token);
    this.safeWrite(token);
  }

  logout(): void {
    this.accessTokenSignal.set(null);
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // ignore storage errors
    }
  }

  private safeRead(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private safeWrite(token: string): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // ignore storage errors
    }
  }
}
