import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

import { jwtSubject, isJwtExpired } from './jwt.util';
import { GoogleAuthService } from './google-auth.service';

const ACCESS_TOKEN_KEY = 'ecommerce.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly accessTokenSignal = signal<string | null>(this.isBrowser ? this.safeRead() : null);

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isLoggedIn = computed(() => {
    const token = this.accessTokenSignal();
    return !!token && !isJwtExpired(token);
  });
  readonly userId = computed(() => jwtSubject(this.accessTokenSignal()));

  constructor() {
    if (this.isBrowser) {
      window.addEventListener('storage', (event) => {
        if (event.key === ACCESS_TOKEN_KEY) {
          const newToken = this.safeRead();
          this.accessTokenSignal.set(newToken);
        }
      });
    }
  }

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

  async logoutAndRedirect(redirectTo: string = '/login'): Promise<void> {
    await this.googleAuth.signOut();
    this.logout();
    await this.router.navigateByUrl(redirectTo);
  }

  private safeRead(): string | null {
    if (!this.isBrowser) return null;
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token && isJwtExpired(token)) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        return null;
      }
      return token;
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

