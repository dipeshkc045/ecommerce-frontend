import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PromoBanner {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
  icon: string;
}

@Component({
  standalone: true,
  selector: 'app-advertisement-section',
  imports: [RouterLink],
  templateUrl: './advertisement-section.component.html',
  styleUrl: './advertisement-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisementSectionComponent {
  readonly banners: PromoBanner[] = [
    {
      id: 1,
      title: 'Summer Sale',
      subtitle: 'Up to 50% off on electronics & gadgets',
      cta: 'Shop Now',
      href: '/products',
      gradient: 'linear-gradient(135deg, #0d1b3e 0%, #1a2d5a 100%)',
      icon: '⚡',
    },
    {
      id: 2,
      title: 'New Arrivals',
      subtitle: 'Discover the latest fashion trends',
      cta: 'Explore',
      href: '/products',
      gradient: 'linear-gradient(135deg, #009688 0%, #00796b 100%)',
      icon: '✨',
    },
    {
      id: 3,
      title: 'Free Shipping',
      subtitle: 'On orders above $99 — limited time',
      cta: 'Learn More',
      href: '/products',
      gradient: 'linear-gradient(135deg, #ff6f61 0%, #e85d50 100%)',
      icon: '🚚',
    },
  ];
}
