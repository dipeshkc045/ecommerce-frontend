import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly linkGroups: FooterLinkGroup[] = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', href: '/products' },
        { label: 'Electronics', href: '/products' },
        { label: 'Fashion', href: '/products' },
        { label: 'Home & Living', href: '/products' },
        { label: 'New Arrivals', href: '/products' },
      ],
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Contact Us', href: '/products' },
        { label: 'FAQs', href: '/products' },
        { label: 'Shipping & Delivery', href: '/products' },
        { label: 'Returns & Refunds', href: '/products' },
        { label: 'Order Tracking', href: '/orders' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/products' },
        { label: 'Careers', href: '/products' },
        { label: 'Press', href: '/products' },
        { label: 'Blog', href: '/products' },
        { label: 'Affiliate Program', href: '/products' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/products' },
        { label: 'Terms of Service', href: '/products' },
        { label: 'Cookie Policy', href: '/products' },
        { label: 'Accessibility', href: '/products' },
      ],
    },
  ];

  readonly socialLinks: { label: string; icon: string }[] = [
    { label: 'Facebook', icon: 'facebook' },
    { label: 'Instagram', icon: 'instagram' },
    { label: 'Twitter', icon: 'twitter' },
    { label: 'YouTube', icon: 'youtube' },
  ];
}
