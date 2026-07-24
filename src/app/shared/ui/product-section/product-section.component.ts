import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProductCardComponent } from '../product-card/product-card.component';
import type { ProductCardModel, ProductCardVariant } from '../product-card/product-card.model';

export type SectionLayout = 'grid' | 'carousel';

@Component({
  standalone: true,
  selector: 'app-product-section',
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './product-section.component.html',
  styleUrl: './product-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSectionComponent {
  readonly title = input('');
  readonly subtitle = input('');
  readonly products = input.required<ProductCardModel[]>();
  readonly layout = input<SectionLayout>('grid');
  readonly variant = input<ProductCardVariant>('grid');
  readonly columns = input(4);
  readonly cardMinWidth = input('220px');
  readonly buttonLabel = input('');
  readonly buttonLink = input('');
  readonly background = input('');
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
  readonly animated = input(false);

  readonly productClick = output<ProductCardModel>();
  readonly addToCart = output<ProductCardModel>();
  readonly wishlistToggle = output<ProductCardModel>();
  readonly quickView = output<ProductCardModel>();
  readonly compare = output<ProductCardModel>();

  readonly gridColumnsStyle = computed(() => {
    const cols = this.columns();
    return `repeat(${cols}, 1fr)`;
  });

  onProductClick(product: ProductCardModel): void {
    this.productClick.emit(product);
  }

  onAddToCart(product: ProductCardModel): void {
    this.addToCart.emit(product);
  }

  onWishlistToggle(product: ProductCardModel): void {
    this.wishlistToggle.emit(product);
  }

  onQuickView(product: ProductCardModel): void {
    this.quickView.emit(product);
  }

  onCompare(product: ProductCardModel): void {
    this.compare.emit(product);
  }
}