import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
} from '@angular/core';
import { LayoutService, PageWidth } from '../layout.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  standalone: true,
  selector: 'app-page-container',
  imports: [BreadcrumbComponent],
  template: `
    <div class="page-container" [class]="'page-container--' + width()">
      @if (showBreadcrumb()) {
        <app-breadcrumb />
      }

      @if (title()) {
        <header class="page-header">
          <div class="page-title-group">
            <h1 class="page-title">{{ title() }}</h1>
            @if (subtitle()) {
              <p class="page-subtitle">{{ subtitle() }}</p>
            }
          </div>
          <div class="page-actions">
            <ng-content select="[slot=actions]" />
          </div>
        </header>
      }

      @if (layout.loading()) {
        <div class="page-loading-overlay" aria-live="polite">
          <div class="page-skeleton">
            <div class="skeleton-line" style="width: 60%; height: 28px; margin-bottom: 16px;"></div>
            <div class="skeleton-line" style="width: 40%; height: 18px; margin-bottom: 32px;"></div>
            <div class="skeleton-line" style="width: 100%; height: 200px;"></div>
          </div>
        </div>
      } @else {
        <div class="page-content">
          <ng-content />
        </div>
      }
    </div>
  `,
  styleUrl: './page-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContainerComponent implements OnInit {
  readonly layout = inject(LayoutService);

  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly width = input<PageWidth>('default');
  readonly showBreadcrumb = input<boolean>(true);

  ngOnInit(): void {
    if (this.title()) {
      this.layout.setPageMeta(this.title(), this.subtitle());
    }
  }
}
