import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-search-input',
  template: `
    <div class="search-wrapper" [class.search-wrapper--focused]="focused()">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        #inputRef
        type="text"
        class="search-field"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
        (keyup.enter)="submitted.emit(inputRef.value)"
        [attr.aria-label]="placeholder()"
      />
      @if (inputRef.value) {
        <button class="search-clear" type="button" aria-label="Clear search" (click)="clear(inputRef)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      }
    </div>
  `,
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  readonly placeholder = input<string>('Search...');
  readonly value = input<string>('');

  readonly changed = output<string>();
  readonly submitted = output<string>();

  readonly focused = signal(false);

  onInput(event: Event): void {
    this.changed.emit((event.target as HTMLInputElement).value);
  }

  clear(input: HTMLInputElement): void {
    input.value = '';
    this.changed.emit('');
    input.focus();
  }
}
