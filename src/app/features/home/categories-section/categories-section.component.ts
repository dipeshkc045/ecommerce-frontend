import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryApi } from '../../../core/api/category.api';
import type { CategoryResponse } from '../../../core/api/category.api';
import { CategoryCardComponent } from '../category-card/category-card.component';

@Component({
  standalone: true,
  selector: 'app-categories-section',
  imports: [RouterLink, CategoryCardComponent],
  templateUrl: './categories-section.component.html',
  styleUrl: './categories-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesSectionComponent implements OnInit {
  private readonly categoryApi = inject(CategoryApi);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly skeletonItems = Array(9).fill(null);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(false);
    this.categoryApi.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
