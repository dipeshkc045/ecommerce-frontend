import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-error-state',
  template: `
    <div class="error-state">
      <div class="error-icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3 class="error-title">{{ title() }}</h3>
      @if (description()) {
        <p class="error-description">{{ description() }}</p>
      }
      @if (retryable()) {
        <button class="retry-btn" type="button" (click)="retry.emit()">Try Again</button>
      }
    </div>
  `,
  styleUrl: './error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly title = input<string>('Something went wrong');
  readonly description = input<string>('');
  readonly retryable = input<boolean>(true);
  readonly retry = output<void>();
}
