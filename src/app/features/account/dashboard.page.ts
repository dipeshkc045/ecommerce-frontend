import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { LayoutService } from '../../core/layout/layout.service';
import { NotificationService } from '../../core/services/notification.service';

export interface OrderStep {
  id: number;
  label: string;
  sublabel: string;
  status: 'done' | 'active' | 'pending';
}

export interface ReorderItem {
  id: string;
  name: string;
  metaText: string;
  metaType: 'low' | 'deal' | 'routine';
  gradientColors: [string, string];
  price: number;
  ctaText: string;
  ctaType: 'default' | 'deal';
}

export interface JourneyStop {
  id: number;
  city: string;
  tag: string;
  status: string;
  cx: number;
  cy: number;
  completed: boolean;
  active?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly layout = inject(LayoutService);
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  readonly isDark = this.layout.isDark;

  // Search filter
  readonly searchQuery = signal('');

  // Active Order State
  readonly activeOrderId = signal('#ORD-1138');
  readonly activeOrderProduct = signal('Espresso Machine, Pro Series');
  readonly etaTime = signal('6:40 PM');
  readonly etaRemaining = signal('3 hrs 12 min left');

  readonly orderSteps = signal<OrderStep[]>([
    { id: 1, label: 'Order', sublabel: 'Confirmed', status: 'done' },
    { id: 2, label: 'Cleared', sublabel: 'Customs', status: 'done' },
    { id: 3, label: 'Out for', sublabel: 'Delivery', status: 'active' },
    { id: 4, label: 'Delivered', sublabel: 'Pending', status: 'pending' },
  ]);

  // Package Journey Stops
  readonly journeyStops = signal<JourneyStop[]>([
    { id: 1, city: 'Shenzhen', tag: 'Warehouse · Jul 21', status: 'Dispatched from Factory', cx: 70, cy: 110, completed: true },
    { id: 2, city: 'Los Angeles', tag: 'Customs Cleared · Jul 23', status: 'Import Cleared & Scanned', cx: 360, cy: 110, completed: true },
    { id: 3, city: 'Newark Hub', tag: 'Departed · 8:12 AM', status: 'In Transit to Regional Carrier', cx: 700, cy: 110, completed: true },
    { id: 4, city: 'On the road', tag: '2.4 mi away', status: 'Courier on final delivery route', cx: 820, cy: 110, completed: false, active: true },
    { id: 5, city: 'Your Door', tag: 'ETA 6:40 PM', status: 'Scheduled arrival today', cx: 930, cy: 110, completed: false },
  ]);

  readonly selectedStop = signal<JourneyStop | null>(this.journeyStops()[3]);

  // Delivery Note Modal State
  readonly showNoteModal = signal(false);
  readonly deliveryNoteText = signal('');
  readonly savedNote = signal<string | null>(null);

  // Loyalty & Rewards State
  readonly userTier = signal('GOLD ELITE');
  readonly pointsCurrent = signal(2140);
  readonly pointsTarget = signal(3000);
  readonly pointsToExpire = signal(180);
  readonly daysToExpire = signal(12);

  readonly pointsPct = computed(() =>
    Math.round((this.pointsCurrent() / this.pointsTarget()) * 100)
  );
  readonly pointsToNextTier = computed(() => this.pointsTarget() - this.pointsCurrent());

  readonly categoryBreakdown = signal([
    { label: 'Electronics', pct: 40, color: '#6366F1' },
    { label: 'Home', pct: 25, color: '#EFC275' },
    { label: 'Apparel', pct: 20, color: '#22D3EE' },
  ]);

  // Smart Reorder Items
  readonly reorderItems = signal<ReorderItem[]>([
    {
      id: 'p-101',
      name: 'Espresso Beans, 1kg',
      metaText: '● Runs out in 2 days',
      metaType: 'low',
      gradientColors: ['#6366F1', '#312e81'],
      price: 24.99,
      ctaText: 'Add to Cart',
      ctaType: 'default',
    },
    {
      id: 'p-102',
      name: 'Noise-Cancelling Headphones',
      metaText: '▼ Price dropped 18%',
      metaType: 'deal',
      gradientColors: ['#10B981', '#064e3b'],
      price: 149.0,
      ctaText: 'View Deal',
      ctaType: 'deal',
    },
    {
      id: 'p-103',
      name: 'Vitamin D3 Softgels',
      metaText: '● Runs out in 5 days',
      metaType: 'low',
      gradientColors: ['#EFC275', '#92651f'],
      price: 18.5,
      ctaText: 'Add to Cart',
      ctaType: 'default',
    },
    {
      id: 'p-104',
      name: 'Air Filter, HEPA 3-pack',
      metaText: 'Quarterly refill · due now',
      metaType: 'routine',
      gradientColors: ['#22D3EE', '#0e7490'],
      price: 34.0,
      ctaText: 'Add to Cart',
      ctaType: 'default',
    },
    {
      id: 'p-105',
      name: 'Standing Desk Converter',
      metaText: '▼ Price dropped 12%',
      metaType: 'deal',
      gradientColors: ['#818CF8', '#3730a3'],
      price: 189.0,
      ctaText: 'View Deal',
      ctaType: 'deal',
    },
  ]);

  // Computed filtered list based on search query
  readonly filteredReorderItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.reorderItems();
    return this.reorderItems().filter(item =>
      item.name.toLowerCase().includes(q) || item.metaText.toLowerCase().includes(q)
    );
  });

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInputRef?.nativeElement?.focus();
    }
  }

  toggleTheme(): void {
    this.layout.toggleTheme();
  }

  onReorderClick(item: ReorderItem): void {
    if (item.ctaType === 'deal') {
      this.router.navigate(['/products']);
      this.notifications.info('Product Deal', `Navigating to deals for ${item.name}`);
    } else {
      this.cart.add(item.id, 1, {
        name: item.name,
        price: item.price,
      });
      this.notifications.success('Added to Cart', `${item.name} has been added to your cart.`);
    }
  }

  contactCarrier(): void {
    this.notifications.info(
      'Carrier Dispatch',
      'Connecting to courier driver via live channel (Vehicle #TRK-8092).'
    );
  }

  openNoteModal(): void {
    this.showNoteModal.set(true);
  }

  closeNoteModal(): void {
    this.showNoteModal.set(false);
  }

  saveDeliveryNote(): void {
    const text = this.deliveryNoteText().trim();
    if (!text) {
      this.notifications.warning('Delivery Note', 'Please enter a note before saving.');
      return;
    }
    this.savedNote.set(text);
    this.showNoteModal.set(false);
    this.notifications.success('Delivery Instruction Saved', `Driver notified: "${text}"`);
  }

  redeemPoints(): void {
    if (this.pointsToExpire() === 0) {
      this.notifications.info('Rewards Center', 'No points currently pending expiration.');
      return;
    }

    const redeemed = this.pointsToExpire();
    this.pointsToExpire.set(0);
    this.notifications.success(
      'Voucher Unlocked!',
      `Redeemed ${redeemed} points for a $10 instant discount voucher!`
    );
  }

  selectStop(stop: JourneyStop): void {
    this.selectedStop.set(stop);
  }

  showAlerts(): void {
    this.notifications.info(
      'Active Attention Items',
      '1) Confirm gate access code for courier.\n2) 180 points expiring in 12 days.'
    );
  }
}
