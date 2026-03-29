import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { OrderApi, OrderResponse } from '../../core/api/order.api';
import { FALLBACK_PRODUCTS } from '../products/fallback-products.data';

/* ── Extended display model with UI-only fields ────────────── */
interface DisplayOrder extends OrderResponse {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  contactEmail: string;
  contactPhone: string;
  cardLast4: string;
  cardExpiry: string;
}

/* ── Fallback mock orders shown when API is unavailable ────── */
const FALLBACK_ORDERS: DisplayOrder[] = [
  {
    id: 1001,
    orderNumber: 'EM-54879',
    userId: 'demo',
    status: 'SHIPPED',
    totalAmount: '238.00',
    currency: 'USD',
    createdAt: '2025-03-22T10:30:00Z',
    updatedAt: '2025-03-24T14:00:00Z',
    items: [
      { id: 1, productId: '9001', productName: 'Slim Fit Oxford Shirt', quantity: 1, unitPrice: '89.00', totalPrice: '89.00' },
      { id: 2, productId: '9035', productName: 'Leather Crossbody Bag', quantity: 1, unitPrice: '149.00', totalPrice: '149.00' },
    ],
    shippingName: 'Floyd Miles',
    shippingAddress: '7363 Cynthia Pass',
    shippingCity: 'Toronto, ON N3Y 4H8',
    contactEmail: 'f.miles@example.com',
    contactPhone: '1-555-067-4310',
    cardLast4: '4242',
    cardExpiry: '02/26',
  },
  {
    id: 1002,
    orderNumber: 'EM-54102',
    userId: 'demo',
    status: 'DELIVERED',
    totalAmount: '576.00',
    currency: 'USD',
    createdAt: '2025-02-14T08:15:00Z',
    updatedAt: '2025-02-20T09:00:00Z',
    items: [
      { id: 3, productId: '9052', productName: 'Classic Running Sneakers', quantity: 2, unitPrice: '129.00', totalPrice: '258.00' },
      { id: 4, productId: '9069', productName: 'Wireless Noise-Cancelling Headphones', quantity: 1, unitPrice: '318.00', totalPrice: '318.00' },
    ],
    shippingName: 'Floyd Miles',
    shippingAddress: '7363 Cynthia Pass',
    shippingCity: 'Toronto, ON N3Y 4H8',
    contactEmail: 'f.miles@example.com',
    contactPhone: '1-555-067-4310',
    cardLast4: '4242',
    cardExpiry: '02/26',
  },
  {
    id: 1003,
    orderNumber: 'EM-53887',
    userId: 'demo',
    status: 'PROCESSING',
    totalAmount: '65.00',
    currency: 'USD',
    createdAt: '2025-04-01T16:45:00Z',
    updatedAt: '2025-04-02T08:00:00Z',
    items: [
      { id: 5, productId: '9085', productName: 'Scented Soy Candle Set', quantity: 1, unitPrice: '65.00', totalPrice: '65.00' },
    ],
    shippingName: 'Floyd Miles',
    shippingAddress: '7363 Cynthia Pass',
    shippingCity: 'Toronto, ON N3Y 4H8',
    contactEmail: 'f.miles@example.com',
    contactPhone: '1-555-067-4310',
    cardLast4: '4242',
    cardExpiry: '02/26',
  },
];

@Component({
  standalone: true,
  selector: 'app-orders-page',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  imports: [CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(OrderApi);

  /* ── State signals ───────────────────────────────────────── */
  readonly isLoading = signal(false);
  readonly displayOrders = signal<DisplayOrder[]>([]);
  readonly usingFallback = signal(false);
  readonly fallbackDismissed = signal(false);

  /* ── Lifecycle ───────────────────────────────────────────── */
  ngOnInit(): void {
    this.loadOrders();
  }

  /* ── Data loading ────────────────────────────────────────── */
  loadOrders(): void {
    const userId = this.auth.userId();
    if (!userId) return;

    this.isLoading.set(true);
    this.usingFallback.set(false);

    this.api
      .getByUserId(userId)
      .pipe(
        catchError(() => {
          this.usingFallback.set(true);
          return of(null);
        })
      )
      .subscribe((orders) => {
        if (orders && orders.length > 0) {
          this.displayOrders.set(orders.map((o) => this.enrichOrder(o)));
        } else if (this.usingFallback()) {
          this.displayOrders.set(FALLBACK_ORDERS);
        } else {
          this.displayOrders.set([]);
        }
        this.isLoading.set(false);
      });
  }

  dismissFallback(): void {
    this.fallbackDismissed.set(true);
  }

  /* ── Template helpers ────────────────────────────────────── */
  getProductImage(productId: string): string {
    const product = FALLBACK_PRODUCTS.find((p) => String(p.id) === productId);
    return product?.imageUrl ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=320&q=80';
  }

  getProductDescription(productId: string): string {
    const product = FALLBACK_PRODUCTS.find((p) => String(p.id) === productId);
    return product?.description ?? 'Premium quality product from the emox collection.';
  }

  getProgressPercent(status: string): number {
    const map: Record<string, number> = {
      PLACED: 5,
      PROCESSING: 37,
      SHIPPED: 70,
      DELIVERED: 100,
    };
    return map[status?.toUpperCase()] ?? 10;
  }

  getProgressLabel(status: string, updatedAt: string): string {
    const date = new Date(updatedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const map: Record<string, string> = {
      PLACED: `Order placed on ${date}`,
      PROCESSING: `Preparing to ship on ${date}`,
      SHIPPED: `Shipped on ${date}`,
      DELIVERED: `Delivered on ${date}`,
    };
    return map[status?.toUpperCase()] ?? `Updated on ${date}`;
  }

  getStepActive(status: string, step: number): boolean {
    const order = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const idx = order.indexOf(status?.toUpperCase());
    return idx >= step;
  }

  getTax(subtotal: string): number {
    return +(parseFloat(subtotal) * 0.084).toFixed(2);
  }

  getOrderTotal(subtotal: string): number {
    const amt = parseFloat(subtotal);
    return +(amt + 5 + this.getTax(subtotal)).toFixed(2);
  }

  /* ── Private helpers ─────────────────────────────────────── */
  private enrichOrder(order: OrderResponse): DisplayOrder {
    return {
      ...order,
      shippingName: 'Floyd Miles',
      shippingAddress: '7363 Cynthia Pass',
      shippingCity: 'Toronto, ON N3Y 4H8',
      contactEmail: 'f.miles@example.com',
      contactPhone: '1-555-067-4310',
      cardLast4: '4242',
      cardExpiry: '02/26',
    };
  }
}
