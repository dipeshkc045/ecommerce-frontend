import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { CartService } from '../../core/cart/cart.service';
import { ProductApi, type ProductResponse } from '../../core/api/product.api';
import { OrderApi, type CreateOrderRequest } from '../../core/api/order.api';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-checkout-page',
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    CurrencyPipe,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <h1 class="mat-headline-small">Checkout</h1>

    <mat-card *ngIf="lines().length === 0">
      <mat-card-content>Your cart is empty.</mat-card-content>
      <mat-card-actions>
        <a mat-flat-button color="primary" routerLink="/products">Shop products</a>
      </mat-card-actions>
    </mat-card>

    <div class="layout" *ngIf="lines().length > 0">
      <mat-card class="summary">
        <mat-card-header>
          <mat-card-title>Order summary</mat-card-title>
          <mat-card-subtitle>Review items before placing the order.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            <mat-list-item *ngFor="let line of lines()">
              <div matListItemTitle>{{ line.product?.name ?? ('Product #' + line.productId) }}</div>
              <div matListItemLine>
                Qty: {{ line.quantity }}
                <span *ngIf="line.product"> · {{ line.product.price | currency:'USD':'symbol' }}</span>
              </div>
            </mat-list-item>
          </mat-list>

          <mat-divider />

          <div class="totals" *ngIf="totalAmount() !== null">
            <span>Total</span>
            <strong>{{ totalAmount() | currency:'USD':'symbol' }}</strong>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="actions-card">
        <mat-card-header>
          <mat-card-title>Checkout</mat-card-title>
          <mat-card-subtitle *ngIf="!canSubmit()">Login required to place order.</mat-card-subtitle>
          <mat-card-subtitle *ngIf="canSubmit()">Ready to place your order.</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p class="muted">We will create the order under your account and clear your cart on success.</p>
        </mat-card-content>

        <mat-card-actions align="end">
          <a mat-button routerLink="/cart" [disabled]="submitting()">Back</a>

          <button
            mat-flat-button
            color="primary"
            type="button"
            (click)="placeOrder()"
            [disabled]="submitting() || !canSubmit()"
          >
            <span *ngIf="!submitting()">Place order</span>
            <span *ngIf="submitting()">Placing…</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>

    <div class="center" *ngIf="submitting()">
      <mat-progress-spinner diameter="32" mode="indeterminate" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
  ,
  styles: [
    `
      .layout {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }

      .summary {
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        box-shadow: 0 12px 30px rgba(87, 66, 46, 0.12);
      }

      .actions-card {
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        box-shadow: 0 10px 26px rgba(87, 66, 46, 0.08);
      }

      .totals {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 18px;
        margin-top: 12px;
      }

      .center {
        display: grid;
        place-items: center;
        margin-top: 14px;
      }
    `
  ]
})
export class CheckoutPage {
  private readonly cart = inject(CartService);
  private readonly products = inject(ProductApi);
  private readonly orders = inject(OrderApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly submitting = signal(false);

  private readonly cartItems$ = toObservable(this.cart.items);

  readonly lines = toSignal(
    this.cartItems$.pipe(
      switchMap((items) => {
        if (items.length === 0) return of([] as CheckoutLine[]);

        const lines$ = items.map((item) =>
          this.products.getByIdCached(Number(item.productId)).pipe(
            map((product) => ({ productId: item.productId, quantity: item.quantity, product })),
            catchError(() => of({ productId: item.productId, quantity: item.quantity, product: null }))
          )
        );

        return combineLatest(lines$);
      })
    ),
    { initialValue: [] as CheckoutLine[] }
  );

  readonly totalAmount = computed(() => {
    const lines = this.lines();
    if (lines.length === 0) return null;
    const sum = lines.reduce((acc, line) => {
      const price = line.product ? Number(line.product.price) : 0;
      return acc + price * line.quantity;
    }, 0);
    return Number.isFinite(sum) ? sum.toFixed(2) : null;
  });

  readonly canSubmit = computed(() => {
    const userId = this.auth.userId();
    if (!userId) return false;
    const lines = this.lines();
    if (lines.length === 0) return false;
    return lines.every((l) => !!l.product);
  });

  placeOrder(): void {
    if (this.submitting()) return;
    if (!this.canSubmit()) {
      this.snack.open('Missing product details or login.', 'OK', { duration: 2500 });
      return;
    }

    const userId = this.auth.userId();
    if (!userId) return;

    const req: CreateOrderRequest = {
      userId,
      currency: 'USD',
      items: this.lines().map((l) => ({
        productId: l.productId,
        productName: (l.product as ProductResponse).name,
        quantity: l.quantity,
        unitPrice: (l.product as ProductResponse).price
      }))
    };

    this.submitting.set(true);
    this.orders.create(req).subscribe({
      next: (order) => {
        this.cart.clear();
        this.submitting.set(false);
        this.snack.open(`Order ${order.orderNumber} placed`, 'OK', { duration: 3000 });
        this.router.navigateByUrl('/orders');
      },
      error: () => {
        this.submitting.set(false);
        this.snack.open('Failed to place order', 'OK', { duration: 3000 });
      }
    });
  }
}

type CheckoutLine = {
  productId: string;
  quantity: number;
  product: ProductResponse | null;
};
