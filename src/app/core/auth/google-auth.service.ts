import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AUTH_CONFIG } from '../config/auth.config';

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleAccountsId = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  disableAutoSelect?(): void;
  cancel?(): void;
  renderButton(
    element: HTMLElement | null,
    options: {
      theme: 'outline' | 'filled_blue' | 'filled_black';
      size: 'large' | 'medium' | 'small';
      width?: string;
      text?: 'signin_with' | 'signup_with' | 'continue_with';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    }
  ): void;
  prompt(): void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private googleClientPromise?: Promise<GoogleAccountsId | null>;
  private static readonly GOOGLE_SCRIPT_SELECTOR = 'script[data-google-identity="true"]';
  private static readonly GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

  async initialize(callback: (response: GoogleCredentialResponse) => void): Promise<boolean> {
    const client = await this.getClient();
    if (!client) {
      return false;
    }

    client.initialize({
      client_id: AUTH_CONFIG.googleClientId,
      callback: (response: GoogleCredentialResponse) => {
        this.zone.run(() => {
          callback(response);
        });
      },
    });

    return true;
  }

  preload(): void {
    void this.getClient();
  }

  async renderButton(
    elementId: string,
    text: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with'
  ): Promise<boolean> {
    if (!this.isBrowser) {
      return false;
    }

    const client = await this.getClient();
    const element = document.getElementById(elementId);
    if (!client || !element) {
      return false;
    }

    element.replaceChildren();
    client.renderButton(element, {
      theme: 'outline',
      size: 'large',
      text,
      shape: 'rectangular',
      width: '360',
    });
    return true;
  }

  async promptOneTap(): Promise<void> {
    const client = await this.getClient();
    client?.prompt();
  }

  async signOut(): Promise<void> {
    const client = await this.getClient();
    client?.disableAutoSelect?.();
    client?.cancel?.();
  }

  private getClient(): Promise<GoogleAccountsId | null> {
    if (!this.isBrowser) {
      return Promise.resolve(null);
    }

    if (!this.googleClientPromise) {
      this.googleClientPromise = this.loadGoogleClient();
    }

    return this.googleClientPromise;
  }

  private async loadGoogleClient(): Promise<GoogleAccountsId | null> {
    const existingClient = window.google?.accounts?.id;
    if (existingClient) {
      return existingClient;
    }

    const script = this.findOrCreateScript();
    if (!script) {
      return null;
    }

    return new Promise((resolve) => {
      const resolveClient = () => resolve(window.google?.accounts?.id ?? null);
      const failClient = () => resolve(null);

      if (script.getAttribute('data-loaded') === 'true') {
        resolveClient();
        return;
      }

      const handleLoad = () => {
        script.setAttribute('data-loaded', 'true');
        cleanup();
        resolveClient();
      };
      const handleError = () => {
        cleanup();
        failClient();
      };
      const cleanup = () => {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      };

      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });

      window.setTimeout(() => {
        cleanup();
        resolveClient();
      }, 3000);
    });
  }

  private findOrCreateScript(): HTMLScriptElement | null {
    const existing = document.querySelector<HTMLScriptElement>(GoogleAuthService.GOOGLE_SCRIPT_SELECTOR);
    if (existing) {
      return existing;
    }

    const script = document.createElement('script');
    script.src = GoogleAuthService.GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-identity', 'true');
    document.head.appendChild(script);
    return script;
  }
}
