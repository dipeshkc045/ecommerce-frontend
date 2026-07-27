import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  query,
  stagger,
} from '@angular/animations';
import { catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { ProductApi, type ProductResponse } from '../../core/api/product.api';
import { OrderApi, type CreateOrderRequest } from '../../core/api/order.api';
import { AuthService } from '../../core/auth/auth.service';
import { PromotionApi } from '../../core/api/promotion.api';

type CheckoutLine = { productId: string; quantity: number; product: ProductResponse | null };
type AccordionSection = 'delivery' | 'payment' | 'review';

interface Address {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

interface PaymentCard {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  name: string;
}

/**
 * Extends the shared CreateOrderRequest with fields this page needs
 * that the order service doesn't have wired up yet. If/when
 * order.api.ts adds guestEmail/idempotencyKey to CreateOrderRequest
 * directly, this local interface (and the `as` no longer being
 * needed) can be deleted.
 */
interface CreateOrderRequestExt extends CreateOrderRequest {
  guestEmail?: string;
  idempotencyKey: string;
}

@Component({
  standalone: true,
  selector: 'app-checkout-page',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  animations: [
    trigger('accordionExpand', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('280ms cubic-bezier(0.16, 1, 0.3, 1)', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('240ms cubic-bezier(0.16, 1, 0.3, 1)', style({ height: 0, opacity: 0 })),
      ]),
    ]),
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('300ms 80ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('listStagger', [
      transition(':enter', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(8px)' }),
          stagger(50, [
            animate('250ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <!-- ═══ EMPTY CART ═══ -->
    @if (lines().length === 0 && !loading()) {
      <div class="co-empty" @fadeSlideIn>
        <div class="co-empty__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </div>
        <h2>Your cart is empty</h2>
        <p>Add some items before checking out.</p>
        <a routerLink="/products" class="co-btn co-btn--primary">Browse Products</a>
      </div>
    }

    @if (lines().length > 0 || loading()) {
      <div class="co">
        <!-- ═══ LEFT: ACCORDION ═══ -->
        <div class="co__main">
          <h1 class="co__title">Checkout</h1>

          <!-- Step progress — genuinely sequential, so numbering carries real meaning here -->
          <nav class="co-stepper" aria-label="Checkout progress">
            @for (step of steps; track step.key; let i = $index) {
              <div
                class="co-stepper__step"
                [class.co-stepper__step--active]="expandedSection() === step.key"
                [class.co-stepper__step--done]="completedSections().has(step.key)"
              >
                <span class="co-stepper__dot">
                  @if (completedSections().has(step.key) && expandedSection() !== step.key) {
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                  } @else {
                    {{ i + 1 }}
                  }
                </span>
                <span class="co-stepper__label">{{ step.label }}</span>
              </div>
              @if (i < steps.length - 1) {
                <div class="co-stepper__line" [class.co-stepper__line--done]="completedSections().has(step.key)"></div>
              }
            }
          </nav>

          <!-- ── Section 1: Delivery ── -->
          <div class="co-section" [class.co-section--completed]="expandedSection() !== 'delivery' && completedSections().has('delivery')">
            <button
              class="co-section__head"
              (click)="toggleSection('delivery')"
              [attr.aria-expanded]="expandedSection() === 'delivery'"
              aria-controls="delivery-panel"
              type="button"
            >
              <span class="co-section__number">{{ completedSections().has('delivery') ? '' : '1' }}</span>
              @if (completedSections().has('delivery') && expandedSection() !== 'delivery') {
                <span class="co-section__check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              }
              <span class="co-section__label">Delivery</span>
              @if (expandedSection() !== 'delivery' && completedSections().has('delivery')) {
                <span class="co-section__summary">{{ selectedAddress()?.label }} — {{ selectedAddress()?.city }}, {{ selectedAddress()?.state }}</span>
              }
              <span class="co-section__chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </button>

            @if (expandedSection() === 'delivery') {
              <div class="co-section__body" id="delivery-panel" role="region" aria-label="Delivery options" @accordionExpand>
                <!-- Address cards -->
                <div class="co-cards" role="radiogroup" aria-label="Choose a delivery address" @listStagger>
                  @for (addr of addresses; track addr.id) {
                    <button
                      class="co-card"
                      [class.co-card--selected]="selectedAddressId() === addr.id"
                      (click)="selectAddress(addr)"
                      type="button"
                      role="radio"
                      [attr.aria-checked]="selectedAddressId() === addr.id"
                    >
                      <span class="co-card__radio">
                        <span class="co-card__radio-dot" [class.active]="selectedAddressId() === addr.id"></span>
                      </span>
                      <div class="co-card__body">
                        <span class="co-card__label">{{ addr.label }}</span>
                        <span class="co-card__detail">{{ addr.name }}</span>
                        <span class="co-card__detail">{{ addr.street }}</span>
                        <span class="co-card__detail">{{ addr.city }}, {{ addr.state }} {{ addr.zip }}</span>
                        <span class="co-card__detail">{{ addr.phone }}</span>
                      </div>
                    </button>
                  }

                  <!-- Add new address -->
                  <button
                    class="co-card co-card--add"
                    [class.co-card--selected]="showNewAddress()"
                    (click)="toggleNewAddress()"
                    type="button"
                  >
                    <span class="co-card__radio">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </span>
                    <span class="co-card__body">
                      <span class="co-card__label">Add new address</span>
                    </span>
                  </button>
                </div>

                @if (showNewAddress()) {
                  <div class="co-form" @fadeSlideIn>
                    <div class="co-form__row co-form__row--2">
                      <label class="co-input">
                        <span class="co-input__label">Label</span>
                        <input class="co-input__field" type="text" placeholder="e.g. Home, Office" [(ngModel)]="newAddress.label" />
                      </label>
                      <label class="co-input">
                        <span class="co-input__label">Full Name</span>
                        <input class="co-input__field" type="text" placeholder="John Doe" [(ngModel)]="newAddress.name" />
                      </label>
                    </div>
                    <label class="co-input">
                      <span class="co-input__label">Street Address</span>
                      <input class="co-input__field" type="text" placeholder="123 Main St, Apt 4B" [(ngModel)]="newAddress.street" />
                    </label>
                    <div class="co-form__row co-form__row--3">
                      <label class="co-input">
                        <span class="co-input__label">City</span>
                        <input class="co-input__field" type="text" [(ngModel)]="newAddress.city" />
                      </label>
                      <label class="co-input">
                        <span class="co-input__label">State</span>
                        <input class="co-input__field" type="text" [(ngModel)]="newAddress.state" />
                      </label>
                      <label class="co-input">
                        <span class="co-input__label">ZIP</span>
                        <input class="co-input__field" type="text" [(ngModel)]="newAddress.zip" />
                      </label>
                    </div>
                    <div class="co-form__row co-form__row--2">
                      <label class="co-input">
                        <span class="co-input__label">Country</span>
                        <input class="co-input__field" type="text" value="United States" [(ngModel)]="newAddress.country" />
                      </label>
                      <label class="co-input">
                        <span class="co-input__label">Phone</span>
                        <input class="co-input__field" type="tel" placeholder="+1 (555) 000-0000" [(ngModel)]="newAddress.phone" />
                      </label>
                    </div>
                    <div class="co-form__actions">
                      <button class="co-btn co-btn--ghost" (click)="showNewAddress.set(false)" type="button">Cancel</button>
                      <button class="co-btn co-btn--primary co-btn--sm" (click)="saveNewAddress()" type="button">Save Address</button>
                    </div>
                  </div>
                }

                <!-- Delivery estimate -->
                @if (selectedAddress()) {
                  <div class="co-estimate" @fadeSlideIn>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round">
                      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    <span>Estimated delivery: <strong>{{ estimatedDelivery() }}</strong></span>
                  </div>
                }

                <div class="co-section__footer">
                  <button
                    class="co-btn co-btn--primary"
                    [disabled]="!selectedAddress()"
                    (click)="completeDelivery()"
                    type="button"
                  >Continue to Payment</button>
                </div>
              </div>
            }
          </div>

          <!-- ── Section 2: Payment ── -->
          <div class="co-section" [class.co-section--completed]="expandedSection() !== 'payment' && completedSections().has('payment')">
            <button
              class="co-section__head"
              (click)="toggleSection('payment')"
              [attr.aria-expanded]="expandedSection() === 'payment'"
              aria-controls="payment-panel"
              [disabled]="!completedSections().has('delivery')"
              type="button"
            >
              <span class="co-section__number">{{ completedSections().has('payment') ? '' : '2' }}</span>
              @if (completedSections().has('payment') && expandedSection() !== 'payment') {
                <span class="co-section__check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              }
              <span class="co-section__label">Payment</span>
              @if (expandedSection() !== 'payment' && completedSections().has('payment')) {
                <span class="co-section__summary">{{ paymentSummaryText() }}</span>
              }
              <span class="co-section__chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </button>

            @if (expandedSection() === 'payment') {
              <div class="co-section__body" id="payment-panel" role="region" aria-label="Payment options" @accordionExpand>

                <!-- Express pay -->
                <p class="co-section__subhead">Express Checkout</p>
                <div class="co-express" role="radiogroup" aria-label="Express payment method">
                  @for (ep of expressPayOptions; track ep.id) {
                    <button
                      class="co-express__btn"
                      [class.co-express__btn--selected]="selectedExpressPay() === ep.id && !selectedCardId() && !b2bMode()"
                      (click)="selectExpressPay(ep.id)"
                      type="button"
                      role="radio"
                      [attr.aria-checked]="selectedExpressPay() === ep.id"
                    >
                      <span class="co-express__icon" aria-hidden="true">{{ ep.icon }}</span>
                      <span>{{ ep.label }}</span>
                    </button>
                  }
                </div>

                <div class="co-divider"><span>or pay with card</span></div>

                <!-- Saved cards -->
                <div class="co-cards" role="radiogroup" aria-label="Choose a saved card" @listStagger>
                  @for (card of cards; track card.id) {
                    <button
                      class="co-card"
                      [class.co-card--selected]="selectedCardId() === card.id"
                      (click)="selectCard(card.id)"
                      type="button"
                      role="radio"
                      [attr.aria-checked]="selectedCardId() === card.id"
                    >
                      <span class="co-card__radio">
                        <span class="co-card__radio-dot" [class.active]="selectedCardId() === card.id"></span>
                      </span>
                      <div class="co-card__body co-card__body--row">
                        <span class="co-card__brand">{{ card.brand }}</span>
                        <span class="co-card__detail">•••• {{ card.last4 }}</span>
                        <span class="co-card__detail co-card__detail--muted">Exp {{ card.exp }}</span>
                      </div>
                    </button>
                  }

                  <!-- Add new card -->
                  <button
                    class="co-card co-card--add"
                    [class.co-card--selected]="showNewCard()"
                    (click)="toggleNewCard()"
                    type="button"
                  >
                    <span class="co-card__radio">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </span>
                    <span class="co-card__body">
                      <span class="co-card__label">Add new card</span>
                    </span>
                  </button>
                </div>

                @if (showNewCard()) {
                  <div class="co-form" @fadeSlideIn>
                    <label class="co-input">
                      <span class="co-input__label">Card Number</span>
                      <input class="co-input__field" type="text" placeholder="4242 4242 4242 4242" maxlength="19" [(ngModel)]="newCard.number" (input)="formatCardNumber()" />
                    </label>
                    <div class="co-form__row co-form__row--2">
                      <label class="co-input">
                        <span class="co-input__label">Expiry</span>
                        <input class="co-input__field" type="text" placeholder="MM/YY" maxlength="5" [(ngModel)]="newCard.exp" (input)="formatExpiry()" />
                      </label>
                      <label class="co-input">
                        <span class="co-input__label">CVC</span>
                        <input class="co-input__field" type="text" placeholder="123" maxlength="4" [(ngModel)]="newCard.cvc" />
                      </label>
                    </div>
                    <label class="co-input">
                      <span class="co-input__label">Name on Card</span>
                      <input class="co-input__field" type="text" placeholder="John Doe" [(ngModel)]="newCard.name" />
                    </label>
                    <div class="co-form__actions">
                      <button class="co-btn co-btn--ghost" (click)="showNewCard.set(false)" type="button">Cancel</button>
                      <button class="co-btn co-btn--primary co-btn--sm" (click)="saveNewCard()" type="button">Save Card</button>
                    </div>
                  </div>
                }

                <!-- B2B PO Toggle -->
                <div class="co-divider"><span>or</span></div>
                <button class="co-b2b-toggle" (click)="toggleB2b()" type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>{{ b2bMode() ? 'Switch to card payment' : 'Pay by PO / Net 30' }}</span>
                </button>

                @if (b2bMode()) {
                  <div class="co-form co-form--compact" @fadeSlideIn>
                    <label class="co-input">
                      <span class="co-input__label">Purchase Order Number</span>
                      <input
                        class="co-input__field"
                        type="text"
                        placeholder="PO-0001234"
                        [ngModel]="poNumber()"
                        (ngModelChange)="poNumber.set($event)"
                      />
                    </label>
                  </div>
                }

                <!-- Trust signals -->
                <div class="co-trust">
                  <div class="co-trust__item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>SSL Encrypted</span>
                  </div>
                  <div class="co-trust__item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span>PCI Compliant</span>
                  </div>
                  <div class="co-trust__item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                    <span>30-Day Returns</span>
                  </div>
                </div>

                <div class="co-section__footer">
                  <button
                    class="co-btn co-btn--primary"
                    [disabled]="!canCompletePayment()"
                    (click)="completePayment()"
                    type="button"
                  >Review Order</button>
                </div>
              </div>
            }
          </div>

          <!-- ── Section 3: Review & Place Order ── -->
          <div class="co-section co-section--final">
            <button
              class="co-section__head"
              (click)="toggleSection('review')"
              [attr.aria-expanded]="expandedSection() === 'review'"
              aria-controls="review-panel"
              [disabled]="!completedSections().has('payment')"
              type="button"
            >
              <span class="co-section__number">{{ completedSections().has('review') ? '' : '3' }}</span>
              @if (completedSections().has('review') && expandedSection() !== 'review') {
                <span class="co-section__check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              }
              <span class="co-section__label">Review & Place Order</span>
              <span class="co-section__chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </button>

            @if (expandedSection() === 'review') {
              <div class="co-section__body" id="review-panel" role="region" aria-label="Review order" @accordionExpand>

                @if (hasUnavailableItems()) {
                  <div class="co-alert co-alert--warning" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    <span>Some items are no longer available and can't be ordered: {{ unavailableItemLabel() }}. Remove them from your cart to continue.</span>
                  </div>
                }

                <!-- Order items list -->
                <div class="co-review-items">
                  @for (line of lines(); track line.productId) {
                    <div class="co-review-item" [class.co-review-item--unavailable]="!line.product" @fadeSlideIn>
                      <div class="co-review-item__thumb">
                        @if (line.product?.imageUrl) {
                          <img [src]="line.product!.imageUrl" [alt]="line.product!.name" />
                        } @else {
                          <div class="co-review-item__placeholder">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                          </div>
                        }
                      </div>
                      <div class="co-review-item__info">
                        <span class="co-review-item__name">{{ line.product?.name ?? ('Product #' + line.productId + ' — unavailable') }}</span>
                        <span class="co-review-item__meta">Qty: {{ line.quantity }}</span>
                      </div>
                      <span class="co-review-item__price">{{ (line.product ? toNum(line.product!.price) * line.quantity : 0) | currency:'USD':'symbol':'1.0-2' }}</span>
                    </div>
                  }
                </div>

                <!-- Promo code -->
                <div class="co-promo">
                  <label class="co-input co-input--inline">
                    <input
                      class="co-input__field"
                      type="text"
                      placeholder="Promo code"
                      [ngModel]="promoCode()"
                      (ngModelChange)="promoCode.set($event); promoError.set(null)"
                      [disabled]="promoApplied()"
                    />
                    @if (!promoApplied()) {
                      <button class="co-btn co-btn--ghost co-btn--xs" (click)="applyPromo()" [disabled]="!promoCode() || promoValidating()" type="button">
                        {{ promoValidating() ? 'Checking…' : 'Apply' }}
                      </button>
                    } @else {
                      <span class="co-promo__badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Applied
                      </span>
                      <button class="co-promo__remove" (click)="removePromo()" type="button">Remove</button>
                    }
                  </label>
                  @if (promoError()) {
                    <p class="co-promo__error" role="alert">{{ promoError() }}</p>
                  }
                </div>

                <!-- Delivery + Payment summary lines -->
                <div class="co-review-summary">
                  <div class="co-review-summary__row">
                    <span>Delivery</span>
                    <span>{{ selectedAddress()?.label }}, {{ selectedAddress()?.city }}</span>
                  </div>
                  <div class="co-review-summary__row">
                    <span>Payment</span>
                    <span>{{ paymentSummaryText() }}</span>
                  </div>
                </div>

                <!-- Guest contact info — parallel path to logged-in checkout, no forced redirect -->
                @if (isGuest()) {
                  <div class="co-guest" @fadeSlideIn>
                    <p class="co-section__subhead">Contact Information</p>
                    <label class="co-input">
                      <span class="co-input__label">Email for order confirmation</span>
                      <input
                        class="co-input__field"
                        type="email"
                        placeholder="you@example.com"
                        [ngModel]="guestEmail()"
                        (ngModelChange)="guestEmail.set($event)"
                      />
                    </label>
                    <p class="co-guest__hint">Already have an account? <a routerLink="/login" [queryParams]="{ redirect: '/checkout' }">Log in</a> to use saved addresses and cards next time.</p>
                  </div>
                }

                <!-- Guarantee -->
                <div class="co-guarantee">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  <span>Your order is protected by our 30-day money-back guarantee. Free returns on all items.</span>
                </div>

                @if (submitError()) {
                  <div class="co-alert co-alert--error" role="alert">
                    <span>{{ submitError() }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- ═══ RIGHT RAIL: ORDER SUMMARY ═══ -->
        <aside class="co__rail">
          <div class="co-rail">
            <h2 class="co-rail__title">Order Summary</h2>

            @if (loading()) {
              <!-- Shimmer skeleton while totals are still resolving from the server -->
              <div class="co-rail__skeleton" aria-hidden="true">
                <div class="co-skel co-skel--row"></div>
                <div class="co-skel co-skel--row"></div>
                <div class="co-skel co-skel--divider"></div>
                <div class="co-skel co-skel--line"></div>
                <div class="co-skel co-skel--line"></div>
                <div class="co-skel co-skel--line"></div>
              </div>
            } @else {
              <!-- Mini item list -->
              <div class="co-rail__items">
                @for (line of lines(); track line.productId) {
                  <div class="co-rail__item">
                    <div class="co-rail__item-thumb">
                      @if (line.product?.imageUrl) {
                        <img [src]="line.product!.imageUrl" [alt]="line.product!.name" />
                      } @else {
                        <div class="co-rail__item-ph"></div>
                      }
                      <span class="co-rail__item-qty">{{ line.quantity }}</span>
                    </div>
                    <div class="co-rail__item-info">
                      <span class="co-rail__item-name">{{ line.product?.name ?? 'Product' }}</span>
                      <span class="co-rail__item-price">{{ (line.product ? toNum(line.product!.price) * line.quantity : 0) | currency:'USD':'symbol':'1.0-2' }}</span>
                    </div>
                  </div>
                }
              </div>

              <div class="co-rail__divider"></div>

              <!-- Cost breakdown -->
              <div class="co-rail__breakdown">
                <div class="co-rail__row">
                  <span>Subtotal</span>
                  <span>{{ animatedSubtotal() | currency:'USD':'symbol':'1.0-2' }}</span>
                </div>
                <div class="co-rail__row">
                  <span>Shipping</span>
                  <span [class.co-rail__free]="shippingCost() === 0">
                    {{ shippingCost() === 0 ? 'Free' : (shippingCost() | currency:'USD':'symbol':'1.0-2') }}
                  </span>
                </div>
                <div class="co-rail__row">
                  <span>Tax</span>
                  <span>{{ animatedTax() | currency:'USD':'symbol':'1.0-2' }}</span>
                </div>
                @if (discountAmount() > 0) {
                  <div class="co-rail__row co-rail__row--discount">
                    <span>Discount</span>
                    <span>-{{ discountAmount() | currency:'USD':'symbol':'1.0-2' }}</span>
                  </div>
                }
              </div>

              <div class="co-rail__divider"></div>

              <div class="co-rail__total">
                <span>Total</span>
                <span class="co-rail__total-value">{{ animatedTotal() | currency:'USD':'symbol':'1.0-2' }}</span>
              </div>
            }

            <!-- CTA (sticky on mobile) -->
            @if (expandedSection() === 'review') {
              <div class="co-rail__cta" @fadeSlideIn>
                <button
                  class="co-btn co-btn--cta"
                  [class.co-btn--loading]="submitting()"
                  [class.co-btn--success]="orderPlaced()"
                  [disabled]="submitting() || orderPlaced() || hasUnavailableItems() || (isGuest() && !guestEmail())"
                  [attr.aria-busy]="submitting()"
                  (click)="placeOrder()"
                  type="button"
                  [attr.aria-label]="submitting() ? 'Placing order' : orderPlaced() ? 'Order placed' : 'Place order — ' + (animatedTotal() | currency:'USD':'symbol':'1.0-2')"
                >
                  @if (orderPlaced()) {
                    <svg class="co-btn__check" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  } @else if (submitting()) {
                    <span class="co-btn__spinner"></span>
                  }
                  <span class="co-btn__label">
                    @if (orderPlaced()) { Order Placed! }
                    @else if (submitting()) { Placing Order… }
                    @else { Place Order — {{ animatedTotal() | currency:'USD':'symbol':'1.0-2' }} }
                  </span>
                </button>
                <p class="co-rail__guarantee-text">30-day money-back guarantee · Free returns</p>
                <p class="sr-only" role="status" aria-live="polite">
                  {{ orderPlaced() ? 'Order placed successfully' : submitting() ? 'Placing your order, please wait' : '' }}
                </p>
              </div>
            }
          </div>
        </aside>
      </div>
    }

    <!-- ═══ MOBILE STICKY BAR ═══ -->
    @if (lines().length > 0 && expandedSection() === 'review') {
      <div class="co-mobile-bar" @fadeSlideIn>
        <div class="co-mobile-bar__total">
          <span class="co-mobile-bar__label">Total</span>
          <span class="co-mobile-bar__value">{{ animatedTotal() | currency:'USD':'symbol':'1.0-2' }}</span>
        </div>
        <button
          class="co-btn co-btn--cta co-btn--mobile"
          [disabled]="submitting() || orderPlaced() || hasUnavailableItems() || (isGuest() && !guestEmail())"
          (click)="placeOrder()"
          type="button"
        >
          @if (orderPlaced()) {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          } @else if (submitting()) {
            <span class="co-btn__spinner"></span>
          }
          <span>{{ orderPlaced() ? 'Done' : submitting() ? 'Placing…' : 'Place Order' }}</span>
        </button>
      </div>
    }
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════════════
       CHECKOUT — SINGLE-VIEWPORT ENTERPRISE LAYOUT
       ═══════════════════════════════════════════════════════════════ */

    :host {
      display: block;
      background: var(--color-bg-page);
      min-height: 100vh;
    }

    .sr-only {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* ── Empty State ───────────────────────────────────────── */
    .co-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-md);
      padding: var(--space-4xl) var(--space-lg);
      text-align: center;
      min-height: 60vh;
    }
    .co-empty__icon { color: var(--color-text-disabled); }
    .co-empty h2 {
      margin: 0; font-size: var(--text-xl); font-weight: var(--weight-bold);
      color: var(--color-text-primary);
    }
    .co-empty p {
      margin: 0; color: var(--color-text-secondary); font-size: var(--text-sm);
    }

    /* ── Main Layout ───────────────────────────────────────── */
    .co {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: var(--space-xl);
      max-width: 1280px;
      margin: 0 auto;
      padding: var(--space-lg) var(--space-xl);
      align-items: start;
    }

    .co__main {
      min-width: 0;
    }

    .co__title {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: var(--weight-bold);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-lg);
      letter-spacing: var(--tracking-tight);
    }

    /* ── Stepper ───────────────────────────────────────────── */
    .co-stepper {
      display: flex;
      align-items: center;
      margin-bottom: var(--space-lg);
    }
    .co-stepper__step {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      flex-shrink: 0;
    }
    .co-stepper__dot {
      width: 24px; height: 24px;
      border-radius: var(--radius-full);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px;
      font-weight: var(--weight-bold);
      background: var(--color-bg-muted);
      color: var(--color-text-muted);
      border: 2px solid var(--color-border);
      transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .co-stepper__step--active .co-stepper__dot {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: var(--color-text-inverse);
      transform: scale(1.1);
    }
    .co-stepper__step--done .co-stepper__dot {
      background: var(--color-success);
      border-color: var(--color-success);
      color: var(--color-text-inverse);
    }
    .co-stepper__label {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--color-text-muted);
    }
    .co-stepper__step--active .co-stepper__label,
    .co-stepper__step--done .co-stepper__label {
      color: var(--color-text-primary);
    }
    .co-stepper__line {
      flex: 1;
      height: 2px;
      background: var(--color-border);
      margin: 0 var(--space-sm);
      transition: background 300ms ease;
    }
    .co-stepper__line--done { background: var(--color-success); }

    /* ── Accordion Sections ────────────────────────────────── */
    .co-section {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-md);
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }
    .co-section:hover { border-color: var(--color-border-light); }

    .co-section__head {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      width: 100%;
      padding: var(--space-lg);
      border: none;
      background: none;
      cursor: pointer;
      font-family: var(--font-body);
      text-align: left;
      color: var(--color-text-primary);
      transition: background 150ms ease;
      border-radius: var(--radius-lg);
    }
    .co-section__head:hover { background: var(--color-bg-elevated); }
    .co-section__head:disabled { opacity: 0.45; cursor: not-allowed; }
    .co-section__head:disabled:hover { background: none; }

    .co-section__number {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-full);
      background: var(--color-accent);
      color: var(--color-text-inverse);
      font-size: var(--text-sm);
      font-weight: var(--weight-bold);
      flex-shrink: 0;
    }
    .co-section--completed .co-section__number { display: none; }

    .co-section__check {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-full);
      background: var(--color-success);
      color: var(--color-text-inverse);
      flex-shrink: 0;
    }

    .co-section__label {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
      flex: 1;
    }

    .co-section__summary {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .co-section__chevron {
      color: var(--color-text-muted);
      transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
      flex-shrink: 0;
    }
    .co-section__head[aria-expanded="true"] .co-section__chevron {
      transform: rotate(180deg);
    }

    .co-section__body {
      padding: 0 var(--space-lg) var(--space-lg);
    }

    .co-section__subhead {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
      margin: 0 0 var(--space-md);
    }

    .co-section__footer {
      display: flex;
      justify-content: flex-end;
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border-light);
      margin-top: var(--space-lg);
    }

    /* ── Alerts ────────────────────────────────────────────── */
    .co-alert {
      display: flex;
      align-items: flex-start;
      gap: var(--space-sm);
      padding: var(--space-md);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      margin-bottom: var(--space-md);
      line-height: var(--leading-normal);
    }
    .co-alert--warning {
      background: color-mix(in srgb, var(--color-warning, #d97706) 12%, transparent);
      color: var(--color-text-primary);
    }
    .co-alert--warning svg { color: var(--color-warning, #d97706); flex-shrink: 0; margin-top: 1px; }
    .co-alert--error {
      background: color-mix(in srgb, var(--color-danger, #dc2626) 10%, transparent);
      color: var(--color-danger, #dc2626);
      font-weight: var(--weight-medium);
    }

    /* ── Selection Cards ───────────────────────────────────── */
    .co-cards {
      display: grid;
      gap: var(--space-sm);
    }

    .co-card {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-card);
      cursor: pointer;
      font-family: var(--font-body);
      text-align: left;
      transition: border-color 200ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 200ms ease, background 150ms ease;
    }
    .co-card:hover {
      border-color: var(--color-accent);
      background: var(--color-bg-elevated);
    }
    .co-card--selected {
      border-color: var(--color-accent) !important;
      background: var(--color-accent-light) !important;
      transform: scale(1.005);
      box-shadow: 0 0 0 3px var(--color-accent-light);
    }
    .co-card--add {
      border-style: dashed;
      border-color: var(--color-text-disabled);
    }
    .co-card--add:hover { border-color: var(--color-accent); }

    .co-card__radio {
      width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-full);
      border: 2px solid var(--color-border);
      flex-shrink: 0;
      margin-top: 2px;
      transition: border-color 200ms ease;
    }
    .co-card--selected .co-card__radio {
      border-color: var(--color-accent);
    }

    .co-card__radio-dot {
      width: 10px; height: 10px;
      border-radius: var(--radius-full);
      background: transparent;
      transition: background 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
                  transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .co-card__radio-dot.active {
      background: var(--color-accent);
      transform: scale(1);
    }

    .co-card__body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .co-card__body--row {
      flex-direction: row;
      align-items: center;
      gap: var(--space-md);
      flex-wrap: wrap;
    }
    .co-card__label {
      font-weight: var(--weight-semibold);
      font-size: var(--text-sm);
      color: var(--color-text-primary);
    }
    .co-card__detail {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      line-height: var(--leading-normal);
    }
    .co-card__detail--muted { color: var(--color-text-muted); }
    .co-card__brand {
      font-weight: var(--weight-bold);
      font-size: var(--text-sm);
      color: var(--color-text-primary);
    }

    /* ── Forms ─────────────────────────────────────────────── */
    .co-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      padding: var(--space-lg);
      background: var(--color-bg-elevated);
      border-radius: var(--radius-md);
      margin-top: var(--space-md);
    }
    .co-form--compact { padding: var(--space-md); }

    .co-form__row {
      display: grid;
      gap: var(--space-md);
    }
    .co-form__row--2 { grid-template-columns: 1fr 1fr; }
    .co-form__row--3 { grid-template-columns: 1fr 1fr 1fr; }

    .co-form__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      padding-top: var(--space-sm);
    }

    .co-input {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
    .co-input--inline {
      flex-direction: row;
      align-items: center;
      gap: var(--space-sm);
      flex-wrap: wrap;
    }
    .co-input__label {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
    }
    .co-input__field {
      padding: 10px 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      transition: border-color 200ms ease, box-shadow 200ms ease;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .co-input__field:focus {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-light);
    }
    .co-input__field::placeholder { color: var(--color-text-disabled); }
    .co-input__field:disabled {
      background: var(--color-bg-muted);
      color: var(--color-text-disabled);
    }
    .co-input--inline .co-input__field { flex: 1; min-width: 140px; }

    /* ── Express Pay ───────────────────────────────────────── */
    .co-express {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-sm);
    }
    .co-express__btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-xs);
      padding: var(--space-md);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-card);
      cursor: pointer;
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--color-text-secondary);
      transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .co-express__btn:hover {
      border-color: var(--color-accent);
      color: var(--color-text-primary);
      transform: scale(1.02);
    }
    .co-express__btn--selected {
      border-color: var(--color-accent) !important;
      background: var(--color-accent-light);
      color: var(--color-accent) !important;
      transform: scale(1.02);
    }
    .co-express__icon { font-size: 24px; line-height: 1; }

    /* ── Divider ───────────────────────────────────────────── */
    .co-divider {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin: var(--space-lg) 0;
      color: var(--color-text-disabled);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
    }
    .co-divider::before, .co-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-border-light);
    }

    /* ── B2B Toggle ────────────────────────────────────────── */
    .co-b2b-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-sm);
      background: none;
      cursor: pointer;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      transition: all 150ms ease;
      width: 100%;
      justify-content: center;
    }
    .co-b2b-toggle:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }

    /* ── Delivery Estimate ─────────────────────────────────── */
    .co-estimate {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-md);
      background: var(--color-success-light);
      border-radius: var(--radius-md);
      margin-top: var(--space-md);
      font-size: var(--text-sm);
      color: var(--color-text-primary);
    }
    .co-estimate strong { color: var(--color-success); }

    /* ── Trust Signals ─────────────────────────────────────── */
    .co-trust {
      display: flex;
      gap: var(--space-lg);
      padding: var(--space-md) 0;
      margin-top: var(--space-md);
    }
    .co-trust__item {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      font-size: 11px;
      color: var(--color-text-muted);
      font-weight: var(--weight-medium);
    }

    /* ── Review Items ──────────────────────────────────────── */
    .co-review-items {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }
    .co-review-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-sm) 0;
    }
    .co-review-item--unavailable { opacity: 0.55; }
    .co-review-item__thumb {
      width: 48px; height: 48px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
      background: var(--color-bg-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .co-review-item__thumb img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .co-review-item__placeholder {
      color: var(--color-text-disabled);
    }
    .co-review-item__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .co-review-item__name {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .co-review-item__meta {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .co-review-item__price {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--color-text-primary);
      flex-shrink: 0;
    }

    /* ── Promo Code ────────────────────────────────────────── */
    .co-promo {
      margin-top: var(--space-lg);
    }
    .co-promo__badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--color-success);
      font-size: var(--text-xs);
      font-weight: var(--weight-bold);
    }
    .co-promo__remove {
      background: none;
      border: none;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      text-decoration: underline;
      cursor: pointer;
      padding: 0;
    }
    .co-promo__remove:hover { color: var(--color-text-primary); }
    .co-promo__error {
      margin: var(--space-xs) 0 0;
      font-size: var(--text-xs);
      color: var(--color-danger, #dc2626);
    }

    /* ── Guest contact ─────────────────────────────────────── */
    .co-guest {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      padding: var(--space-md);
      background: var(--color-bg-elevated);
      border-radius: var(--radius-md);
      margin-top: var(--space-lg);
    }
    .co-guest__hint {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .co-guest__hint a { color: var(--color-accent); font-weight: var(--weight-semibold); }

    /* ── Review Summary ────────────────────────────────────── */
    .co-review-summary {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      padding: var(--space-md);
      background: var(--color-bg-elevated);
      border-radius: var(--radius-md);
      margin-top: var(--space-md);
    }
    .co-review-summary__row {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    /* ── Guarantee ─────────────────────────────────────────── */
    .co-guarantee {
      display: flex;
      align-items: flex-start;
      gap: var(--space-sm);
      padding: var(--space-md);
      margin-top: var(--space-lg);
      background: var(--color-success-light);
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      line-height: var(--leading-normal);
    }

    /* ═══════════════════════════════════════════════════════════════
       ORDER SUMMARY RAIL
       ═══════════════════════════════════════════════════════════════ */
    .co__rail {
      position: sticky;
      top: calc(var(--header-height, 72px) + var(--space-lg));
    }

    .co-rail {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-card);
    }

    .co-rail__title {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: var(--weight-bold);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-md);
    }

    /* ── Skeleton shimmer ──────────────────────────────────── */
    .co-rail__skeleton { display: flex; flex-direction: column; gap: var(--space-sm); }
    .co-skel {
      border-radius: var(--radius-sm);
      background: linear-gradient(90deg,
        var(--color-bg-muted) 25%, var(--color-bg-elevated) 50%, var(--color-bg-muted) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    .co-skel--row { height: 40px; }
    .co-skel--line { height: 14px; width: 70%; }
    .co-skel--divider { height: 1px; width: 100%; margin: var(--space-xs) 0; background: var(--color-border-light); animation: none; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .co-rail__items {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      max-height: 200px;
      overflow-y: auto;
    }

    .co-rail__item {
      display: flex;
      gap: var(--space-sm);
      align-items: center;
    }

    .co-rail__item-thumb {
      width: 40px; height: 40px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
      background: var(--color-bg-muted);
      position: relative;
    }
    .co-rail__item-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .co-rail__item-ph { width: 100%; height: 100%; background: var(--color-bg-muted); }

    .co-rail__item-qty {
      position: absolute;
      top: -4px; right: -4px;
      width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-full);
      background: var(--color-text-primary);
      color: var(--color-text-inverse);
      font-size: 10px;
      font-weight: var(--weight-bold);
    }

    .co-rail__item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .co-rail__item-name {
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .co-rail__item-price {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
    }

    .co-rail__divider {
      height: 1px;
      background: var(--color-border-light);
      margin: var(--space-md) 0;
    }

    .co-rail__breakdown {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .co-rail__row {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    .co-rail__free {
      color: var(--color-success);
      font-weight: var(--weight-semibold);
    }

    .co-rail__row--discount {
      color: var(--color-success);
    }

    .co-rail__total {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: var(--text-lg);
      font-weight: var(--weight-bold);
      color: var(--color-text-primary);
    }

    .co-rail__total-value {
      font-size: var(--text-2xl);
      font-family: var(--font-display);
    }

    .co-rail__cta {
      margin-top: var(--space-lg);
    }

    .co-rail__guarantee-text {
      text-align: center;
      font-size: 11px;
      color: var(--color-text-muted);
      margin: var(--space-sm) 0 0;
    }

    /* ═══════════════════════════════════════════════════════════════
       BUTTONS
       ═══════════════════════════════════════════════════════════════ */
    .co-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      padding: 12px 24px;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: var(--weight-bold);
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
      text-decoration: none;
      white-space: nowrap;
    }
    .co-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .co-btn--primary {
      background: var(--color-accent);
      color: var(--color-text-inverse);
    }
    .co-btn--primary:hover:not(:disabled) {
      background: var(--color-accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(74, 99, 232, 0.3);
    }

    .co-btn--ghost {
      background: none;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .co-btn--ghost:hover:not(:disabled) {
      border-color: var(--color-text-secondary);
      color: var(--color-text-primary);
    }

    .co-btn--sm { padding: 8px 16px; font-size: var(--text-xs); }
    .co-btn--xs { padding: 4px 10px; font-size: 11px; border-radius: var(--radius-sm); }

    /* ── CTA Button ────────────────────────────────────────── */
    .co-btn--cta {
      width: 100%;
      padding: 16px 24px;
      font-size: var(--text-base);
      border-radius: var(--radius-md);
      background: var(--color-accent);
      color: var(--color-text-inverse);
      position: relative;
      overflow: hidden;
    }
    .co-btn--cta:hover:not(:disabled) {
      background: var(--color-accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(74, 99, 232, 0.35);
    }
    .co-btn--cta:active:not(:disabled) {
      transform: translateY(0);
    }

    .co-btn--loading .co-btn__label { opacity: 0; }
    .co-btn--loading .co-btn__spinner { position: absolute; }

    .co-btn--success {
      background: var(--color-success) !important;
      transform: scale(1.02);
    }
    .co-btn--success .co-btn__label { opacity: 1; }

    .co-btn__spinner {
      width: 20px; height: 20px;
      border: 2.5px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: var(--radius-full);
      animation: spin 0.7s linear infinite;
    }

    .co-btn__check {
      animation: checkPop 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes checkPop {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .co-btn--mobile {
      padding: 14px 24px;
      font-size: var(--text-sm);
    }

    /* ═══════════════════════════════════════════════════════════════
       MOBILE STICKY BAR
       ═══════════════════════════════════════════════════════════════ */
    .co-mobile-bar {
      display: none;
    }

    /* ═══════════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .co {
        grid-template-columns: 1fr;
        padding: var(--space-md);
      }
      .co__rail {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: var(--z-sticky);
        top: auto;
        display: none;
      }
      .co__rail .co-rail__items { display: none; }
      .co__rail .co-rail__cta { display: none; }

      .co-mobile-bar {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: var(--z-sticky);
        background: var(--color-bg-card);
        border-top: 1px solid var(--color-border);
        padding: var(--space-md) var(--space-lg);
        align-items: center;
        justify-content: space-between;
        gap: var(--space-md);
        box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
      }
      .co-mobile-bar__total {
        display: flex;
        flex-direction: column;
      }
      .co-mobile-bar__label {
        font-size: 11px;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wider);
      }
      .co-mobile-bar__value {
        font-size: var(--text-lg);
        font-weight: var(--weight-bold);
        font-family: var(--font-display);
        color: var(--color-text-primary);
      }
    }

    @media (max-width: 640px) {
      .co__title { font-size: var(--text-xl); margin-bottom: var(--space-md); }

      .co-form__row--2,
      .co-form__row--3 { grid-template-columns: 1fr; }

      .co-express { grid-template-columns: 1fr; }

      .co-trust { flex-direction: column; gap: var(--space-sm); }

      .co-section__summary { display: none; }

      .co-stepper__label { display: none; }

      .co { padding-bottom: 80px; }
    }

    /* ═══════════════════════════════════════════════════════════════
       REDUCED MOTION
       ═══════════════════════════════════════════════════════════════ */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage {
  private readonly cart = inject(CartService);
  private readonly products = inject(ProductApi);
  private readonly orders = inject(OrderApi);
  private readonly promotions = inject(PromotionApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly steps: { key: AccordionSection; label: string }[] = [
    { key: 'delivery', label: 'Delivery' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' },
  ];

  /* ── Accordion state ─────────────────────────────────── */
  readonly expandedSection = signal<AccordionSection>('delivery');
  readonly completedSections = signal(new Set<AccordionSection>());

  /* ── Cart lines ──────────────────────────────────────────
     `loading` is derived directly from the same pipeline that
     produces `lines`, via `tap` side-effects — no synthetic
     setTimeout, and no effect() created outside an injection
     context (that combination was throwing NG0203 at runtime,
     which silently broke reactivity for everything downstream,
     including the totals in the rail). */
  private readonly cartItems$ = toObservable(this.cart.items);
  readonly loading = signal(false);
  readonly lines = toSignal(
    this.cartItems$.pipe(
      tap(() => this.loading.set(true)),
      switchMap((items) => {
        if (items.length === 0) {
          this.loading.set(false);
          return of([] as CheckoutLine[]);
        }
        const lines$ = items.map((item) =>
          this.products.getByIdCached(Number(item.productId)).pipe(
            map((product) => ({ productId: item.productId, quantity: item.quantity, product })),
            catchError(() => of({ productId: item.productId, quantity: item.quantity, product: null }))
          )
        );
        return combineLatest(lines$).pipe(tap(() => this.loading.set(false)));
      })
    ),
    { initialValue: [] as CheckoutLine[] }
  );

  /** True if any line's product failed to resolve — must block checkout, not crash it. */
  readonly hasUnavailableItems = computed(() => this.lines().some((l) => l.product === null));
  readonly unavailableItemLabel = computed(() =>
    this.lines()
      .filter((l) => !l.product)
      .map((l) => 'Product #' + l.productId)
      .join(', ')
  );

  /* ── Delivery ────────────────────────────────────────── */
  readonly selectedAddressId = signal<string | null>(null);
  readonly showNewAddress = signal(false);
  readonly selectedAddress = computed(() => this.addresses.find(a => a.id === this.selectedAddressId()) ?? null);
  readonly estimatedDelivery = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  });

  readonly addresses: Address[] = [
    { id: 'a1', label: 'Home', name: 'John Doe', street: '742 Evergreen Terrace', city: 'Springfield', state: 'IL', zip: '62704', country: 'United States', phone: '+1 (555) 123-4567' },
    { id: 'a2', label: 'Office', name: 'John Doe', street: '1600 Pennsylvania Ave NW', city: 'Washington', state: 'DC', zip: '20500', country: 'United States', phone: '+1 (555) 987-6543' },
    { id: 'a3', label: 'Parents', name: 'John Doe', street: '42 Wallaby Way', city: 'Sydney', state: 'NSW', zip: '2000', country: 'United States', phone: '+1 (555) 000-1111' },
  ];
  newAddress: Address = { id: '', label: '', name: '', street: '', city: '', state: '', zip: '', country: 'United States', phone: '' };

  selectAddress(addr: Address): void {
    this.selectedAddressId.set(addr.id);
    this.showNewAddress.set(false);
  }

  toggleNewAddress(): void {
    this.showNewAddress.set(!this.showNewAddress());
  }

  toggleNewCard(): void {
    this.showNewCard.set(!this.showNewCard());
  }

  toggleB2b(): void {
    this.b2bMode.set(!this.b2bMode());
    if (this.b2bMode()) {
      this.selectedCardId.set(null);
      this.selectedExpressPay.set(null);
    }
  }

  getCardLast4(id: string): string {
    return this.getCard(id)?.last4 ?? '';
  }

  saveNewAddress(): void {
    if (!this.newAddress.label || !this.newAddress.name || !this.newAddress.street) return;
    const id = 'new-' + Date.now();
    const addr = { ...this.newAddress, id };
    this.addresses.push(addr);
    this.selectedAddressId.set(id);
    this.showNewAddress.set(false);
    this.newAddress = { id: '', label: '', name: '', street: '', city: '', state: '', zip: '', country: 'United States', phone: '' };
  }

  /* ── Payment ─────────────────────────────────────────── */
  readonly selectedCardId = signal<string | null>(null);
  readonly selectedExpressPay = signal<string | null>(null);
  readonly showNewCard = signal(false);
  readonly b2bMode = signal(false);
  /** Was [(ngModel)] on a signal — Angular assigns rather than calls, which silently
   *  replaces the signal with a string and breaks every computed() that reads it.
   *  Fixed to one-way bind + explicit .set() on change everywhere below. */
  readonly poNumber = signal('');

  readonly cards: PaymentCard[] = [
    { id: 'c1', brand: 'Visa', last4: '4242', exp: '12/26', name: 'John Doe' },
    { id: 'c2', brand: 'Mastercard', last4: '8888', exp: '09/27', name: 'John Doe' },
  ];
  newCard = { number: '', exp: '', cvc: '', name: '' };

  readonly expressPayOptions = [
    { id: 'apple', label: 'Apple Pay', icon: '🍎' },
    { id: 'google', label: 'Google Pay', icon: 'G' },
    { id: 'paypal', label: 'PayPal', icon: 'P' },
  ];

  selectCard(id: string): void {
    this.selectedCardId.set(id);
    this.selectedExpressPay.set(null);
    this.b2bMode.set(false);
    this.showNewCard.set(false);
  }

  selectExpressPay(id: string): void {
    this.selectedExpressPay.set(id);
    this.selectedCardId.set(null);
    this.b2bMode.set(false);
  }

  getCard(id: string): PaymentCard | undefined {
    return this.cards.find(c => c.id === id);
  }

  readonly canCompletePayment = computed(() => {
    if (this.b2bMode()) return this.poNumber().trim().length > 0;
    return this.selectedCardId() !== null || this.selectedExpressPay() !== null;
  });

  readonly paymentSummaryText = computed(() => {
    if (this.b2bMode()) return 'PO #' + this.poNumber();
    if (this.selectedCardId()) return '···· ' + this.getCardLast4(this.selectedCardId()!);
    return this.selectedExpressPay() ?? '';
  });

  saveNewCard(): void {
    if (!this.newCard.number || !this.newCard.exp || !this.newCard.name) return;
    const last4 = this.newCard.number.replace(/\s/g, '').slice(-4);
    const brand = this.newCard.number.startsWith('4') ? 'Visa' : 'Mastercard';
    const id = 'nc-' + Date.now();
    this.cards.push({ id, brand, last4, exp: this.newCard.exp, name: this.newCard.name });
    this.selectedCardId.set(id);
    this.selectedExpressPay.set(null);
    this.showNewCard.set(false);
    this.newCard = { number: '', exp: '', cvc: '', name: '' };
  }

  formatCardNumber(): void {
    let v = this.newCard.number.replace(/\D/g, '').slice(0, 16);
    this.newCard.number = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  formatExpiry(): void {
    let v = this.newCard.exp.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
    this.newCard.exp = v;
  }

  /* ── Guest checkout — parallel path, no forced redirect ── */
  readonly isGuest = computed(() => !this.auth.isLoggedIn());
  readonly guestEmail = signal('');

  /* ── Promo — validated server-side, never hardcoded client codes ── */
  readonly promoCode = signal('');
  readonly promoApplied = signal(false);
  readonly promoDiscount = signal(0);
  readonly promoValidating = signal(false);
  readonly promoError = signal<string | null>(null);

  applyPromo(): void {
    const code = this.promoCode().trim();
    if (!code || this.promoValidating()) return;
    this.promoValidating.set(true);
    this.promoError.set(null);
    this.promotions
      .validate(code, this.subtotal())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.promoValidating.set(false);
        if (result.valid) {
          this.promoApplied.set(true);
          this.promoDiscount.set(result.discountAmount);
        } else {
          this.promoError.set(result.message ?? 'That code is not valid.');
        }
      });
  }

  removePromo(): void {
    this.promoApplied.set(false);
    this.promoDiscount.set(0);
    this.promoCode.set('');
    this.promoError.set(null);
  }

  /* ── Computed totals ─────────────────────────────────── */
  readonly subtotal = computed(() => {
    return this.lines().reduce((sum, l) => {
      return sum + (l.product ? Number(l.product.price) * l.quantity : 0);
    }, 0);
  });

  readonly shippingCost = computed(() => this.subtotal() >= 150 ? 0 : 5.00);
  readonly taxRate = 0.084;
  readonly taxAmount = computed(() => +(this.subtotal() * this.taxRate).toFixed(2));
  readonly discountAmount = computed(() => this.promoApplied() ? +this.promoDiscount().toFixed(2) : 0);
  readonly total = computed(() => {
    const t = this.subtotal() + this.shippingCost() + this.taxAmount() - this.discountAmount();
    return Math.max(0, +t.toFixed(2));
  });

  /* ── Animated totals (count-up tween) ────────────────── */
  readonly animatedSubtotal = signal(0);
  readonly animatedTax = signal(0);
  readonly animatedTotal = signal(0);

  constructor() {
    let prevSubtotal = 0;
    let prevTax = 0;
    let prevTotal = 0;

    effect(() => {
      const targetSub = this.subtotal();
      const targetTax = this.taxAmount();
      const targetTotal = this.total();

      if (targetSub === prevSubtotal && targetTax === prevTax && targetTotal === prevTotal) return;
      prevSubtotal = targetSub;
      prevTax = targetTax;
      prevTotal = targetTotal;

      this.animateValue(this.animatedSubtotal, this.animatedSubtotal(), targetSub, 300);
      this.animateValue(this.animatedTax, this.animatedTax(), targetTax, 300);
      this.animateValue(this.animatedTotal, this.animatedTotal(), targetTotal, 300);
    });
  }

  toNum(v: unknown): number { return Number(v); }

  private animateValue(target: ReturnType<typeof signal<number>>, from: number, to: number, duration: number): void {
    if (Math.abs(from - to) < 0.01) { target.set(to); return; }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      target.set(+(from + (to - from) * eased).toFixed(2));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ── Accordion navigation ────────────────────────────── */
  toggleSection(section: AccordionSection): void {
    if (section !== 'delivery' && !this.completedSections().has(this.prevSection(section))) return;
    this.expandedSection.set(section);
  }

  private prevSection(s: AccordionSection): AccordionSection {
    if (s === 'payment') return 'delivery';
    return 'payment';
  }

  completeDelivery(): void {
    if (!this.selectedAddress()) return;
    this.completedSections.update(s => new Set([...s, 'delivery']));
    this.expandedSection.set('payment');
  }

  completePayment(): void {
    if (!this.canCompletePayment()) return;
    this.completedSections.update(s => new Set([...s, 'payment']));
    this.expandedSection.set('review');
  }

  /* ── Submit ──────────────────────────────────────────── */
  readonly submitting = signal(false);
  readonly orderPlaced = signal(false);
  readonly submitError = signal<string | null>(null);

  /** Generated once per checkout attempt so a client retry or a
   *  flaky-network resend can't create a duplicate order — the server
   *  is expected to dedupe on this key, not just on the click guard. */
  private idempotencyKey = crypto.randomUUID();

  placeOrder(): void {
    if (this.submitting() || this.orderPlaced()) return;
    if (this.hasUnavailableItems()) return;
    if (this.isGuest() && !this.guestEmail().trim()) {
      this.submitError.set('Please enter an email address so we can send your order confirmation.');
      return;
    }

    const userId = this.auth.userId();

    const req: CreateOrderRequestExt = {
      userId: userId ?? undefined,
      guestEmail: this.isGuest() ? this.guestEmail().trim() : undefined,
      idempotencyKey: this.idempotencyKey,
      currency: 'USD',
      items: this.lines().map((l) => {
        const product = l.product!; // safe: guarded by hasUnavailableItems above
        return {
          productId: l.productId,
          productName: product.name,
          quantity: l.quantity,
          unitPrice: String(product.price),
        };
      }),
    } as CreateOrderRequestExt;

    this.submitting.set(true);
    this.submitError.set(null);

    this.orders
      .create(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cart.clear();
          this.submitting.set(false);
          this.orderPlaced.set(true);
          this.idempotencyKey = crypto.randomUUID(); // fresh key for any future order
          setTimeout(() => this.router.navigateByUrl('/orders'), 1200);
        },
        error: () => {
          this.submitting.set(false);
          this.submitError.set('We could not place your order. Please check your details and try again.');
        },
      });
  }
}
