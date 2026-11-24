import { InjectionToken, Provider } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

/** commerce-core, used only when the page is rendered on the server; the same variable server.ts forwards `/web` to. */
function serverApi(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return (env?.['COMMERCE_API_URL'] || 'http://localhost:8180').replace(/\/$/, '');
}

/** In the browser the API is on this site's own origin (`/web/...`): ng serve's proxy or server.ts passes it on. */
function resolveDefaultApiBaseUrl(): string {
  return typeof window === 'undefined' ? serverApi() : '';
}

export function provideApiBaseUrl(baseUrl = resolveDefaultApiBaseUrl()): Provider {
  return { provide: API_BASE_URL, useValue: baseUrl };
}
