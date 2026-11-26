import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import type { Cart } from '../shop/shop.types';
import { CartService } from './cart.service';

const money = (amount_minor: number) => ({ amount_minor, currency: 'NPR' });
const cart = (items: number): Cart => ({
  cart_id: items ? 'c1' : null, version: 1, lines: [], subtotal: money(0), delivery: money(0), total: money(0), item_count: items,
});

describe('CartService', () => {
  let http: HttpTestingController;
  let auth: AuthService;
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    service = TestBed.inject(CartService);
  });

  it('reads a guest cart with no token', () => {
    TestBed.tick();
    const req = http.expectOne('/web/v1/cart');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(cart(2));
    expect(service.totalItems()).toBe(2);
  });

  it('merges the guest cart on sign-in and shows the merged cart', () => {
    TestBed.tick();
    http.expectOne('/web/v1/cart').flush(cart(2));

    auth.setSession({ access_token: 'a', refresh_token: 'r' });
    TestBed.tick();
    const merge = http.expectOne('/web/v1/cart/merge');
    expect(merge.request.method).toBe('POST');

    // A read sent while the merge is on its way waits for it.
    service.load().subscribe();
    http.expectNone('/web/v1/cart');
    merge.flush({ merged: true, lines_moved: 2, capped: [], skipped: [], cart: cart(5) });
    expect(service.totalItems()).toBe(5);
    http.expectOne('/web/v1/cart').flush(cart(5));
    http.verify();
  });
});
