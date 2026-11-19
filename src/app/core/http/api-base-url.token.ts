import { InjectionToken, Provider } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

/** commerce-core, used only when the page is rendered on the server. */
const SERVER_API = 'http://localhost:8180';

function resolveDefaultApiBaseUrl(): string {
  return typeof window === 'undefined' ? SERVER_API : '';
}

export function provideApiBaseUrl(baseUrl = resolveDefaultApiBaseUrl()): Provider {
  return { provide: API_BASE_URL, useValue: baseUrl };
}
