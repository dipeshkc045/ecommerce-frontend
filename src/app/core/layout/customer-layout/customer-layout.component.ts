import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { GlobalLoaderComponent } from '../global-loader/global-loader.component';
import { NotificationComponent } from '../notification/notification.component';
import { LayoutService } from '../layout.service';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  standalone: true,
  selector: 'app-customer-layout',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    GlobalLoaderComponent,
    NotificationComponent,
  ],
  template: `
    <app-global-loader />
    <app-notification />

    <div class="customer-shell">
      <app-header />
      <div class="customer-body">
        <app-sidebar [items]="menuItems" title="My Account" />
        <main
          class="customer-main"
          [class.customer-main--expanded]="layout.sidebarCollapsed()"
          id="main-content"
          tabindex="-1"
        >
          <router-outlet />
        </main>
      </div>
      <app-footer />
    </div>
  `,
  styleUrl: './customer-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLayoutComponent implements OnInit {
  readonly layout = inject(LayoutService);

  readonly menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      route: '/account',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    },
    {
      id: 'orders',
      label: 'My Orders',
      route: '/orders',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      route: '/wishlist',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    },
    {
      id: 'cart',
      label: 'Cart',
      route: '/cart',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
    },
    {
      id: 'checkout',
      label: 'Checkout',
      route: '/checkout',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    },
    {
      id: 'profile',
      label: 'Profile',
      route: '/account/profile',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    },
  ];

  ngOnInit(): void {
    this.layout.setLayoutMode('customer');
  }
}
