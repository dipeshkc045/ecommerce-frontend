import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { apiBaseUrlInterceptor } from './api-base-url.interceptor';
import { authInterceptor } from './auth.interceptor';

export function provideAppHttp() {
  return provideHttpClient(withFetch(), withInterceptors([apiBaseUrlInterceptor, authInterceptor]));
}
