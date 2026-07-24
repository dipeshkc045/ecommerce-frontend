import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  input,
  output,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  standalone: true,
  selector: 'app-button, button[app-button]',
  template: `
    @if (loading()) {
      <span class="btn-spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  @HostBinding('class') get hostClass(): string {
    return [
      'app-btn',
      `app-btn--${this.variant()}`,
      `app-btn--${this.size()}`,
      this.loading() ? 'app-btn--loading' : '',
      this.fullWidth() ? 'app-btn--full' : '',
      this.disabled() ? 'app-btn--disabled' : '',
    ].filter(Boolean).join(' ');
  }

  @HostBinding('attr.disabled') get isDisabled(): boolean | null {
    return this.disabled() || this.loading() ? true : null;
  }
}
