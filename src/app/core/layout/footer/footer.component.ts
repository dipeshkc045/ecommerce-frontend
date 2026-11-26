import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatNumber } from '../../i18n/format';
import { I18nService } from '../../i18n/i18n.service';
import { TPipe } from '../../i18n/pipes';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [RouterLink, TPipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly i18n = inject(I18nService);
  private readonly thisYear = new Date().getFullYear();
  readonly year = computed(() => formatNumber(this.thisYear, this.i18n.lang(), false));

  readonly links = [
    {
      title: 'Shop',
      items: [
        { label: 'All Products',   route: '/products' },
        { label: 'Electronics',    route: '/products' },
        { label: 'Fashion',        route: '/products' },
        { label: 'Home & Living',  route: '/products' },
        { label: 'New Arrivals',   route: '/products' },
      ],
    },
    {
      title: 'Customer Service',
      items: [
        { label: 'Contact Us',         route: '/contact' },
        { label: 'FAQs',               route: '/faq' },
        { label: 'Shipping Policy',    route: '/shipping' },
        { label: 'Returns & Refunds',  route: '/returns' },
        { label: 'Order Tracking',     route: '/orders' },
      ],
    },
    {
      title: 'Company',
      items: [
        { label: 'About Us',           route: '/about' },
        { label: 'Careers',            route: '/careers' },
        { label: 'Blog',               route: '/blog' },
        { label: 'Affiliate Program',  route: '/affiliate' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { label: 'Privacy Policy',   route: '/privacy' },
        { label: 'Terms of Service', route: '/terms' },
        { label: 'Cookie Policy',    route: '/cookies' },
        { label: 'Accessibility',    route: '/accessibility' },
      ],
    },
  ];
}
