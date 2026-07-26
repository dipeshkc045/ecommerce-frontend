import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { ProductSectionComponent } from '../../../shared/ui/product-section/product-section.component';
import { CartFacade } from '../../../core/facades/cart.facade';
import type { ProductCardModel } from '../../../shared/ui/product-card/product-card.model';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [ProductSectionComponent],
  templateUrl: './featured-products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductsComponent {
  private readonly cart = inject(CartFacade);

  readonly title = input('Explore Popular Categories');
  readonly subtitle = input('');
  readonly buttonLabel = input('View All');
  readonly buttonLink = input('/products');
  readonly products = input<ProductCardModel[]>([]);
  readonly variant = input<'grid' | 'compact' | 'horizontal' | 'showcase' | 'minimal'>('showcase');
  readonly columns = input(5);
  readonly cardMinWidth = input('220px');
  readonly layout = input<'grid' | 'carousel'>('grid');
  readonly animated = input(false);
  readonly showRating = input(true);
  readonly showFeatures = input(true);
  readonly showDescription = input(true);
  readonly showBadge = input(false);
  readonly showOldPrice = input(false);
  readonly showDiscount = input(false);
  readonly showWishlist = input(false);
  readonly showQuickView = input(false);
  readonly showCompare = input(false);
  readonly showCategory = input(false);
  readonly showPrice = input(true);
  readonly showStock = input(false);

  readonly addToCart = output<ProductCardModel>();

  onAddToCart(product: ProductCardModel): void {
    this.cart.addProduct(product.id, 1, {
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.categoryName ?? undefined,
      sku: product.sku,
    });
  }
}
