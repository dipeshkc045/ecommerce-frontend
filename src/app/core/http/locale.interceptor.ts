import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { I18nService } from '../i18n/i18n.service';

/** Catalog text (names, descriptions, categories, image alt text) comes from the platform in the customer's language. */
const CATALOG = /^\/web\/v1\/(products|categories)(\/|\?|$)/;

export const localeInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || req.params.has('locale') || !CATALOG.test(req.url)) return next(req);
  return next(req.clone({ params: req.params.set('locale', inject(I18nService).lang()) }));
};
