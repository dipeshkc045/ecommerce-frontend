import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  standalone: true,
  selector: 'app-loader',
  template: `
    <div class="loader" [class]="'loader--' + size()" role="status" [attr.aria-label]="label()">
      <div class="loader-ring"></div>
    </div>
    @if (showLabel()) {
      <span class="loader-text">{{ label() }}</span>
    }
  `,
  styleUrl: './loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent {
  readonly size = input<LoaderSize>('md');
  readonly label = input<string>('Loading...');
  readonly showLabel = input<boolean>(false);
  readonly fullScreen = input<boolean>(false);
}
