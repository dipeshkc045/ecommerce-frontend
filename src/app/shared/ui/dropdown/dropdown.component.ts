import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-dropdown',
  template: `
    <div class="dropdown">
      <button
        class="dropdown-trigger"
        type="button"
        [attr.aria-expanded]="isOpen()"
        (click)="toggle()"
      >
        <ng-content select="[slot=trigger]" />
        <svg class="dropdown-chevron" [class.open]="isOpen()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      @if (isOpen()) {
        <div class="dropdown-menu" role="menu">
          @for (item of items(); track item.value) {
            @if (item.divider) {
              <hr class="dropdown-divider" />
            } @else {
              <button
                class="dropdown-item"
                type="button"
                role="menuitem"
                [disabled]="item.disabled"
                (click)="select(item)"
              >
                {{ item.label }}
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styleUrl: './dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent {
  private readonly el = inject(ElementRef);

  readonly items = input<DropdownItem[]>([]);
  readonly isOpen = signal(false);

  toggle(): void { this.isOpen.update(v => !v); }
  close(): void  { this.isOpen.set(false); }

  select(item: DropdownItem): void {
    if (!item.disabled) this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void { this.close(); }
}
