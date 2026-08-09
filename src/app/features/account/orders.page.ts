import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal,} from '@angular/core';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {catchError, of} from 'rxjs';

import {AuthService} from '../../core/auth/auth.service';
import {LayoutService} from '../../core/layout/layout.service';
import {OrderApi} from '../../core/api/order.api';
import {OrderResponse} from '../../core/api/types';

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

type StatusFilter = 'ALL' | 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
type Theme = 'light' | 'dark';


const STATUS_SEQUENCE = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

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
  protected readonly layout = inject(LayoutService);
  private readonly api = inject(OrderApi);

  /* ── State signals ───────────────────────────────────────── */
  readonly isLoading = signal(false);
  readonly displayOrders = signal<DisplayOrder[]>([]);
  readonly usingFallback = signal(false);
  readonly fallbackDismissed = signal(false);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly copiedOrderId = signal<number | null>(null);

  /** Dynamic theme synced with system LayoutService */
  readonly theme = computed<Theme>(() => (this.layout.isDark() ? 'dark' : 'light'));

  /* ── Derived state ───────────────────────────────────────── */
  readonly filteredOrders = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.displayOrders().filter((order) => {
      const matchesStatus = status === 'ALL' || order.status?.toUpperCase() === status;
      if (!matchesStatus) return false;
      if (!query) return true;

      const haystack = [
        order.orderNumber,
        this.getTrackingCode(order),
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
      PLACED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
    };
    for (const order of this.displayOrders()) {
      counts.ALL++;
      const key = order.status?.toUpperCase() as StatusFilter;
      if (key in counts) counts[key]++;
    }
    return counts;
  });

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
          this.displayOrders.set([]);
        } else {
          this.displayOrders.set([]);
        }
        this.isLoading.set(false);
      });
  }

  dismissFallback(): void {
    this.fallbackDismissed.set(true);
  }

  logout(): void {
    void this.auth.logoutAndRedirect('/login');
  }

  /* ── Theme ───────────────────────────────────────────────── */
  toggleTheme(): void {
    this.layout.toggleTheme();
  }


  /* ── Filter & search ─────────────────────────────────────── */
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

  /* ── Template helpers ────────────────────────────────────── */
  getProductImage(productId: string): string {
    return '';
  }

  getProductDescription(productId: string): string {
    return '';
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
    const idx = STATUS_SEQUENCE.indexOf(status?.toUpperCase() as (typeof STATUS_SEQUENCE)[number]);
    return idx >= step;
  }

  getStatusMeta(status: string): { label: string; className: string } {
    const key = status?.toUpperCase();
    const map: Record<string, { label: string; className: string }> = {
      PLACED: {label: 'Order placed', className: 'is-placed'},
      PROCESSING: {label: 'Processing', className: 'is-processing'},
      SHIPPED: {label: 'Shipped', className: 'is-shipped'},
      DELIVERED: {label: 'Delivered', className: 'is-delivered'},
    };
    return map[key] ?? {label: status, className: 'is-placed'};
  }

  getTax(subtotal: string): number {
    return +(parseFloat(subtotal) * 0.084).toFixed(2);
  }

  getOrderTotal(subtotal: string): number {
    const amt = parseFloat(subtotal);
    return +(amt + 5 + this.getTax(subtotal)).toFixed(2);
  }

  getItemCount(order: DisplayOrder): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTrackingCode(order: DisplayOrder): string {
    const digits = order.orderNumber.replace(/\D/g, '').padStart(9, '0').slice(-9);
    return `EMX ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  copyTracking(order: DisplayOrder): void {
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
