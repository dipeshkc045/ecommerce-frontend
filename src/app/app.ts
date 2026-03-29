import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import { AuthService } from './core/auth/auth.service';
import { CartService } from './core/cart/cart.service';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('routeFade', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate('160ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected readonly cartCount = this.cart.totalItems;

  protected readonly toolbarCartCount = this.cartCount;

  prepareRoute(outlet: RouterOutlet): string {
    if (!outlet.isActivated) return '';
    return outlet.activatedRouteData['animation'] ?? outlet.activatedRoute.snapshot.url.join('/') ?? '';
  }

  logout(): void {
    this.auth.logout();
  }
}
