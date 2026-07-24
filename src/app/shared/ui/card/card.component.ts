import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

@Component({
  standalone: true,
  selector: 'app-card',
  template: `
    @if (title()) {
      <div class="card-header">
        <h3 class="card-title">{{ title() }}</h3>
        @if (subtitle()) {
          <p class="card-subtitle">{{ subtitle() }}</p>
        }
      </div>
    }
    <div class="card-body">
      <ng-content />
    </div>
  `,
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly variant = input<CardVariant>('default');
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly padding = input<boolean>(true);
  readonly hoverable = input<boolean>(false);

  @HostBinding('class') get hostClass(): string {
    return [
      'app-card',
      `app-card--${this.variant()}`,
      !this.padding() ? 'app-card--no-padding' : '',
      this.hoverable() ? 'app-card--hoverable' : '',
    ].filter(Boolean).join(' ');
  }
}
