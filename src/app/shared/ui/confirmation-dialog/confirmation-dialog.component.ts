import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-confirmation-dialog',
  template: `
    @if (visible()) {
      <div class="dialog-overlay" (click)="cancel()" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-icon" [class]="'dialog-icon--' + variant()">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              @if (variant() === 'danger') {
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              } @else {
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              }
            </svg>
          </div>
          <h3 class="dialog-title">{{ title() }}</h3>
          @if (message()) {
            <p class="dialog-message">{{ message() }}</p>
          }
          <div class="dialog-actions">
            <button class="btn-cancel" type="button" (click)="cancel()">{{ cancelLabel() }}</button>
            <button
              class="btn-confirm"
              [class]="'btn-confirm--' + variant()"
              type="button"
              (click)="confirm()"
            >{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  readonly visible = input<boolean>(false);
  readonly title = input<string>('Are you sure?');
  readonly message = input<string>('');
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly variant = input<'danger' | 'warning' | 'info'>('danger');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  confirm(): void { this.confirmed.emit(); }
  cancel(): void  { this.cancelled.emit(); }
}
