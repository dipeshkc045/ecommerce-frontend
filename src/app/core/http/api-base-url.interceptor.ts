import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from './api-base-url.token';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);

  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  if (req.url.startsWith('/')) {
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    return next(req.clone({ url: `${normalizedBaseUrl}${req.url}` }));
  }

  return next(req);
};
