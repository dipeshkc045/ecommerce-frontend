import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-wishlist-page',
  imports: [RouterLink],
  template: `
    <div class="wishlist-empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <h2>Your Wishlist is Empty</h2>
      <p>Save items you love to your wishlist and revisit them anytime.</p>
      <a routerLink="/products" class="btn-primary">Explore Products</a>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .wishlist-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 80px 24px;
      text-align: center;
      color: var(--text-muted);
    }
    .wishlist-empty h2 { color: var(--text-primary); font-size: var(--text-2xl); }
    .wishlist-empty p { font-size: var(--text-md); max-width: 320px; }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      padding: 12px 24px;
      background: var(--color-accent);
      color: #fff;
      border-radius: var(--border-radius-pill);
      font-weight: 600;
      font-size: var(--text-sm);
      transition: background var(--transition-fast);
      &:hover { background: var(--color-accent-hover); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPage {}
