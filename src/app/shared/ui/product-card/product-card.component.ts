import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import type { ProductCardModel, ProductCardVariant } from './product-card.model';

@Component({
  standalone: true,
  selector: 'app-product-card',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly Math = Math;
  readonly product = input.required<ProductCardModel>();
  readonly variant = input<ProductCardVariant>('grid');
  readonly showRating = input(true);
  readonly showWishlist = input(false);
  readonly showQuickView = input(false);
  readonly showCompare = input(false);
  readonly showFeatures = input(false);
  readonly showBadge = input(true);
  readonly showCategory = input(false);
  readonly showPrice = input(true);
  readonly showOldPrice = input(true);
  readonly showDiscount = input(true);
  readonly showStock = input(false);
  readonly showDescription = input(false);
  readonly showSku = input(false);
  readonly adding = input(false);
  readonly wished = input(false);
  readonly animated = input(false);

  readonly productClick = output<ProductCardModel>();
  readonly addToCart = output<ProductCardModel>();
  readonly wishlistToggle = output<ProductCardModel>();
  readonly quickView = output<ProductCardModel>();
  readonly compare = output<ProductCardModel>();

  readonly detailLink = computed(() => ['/products', String(this.product().id)]);

  readonly badgeVariant = computed(() => {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      bestseller: 'primary',
      new: 'success',
      sale: 'warning',
      hot: 'danger',
    };
    return map[this.product().badge ?? ''] ?? 'primary';
  });

  readonly badgeLabel = computed(() => {
    const map: Record<string, string> = {
      bestseller: 'Bestseller',
      new: 'New',
      sale: 'Sale',
      hot: 'Hot',
    };
    return map[this.product().badge ?? ''] ?? '';
  });

  readonly hasDiscount = computed(() => this.product().oldPrice != null && this.product().oldPrice! > 0);

  readonly hasFeatures = computed(() => this.product().features.length > 0);

  readonly isShowcase = computed(() => this.variant() === 'showcase');

  readonly accentColors: Record<string, [string, string]> = {
    blue: ['#6C8CFF', '#1B2450'],
    pink: ['#F5384F', '#4A1420'],
    orange: ['#FF7A59', '#4A1C14'],
    teal: ['#3DD9A4', '#0E3A2C'],
    purple: ['#8C6CFF', '#2A1B50'],
  };

  readonly mediaGradient = computed(() => {
    const accent = this.product().accent;
    const colors = accent && this.accentColors[accent] ? this.accentColors[accent] : ['#4A63E8', '#1E2030'];
    return `background: radial-gradient(120% 120% at 30% 20%, ${colors[0]}22, transparent 60%), linear-gradient(160deg, ${colors[1]}, var(--color-bg-elevated));`;
  });

  formatCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
    return String(n);
  }

  onProductClick(): void {
    this.productClick.emit(this.product());
  }

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.product());
  }

  onWishlistToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlistToggle.emit(this.product());
  }

  onQuickView(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.quickView.emit(this.product());
  }

  onCompare(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.compare.emit(this.product());
  }
}