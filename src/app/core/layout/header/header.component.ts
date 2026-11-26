import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideLogOut, LucideMoon, LucideShoppingCart, LucideSun } from '@lucide/angular';

import { AuthService } from '../../auth/auth.service';
import { CartService } from '../../cart/cart.service';
import { I18nService } from '../../i18n/i18n.service';
import { NumPipe, TPipe } from '../../i18n/pipes';
import { LayoutService } from '../layout.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LucideSun, LucideMoon, LucideShoppingCart, LucideLogOut, TPipe, NumPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly layout = inject(LayoutService);
  readonly i18n = inject(I18nService);

  readonly cartCount = inject(CartService).totalItems;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly themeLabel = this.layout.themeLabel;
  readonly isDark = this.layout.isDark;

  toggleTheme(): void {
    this.layout.toggleTheme();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/products');
  }
}
