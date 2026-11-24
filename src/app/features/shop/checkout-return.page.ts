import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Observable } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { codeOf, messageFor } from '../../core/shop/problem';
import { ShopApi } from '../../core/shop/shop.api';
import type { Placement } from '../../core/shop/shop.types';

type View =
  | { kind: 'checking' }
  | { kind: 'paid'; orderId: string; orderNumber: string }
  | { kind: 'waiting'; sagaId: string }
  | { kind: 'failed'; message: string }
  | { kind: 'unknown' };

const POLL_MS = 3000;
const POLL_TRIES = 10;

/** Where Khalti sends the customer. The result comes from the server asking Khalti, never from this address. */
@Component({
  standalone: true,
  selector: 'app-checkout-return-page',
  imports: [RouterLink],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop" style="max-width: 560px">
      <h1>Your payment</h1>
      @switch (view().kind) {
        @case ('checking') {
          <div class="card center" aria-busy="true" role="status"><p>Checking your payment with Khalti…</p></div>
        }
        @case ('paid') {
          <div class="card center notice--ok" role="status">
            <h2>Payment received</h2>
            <p>Thank you. Your order is confirmed.</p>
            <a class="btn" [routerLink]="['/orders', paidOrderId()]">See your order</a>
          </div>
        }
        @case ('waiting') {
          <div class="card center notice--warn" role="status">
            <h2>Still waiting for Khalti</h2>
            <p>We have not heard back yet. This can take a minute. Your order will show in your orders once the payment is confirmed.</p>
            <a class="btn btn--ghost" routerLink="/orders">Go to my orders</a>
          </div>
        }
        @case ('failed') {
          <div class="card center notice--error" role="alert">
            <h2>No order was placed</h2>
            <p>{{ failMessage() }}</p>
            <a class="btn" routerLink="/cart">Back to my cart</a>
          </div>
        }
        @default {
          <div class="card center" role="alert">
            <h2>We could not find this payment</h2>
            <p>If money left your account, contact us. Otherwise you can start again.</p>
            <a class="btn" routerLink="/cart">Back to my cart</a>
          </div>
        }
      }
    </div>
  `,
})
export class CheckoutReturnPage implements OnInit, OnDestroy {
  private readonly api = inject(ShopApi);
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(CartService);

  readonly view = signal<View>({ kind: 'checking' });
  readonly paidOrderId = signal('');
  readonly failMessage = signal('');
  private timer: ReturnType<typeof setTimeout> | null = null;
  private tries = 0;

  ngOnInit(): void {
    const pidx = this.route.snapshot.queryParamMap.get('pidx');
    if (!pidx) {
      this.view.set({ kind: 'unknown' });
      return;
    }
    this.check(() => this.api.checkoutReturn(pidx));
  }

  /** Asks the server; a lookup that fails for a reason other than the payment's own outcome is asked again. */
  private check(lookup: () => Observable<Placement>): void {
    lookup().subscribe({
      next: (p) => this.apply(p),
      error: (e) => this.fail(e, lookup),
    });
  }

  private apply(p: Placement): void {
    if (p.status === 'CONFIRMED') {
      this.paidOrderId.set(p.order_id);
      this.cart.load().subscribe({ error: () => undefined }); // the order used the cart
      this.view.set({ kind: 'paid', orderId: p.order_id, orderNumber: p.order_number });
    } else {
      this.view.set({ kind: 'waiting', sagaId: p.saga_id });
      this.retryLater(() => this.api.placementStatus(p.saga_id));
    }
  }

  private retryLater(lookup: () => Observable<Placement>): void {
    if (this.tries++ >= POLL_TRIES) return; // stays on "still waiting": the order list shows the outcome later
    this.timer = setTimeout(() => this.check(lookup), POLL_MS);
  }

  private fail(e: unknown, lookup: () => Observable<Placement>): void {
    const outcome = lookupOutcome(e);
    if (outcome === 'unknown') {
      this.view.set({ kind: 'unknown' });
    } else if (outcome === 'failed') {
      this.failMessage.set(messageFor(e, 'The payment was not completed, so no order was placed.'));
      this.view.set({ kind: 'failed', message: this.failMessage() });
    } else {
      // A network error, a server error, a rate limit or "still in progress" says nothing about the payment:
      // Khalti may have charged the customer, so never say "no order was placed" here
      const current = this.view();
      this.view.set(current.kind === 'waiting' ? current : { kind: 'waiting', sagaId: '' });
      this.retryLater(lookup);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}

/**
 * What a failed lookup tells us. Only a 422 is the server saying the checkout ended without an order; a 404 means
 * there is no such payment. Anything else (no connection, 5xx, 429, 409 "still in progress") must be asked again.
 */
export function lookupOutcome(e: unknown): 'failed' | 'unknown' | 'retry' {
  const status = (e as { status?: number })?.status;
  if (status === 404 || codeOf(e) === 'not_found') return 'unknown';
  if (status === 422) return 'failed';
  return 'retry';
}
