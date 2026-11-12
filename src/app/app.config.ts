import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { provideAppHttp } from './core/http/http.providers';
import { provideApiBaseUrl } from './core/http/api-base-url.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideClientHydration(withEventReplay()),

    // Browser: same origin, the dev server forwards /web to commerce-core (proxy.conf.json).
    // Server-side rendering has no origin, so it calls commerce-core directly (see api-base-url.token.ts).
    provideApiBaseUrl(),

    provideAppHttp(),
  ],
};
