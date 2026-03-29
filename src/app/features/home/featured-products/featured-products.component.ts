import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface FeaturedProduct {
  id: number;
  name: string;
  href: string;
  price: string;
  imageSrc: string;
  imageAlt: string;
}

@Component({
  standalone: true,
  selector: 'app-featured-products',
  imports: [RouterLink],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductsComponent {
  readonly products: FeaturedProduct[] = [
    {
      id: 1,
      name: 'Earthen Bottle',
      href: '/products',
      price: '$48',
      imageSrc:
        'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-04-image-card-01.jpg',
      imageAlt:
        'Tall slender porcelain bottle with natural clay textured body and cork stopper.',
    },
    {
      id: 2,
      name: 'Nomad Tumbler',
      href: '/products',
      price: '$35',
      imageSrc:
        'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-04-image-card-02.jpg',
      imageAlt:
        'Olive drab green insulated bottle with flared screw lid and flat top.',
    },
    {
      id: 3,
      name: 'Focus Paper Refill',
      href: '/products',
      price: '$89',
      imageSrc:
        'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-04-image-card-03.jpg',
      imageAlt:
        'Person using a pen to cross a task off a productivity paper card.',
    },
    {
      id: 4,
      name: 'Machined Mechanical Pencil',
      href: '/products',
      price: '$35',
      imageSrc:
        'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-04-image-card-04.jpg',
      imageAlt:
        'Hand holding black machined steel mechanical pencil with brass tip and top.',
    },
    {
      id: 5,
      name: 'Focus Card Tray',
      href: '/products',
      price: '$64',
      imageSrc:
        'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-04-image-card-05.jpg',
      imageAlt: 'Paper card sitting upright in walnut card holder on desk.',
    },
    {
      id: 6,
      name: 'Focus Multi-Pack',
      href: '/products',
      price: '$39',
      imageSrc:
        'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-04-image-card-06.jpg',
      imageAlt:
        'Stack of 3 small drab green cardboard paper card refill boxes with white text.',
    },
    {
      id: 7,
      name: 'Brass Scissors',
      href: '/products',
      price: '$50',
      imageSrc:
        'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-04-image-card-07.jpg',
      imageAlt:
        'Brass scissors with geometric design, black steel finger holes, and included upright brass stand.',
    },
    {
      id: 8,
      name: 'Focus Carry Pouch',
      href: '/products',
      price: '$32',
      imageSrc:
        'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-04-image-card-08.jpg',
      imageAlt:
        'Textured gray felt pouch for paper cards with snap button flap and elastic pen holder loop.',
    },
  ];
}
