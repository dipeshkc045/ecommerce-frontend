import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutService } from '../layout.service';

@Component({
  standalone: true,
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  template: `
    @if (layout.breadcrumbs().length > 1) {
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol class="breadcrumb-list" itemscope itemtype="https://schema.org/BreadcrumbList">
          @for (crumb of layout.breadcrumbs(); track crumb.url; let last = $last, idx = $index) {
            <li
              class="breadcrumb-item"
              [class.breadcrumb-item--active]="last"
              itemprop="itemListElement"
              itemscope
              itemtype="https://schema.org/ListItem"
            >
              @if (!last) {
                <a
                  [routerLink]="crumb.url"
                  class="breadcrumb-link"
                  itemprop="item"
                >
                  <span itemprop="name">{{ crumb.label }}</span>
                </a>
                <span class="breadcrumb-sep" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </span>
              } @else {
                <span class="breadcrumb-current" aria-current="page" itemprop="name">{{ crumb.label }}</span>
              }
              <meta itemprop="position" [content]="idx + 1" />
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  readonly layout = inject(LayoutService);
}
