import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CartService } from '../../cart/cart.service';
import { LayoutService } from '../layout.service';

import { LucideMenu, LucideSearch, LucideSun, LucideMoon, LucideHeart, LucideShoppingCart, LucideUser, LucideChevronDown, LucideFileText, LucideLogOut } from '@lucide/angular';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink, LucideMenu, LucideSearch, LucideSun, LucideMoon, LucideHeart, LucideShoppingCart, LucideUser, LucideChevronDown, LucideFileText, LucideLogOut],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly layout = inject(LayoutService);

  readonly cartCount = this.cart.totalItems;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly themeLabel = this.layout.themeLabel;
  readonly isDark = this.layout.isDark;

  readonly searchQuery = signal('');
  readonly searchOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly mobileMenuOpen = signal(false);

  readonly megaMenuActive = signal<string | null>(null);

  readonly navCategories = [
    { label: 'Electronics',    route: '/products' },
    { label: 'Fashion',        route: '/products' },
    { label: 'Home & Living',  route: '/products' },
    { label: 'Health & Beauty',route: '/products' },
    { label: 'Groceries',      route: '/products' },
  ];

  toggleTheme(): void {
    this.layout.toggleTheme();
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
    this.userMenuOpen.set(false);
  }

  activateMegaMenu(label: string): void {
    this.megaMenuActive.set(label);
  }

  closeMegaMenu(): void {
    this.megaMenuActive.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.userMenuOpen.set(false);
    this.megaMenuActive.set(null);
    this.searchOpen.set(false);
  }
}
