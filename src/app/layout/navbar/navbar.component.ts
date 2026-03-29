import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface NavCategory {
  label: string;
  route: string;
  live?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-category-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  readonly categories: NavCategory[] = [
    { label: 'All Categories', route: '/products' },
    { label: 'Electronics', route: '/products', },
    { label: 'Fashion', route: '/products' },
    { label: "Women's", route: '/products' },
    { label: "Kids' Fashion", route: '/products' },
    { label: 'Health & Beauty', route: '/products' },
    { label: 'Pharmacy', route: '/products' },
    { label: 'Groceries', route: '/products' },
    { label: 'Luxury Item', route: '/products' },
  ];

  readonly bestDeals = { label: 'Best Deals', route: '/products' };
}
