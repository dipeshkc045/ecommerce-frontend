import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutService } from '../layout.service';

@Component({
  standalone: true,
  selector: 'app-global-loader',
  template: `
    @if (layout.loading()) {
      <div class="global-loader" role="progressbar" aria-label="Loading page">
        <div class="loader-bar"></div>
      </div>
    }
  `,
  styleUrl: './global-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalLoaderComponent {
  readonly layout = inject(LayoutService);
}
