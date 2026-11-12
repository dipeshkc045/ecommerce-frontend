import { HttpErrorResponse } from '@angular/common/http';
import type { Problem } from './shop.types';

const MESSAGES: Record<string, string> = {
  insufficient_stock: 'Some items are out of stock now. Check your cart and try again.',
  sku_not_available: 'One of the items can no longer be bought. Remove it from the cart and try again.',
  price_not_available: 'One of the items has no price at the moment. Remove it from the cart and try again.',
  empty_order: 'Your cart is empty.',
  payment_method_unavailable: 'That payment method is not available. Choose another one.',
  payment_failed: 'The payment did not go through, so no order was placed. You can try again.',
  payment_timeout: 'The payment link expired before it was paid, so the order was cancelled. You can try again.',
  payment_not_started: 'We could not start the payment, so no order was placed. Please try again.',
  checkout_timeout: 'The checkout took too long and was cancelled. Please try again.',
  payment_refunded: 'The payment was refunded and the order cancelled.',
  out_of_stock_after_payment: 'The last items sold out while you were paying. Your payment will be refunded.',
  request_in_progress: 'Your order is still being processed. Please wait a moment.',
  rate_limited: 'Too many tries. Please wait a little and try again.',
  invalid_phone: 'Enter a valid Nepali mobile number, for example 98XXXXXXXX.',
  invalid_code: 'That code is not right. Check it and try again.',
  code_locked: 'Too many wrong codes. Ask for a new code.',
  sms_unavailable: 'We cannot send codes right now. Please try again later.',
};

export function problemOf(error: unknown): Problem | null {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    return { status: error.status, ...(error.error as object) } as Problem;
  }
  return error instanceof HttpErrorResponse ? { status: error.status } : null;
}

export function codeOf(error: unknown): string | undefined {
  return problemOf(error)?.code;
}

/** A sentence a customer can act on. Never shows raw server text for unknown failures. */
export function messageFor(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const code = codeOf(error);
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'We cannot reach the shop right now. Check your connection and try again.';
  }
  return fallback;
}

export function retryAfterSeconds(error: unknown): number | null {
  if (error instanceof HttpErrorResponse) {
    const v = Number(error.headers.get('Retry-After'));
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  return null;
}
