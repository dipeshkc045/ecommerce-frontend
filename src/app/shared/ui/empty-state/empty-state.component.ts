import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <ng-content select="[slot=icon]" />
      </div>
      @if (title()) {
        <h3 class="empty-title">{{ title() }}</h3>
      }
      @if (description()) {
        <p class="empty-description">{{ description() }}</p>
      }
      <div class="empty-actions">
        <ng-content select="[slot=actions]" />
      </div>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input<string>('');
  readonly description = input<string>('');
}
