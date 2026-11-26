import { Pipe, PipeTransform, inject } from '@angular/core';

import type { Money } from '../shop/shop.types';
import { formatDate, formatMoney, formatNumber } from './format';
import { I18nService } from './i18n.service';

/**
 * `{{ 'Add to cart' | t }}`, `{{ 'Items ({n})' | t: { n: count } }}`. Impure on purpose: it reads the language signal,
 * so every text on the page changes the moment the customer switches language.
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(text: string | null | undefined, params?: Record<string, string | number | null | undefined>): string {
    return text ? this.i18n.t(text, params) : '';
  }
}

@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(value: Money | null | undefined): string {
    return formatMoney(value, this.i18n.lang());
  }
}

@Pipe({ name: 'num', standalone: true, pure: false })
export class NumPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : formatNumber(value, this.i18n.lang());
  }
}

@Pipe({ name: 'when', standalone: true, pure: false })
export class WhenPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(value: string | number | Date | null | undefined, withTime = false): string {
    return formatDate(value, this.i18n.lang(), withTime);
  }
}
