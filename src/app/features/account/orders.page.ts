import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { OrderApi, type OrderResponse } from '../../core/api/order.api';

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

const STATUS_SEQUENCE = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

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

  readonly isLoading = signal(false);
  readonly orders = signal<OrderResponse[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly copiedOrderId = signal<number | null>(null);

  readonly filteredOrders = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.orders().filter((order) => {
      const matchesStatus = status === 'ALL' || order.status?.toUpperCase() === status;
      if (!matchesStatus) return false;
      if (!query) return true;

      const haystack = [
        order.orderNumber,
        ...order.items.map((item) => item.productName),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  });

  readonly statusCounts = computed(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: 0,
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
    };
    for (const order of this.orders()) {
      counts.ALL++;
      const key = order.status?.toUpperCase() as StatusFilter;
      if (key in counts) counts[key]++;
    }
    return counts;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const userId = this.auth.userId();
    if (!userId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api
      .getByUserId(userId)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load orders. Please try again later.');
          return of(null);
        })
      )
      .subscribe((orders) => {
        this.orders.set(orders ?? []);
        this.isLoading.set(false);
      });
  }

  logout(): void {
    void this.auth.logoutAndRedirect('/login');
  }

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('ALL');
  }

  getProgressPercent(status: string): number {
    const map: Record<string, number> = {
      PENDING: 5,
      CONFIRMED: 15,
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
      PENDING: `Order placed on ${date}`,
      CONFIRMED: `Confirmed on ${date}`,
      PROCESSING: `Preparing to ship on ${date}`,
      SHIPPED: `Shipped on ${date}`,
      DELIVERED: `Delivered on ${date}`,
    };
    return map[status?.toUpperCase()] ?? `Updated on ${date}`;
  }

  getStepActive(status: string, step: number): boolean {
    const idx = STATUS_SEQUENCE.indexOf(status?.toUpperCase() as (typeof STATUS_SEQUENCE)[number]);
    return idx >= step;
  }

  getStatusMeta(status: string): { label: string; className: string } {
    const key = status?.toUpperCase();
    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'is-placed' },
      CONFIRMED: { label: 'Confirmed', className: 'is-processing' },
      PROCESSING: { label: 'Processing', className: 'is-processing' },
      SHIPPED: { label: 'Shipped', className: 'is-shipped' },
      DELIVERED: { label: 'Delivered', className: 'is-delivered' },
    };
    return map[key] ?? { label: status, className: 'is-placed' };
  }

  getItemCount(order: OrderResponse): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTrackingCode(order: OrderResponse): string {
    const digits = order.orderNumber.replace(/\D/g, '').padStart(9, '0').slice(-9);
    return `EMX ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  copyTracking(order: OrderResponse): void {
    const code = this.getTrackingCode(order);
    if (navigator?.clipboard) {
      void navigator.clipboard.writeText(code);
    }
    this.copiedOrderId.set(order.id);
    setTimeout(() => {
      if (this.copiedOrderId() === order.id) {
        this.copiedOrderId.set(null);
      }
    }, 1800);
  }

  formatAddress(order: OrderResponse): string {
    const parts = [
      order.shippingAddressLine1,
      order.shippingAddressLine2,
      order.shippingCity && order.shippingState
        ? `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode ?? ''}`
        : order.shippingCity ?? '',
    ].filter(Boolean);
    return parts.join(', ');
  }

  formatFullAddress(order: OrderResponse): string {
    const parts = [
      order.shippingAddressLine1,
      order.shippingAddressLine2,
      order.shippingCity,
      order.shippingState,
      order.shippingPostalCode,
      order.shippingCountry,
    ].filter(Boolean);
    return parts.join(', ');
  }

  getPaymentLabel(order: OrderResponse): string {
    if (!order.paymentMethodType) return 'N/A';
    const type = order.paymentMethodType.toUpperCase();
    if (type === 'PO') return `PO #${order.paymentLast4}`;
    if (type === 'CARD' && order.paymentLast4) return `•••• ${order.paymentLast4}`;
    if (type === 'APPLE' || type === 'GOOGLE' || type === 'PAYPAL') {
      return type.charAt(0) + type.slice(1).toLowerCase();
    }
    return type;
  }
}
