import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

@Component({
  standalone: true,
  selector: 'app-badge',
  template: `<ng-content />`,
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('primary');
  readonly size = input<BadgeSize>('md');
  readonly dot = input<boolean>(false);

  @HostBinding('class') get hostClass(): string {
    return [
      'app-badge',
      `app-badge--${this.variant()}`,
      `app-badge--${this.size()}`,
      this.dot() ? 'app-badge--dot' : '',
    ].filter(Boolean).join(' ');
  }
}
