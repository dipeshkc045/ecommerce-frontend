import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-pagination',
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" aria-label="Pagination">
        <button
          class="page-btn page-btn--nav"
          [disabled]="currentPage() <= 1"
          (click)="goTo(currentPage() - 1)"
          aria-label="Previous page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        @for (page of visiblePages(); track page) {
          @if (page === -1) {
            <span class="page-ellipsis">…</span>
          } @else {
            <button
              class="page-btn"
              [class.page-btn--active]="page === currentPage()"
              (click)="goTo(page)"
              [attr.aria-current]="page === currentPage() ? 'page' : null"
            >{{ page }}</button>
          }
        }

        <button
          class="page-btn page-btn--nav"
          [disabled]="currentPage() >= totalPages()"
          (click)="goTo(currentPage() + 1)"
          aria-label="Next page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </nav>
    }
  `,
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();

  readonly pageChange = output<number>();

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    pages.push(1);
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);

    return pages;
  });

  goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
