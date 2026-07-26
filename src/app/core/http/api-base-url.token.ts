import { InjectionToken, Provider } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

function resolveDefaultApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }

  return '';
}

export function provideApiBaseUrl(baseUrl = resolveDefaultApiBaseUrl()): Provider {
  return {
    provide: API_BASE_URL,
    useValue: baseUrl
  };
}
