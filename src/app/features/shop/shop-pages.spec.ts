import { describe, expect, it } from 'vitest';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { safeRedirect } from './login.page';
import { isHttpUrl } from './checkout.page';
import { stockBadge, lowestPrice } from './product-view';
import { messageFor, retryAfterSeconds } from '../../core/shop/problem';
import type { Product, Sku } from '../../core/shop/shop.types';

const sku = (over: Partial<Sku> = {}): Sku => ({
  sku_id: 'a', sku_code: 'A', option: null, price: { amount_minor: 1000, currency: 'NPR' },
  availability: 'IN_STOCK', purchasable: true, ...over,
});

describe('safeRedirect', () => {
  it('allows paths on this site only', () => {
    expect(safeRedirect('/cart')).toBe('/cart');
    expect(safeRedirect("//evil.example")).toBe("/products");
    expect(safeRedirect('https://evil.example')).toBe('/products');
    expect(safeRedirect("/" + String.fromCharCode(92) + "evil.example")).toBe("/products");
    expect(safeRedirect(null)).toBe('/products');
  });
});

describe('isHttpUrl', () => {
  it('follows only http and https addresses', () => {
    expect(isHttpUrl('https://pay.khalti.com/?pidx=1')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
  });
});

describe('stock badge', () => {
  it('uses the best buyable option', () => {
    expect(stockBadge([sku({ availability: 'OUT_OF_STOCK' }), sku({ availability: 'LOW_STOCK' })]).label).toBe('Only a few left');
    expect(stockBadge([sku({ purchasable: false })]).label).toBe('Out of stock');
    expect(stockBadge([]).label).toBe('Out of stock');
  });
  it('finds the lowest price among buyable options', () => {
    const p: Product = { id: 'p', name: 'P', description: null, skus: [
      sku({ price: { amount_minor: 500, currency: 'NPR' } }), sku({ price: { amount_minor: 300, currency: 'NPR' } }),
      sku({ price: { amount_minor: 100, currency: 'NPR' }, purchasable: false })] };
    expect(lowestPrice(p)?.amount_minor).toBe(300);
  });
});

describe('error messages', () => {
  const http = (status: number, body: object | null, headers: Record<string, string> = {}) =>
    new HttpErrorResponse({ status, error: body, headers: new HttpHeaders(headers) });

  it('explains known codes in plain words', () => {
    expect(messageFor(http(409, { code: 'insufficient_stock' }))).toMatch(/out of stock/i);
    expect(messageFor(http(422, { code: 'payment_timeout' }))).toMatch(/expired/i);
    expect(messageFor(http(422, { code: 'payment_failed' }))).toMatch(/did not go through/i);
  });
  it('never shows raw server text for unknown failures', () => {
    expect(messageFor(http(500, { detail: 'NullPointerException at X' }))).not.toContain('NullPointer');
    expect(messageFor(http(0, null))).toMatch(/reach the shop/i);
  });
  it('reads Retry-After', () => {
    expect(retryAfterSeconds(http(429, { code: 'rate_limited' }, { 'Retry-After': '30' }))).toBe(30);
    expect(retryAfterSeconds(http(429, null))).toBeNull();
  });
});
