import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryCardComponent } from '../category-card/category-card.component';

export interface CategoryItem {
  name: string;
  icon: string;
  color: string;
}

@Component({
  standalone: true,
  selector: 'app-categories-section',
  imports: [RouterLink, CategoryCardComponent],
  templateUrl: './categories-section.component.html',
  styleUrl: './categories-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesSectionComponent {
  readonly categories: CategoryItem[] = [
    { name: 'Electronics', icon: '🔌', color: '#eef2ff' },
    { name: 'Fashion', icon: '👗', color: '#fef3f2' },
    { name: 'Luxury', icon: '💎', color: '#fefce8' },
    { name: 'Home Decor', icon: '🏠', color: '#f0fdf4' },
    { name: 'Health & Beauty', icon: '💄', color: '#fdf2f8' },
    { name: 'Groceries', icon: '🛒', color: '#ecfdf5' },
    { name: 'Sneakers', icon: '👟', color: '#f5f3ff' },
    { name: 'Sports', icon: '⚽', color: '#fff7ed' },
    { name: 'Books', icon: '📚', color: '#fef9c3' },
    { name: 'Gaming', icon: '🎮', color: '#ede9fe' },
  ];
}
