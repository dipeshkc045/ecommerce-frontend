import { ChangeDetectionStrategy, Component, HostBinding, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-chip',
  template: `
    <span class="chip-label"><ng-content /></span>
    @if (dismissible()) {
      <button
        class="chip-dismiss"
        type="button"
        aria-label="Remove"
        (click)="dismissed.emit()"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    }
  `,
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  readonly color = input<'default' | 'accent' | 'success' | 'warning' | 'danger'>('default');
  readonly dismissible = input<boolean>(false);
  readonly selected = input<boolean>(false);

  readonly dismissed = output<void>();

  @HostBinding('class') get hostClass(): string {
    return [
      'app-chip',
      `app-chip--${this.color()}`,
      this.selected() ? 'app-chip--selected' : '',
    ].filter(Boolean).join(' ');
  }
}
