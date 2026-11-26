import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { ProductImage } from '../../core/shop/shop.types';

/**
 * A product image as a `<picture>` (ecommerce-platform #34): the browser takes the first format it supports (AVIF, then
 * WebP, then JPEG) and, from `sizes`, the smallest width that is sharp on the screen. Width and height reserve the space,
 * so the page does not jump when the image arrives.
 */
@Component({
  standalone: true,
  selector: 'app-product-picture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (image(); as img) {
      <picture class="picture">
        @for (s of img.sources; track s.type) {
          <source [attr.type]="s.type" [attr.srcset]="s.srcset" [attr.sizes]="sizes()" />
        }
        <img [src]="img.src" [alt]="img.alt" [width]="img.width" [height]="img.height" [attr.sizes]="sizes()"
          [attr.loading]="eager() ? 'eager' : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null" decoding="async" />
      </picture>
    } @else {
      <div class="picture picture--empty" aria-hidden="true"></div>
    }
  `,
})
export class ProductPicture {
  readonly image = input<ProductImage | null | undefined>(null);
  /** The `sizes` attribute: how wide the image is shown, so the browser can pick a width. */
  readonly sizes = input('100vw');
  /** The image the visitor sees first: load it at once instead of lazily. */
  readonly eager = input(false);
}
