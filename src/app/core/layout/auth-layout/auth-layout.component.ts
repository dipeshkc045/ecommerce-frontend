import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { LayoutService } from '../layout.service';
import { NotificationComponent } from '../notification/notification.component';

@Component({
  standalone: true,
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, NotificationComponent],
  template: `
    <app-notification />

    <div class="auth-shell">
      <!-- Auth Header -->
      <header class="auth-header">
        <a routerLink="/" class="auth-logo" aria-label="Emox home">
          <span class="auth-logo-mark">e</span>
          <span class="auth-logo-text">emox</span>
        </a>
        <div class="auth-header-right">
          <button
            class="auth-theme-btn"
            type="button"
            (click)="layout.toggleTheme()"
            [attr.aria-label]="'Switch to ' + (layout.isDark() ? 'light' : 'dark') + ' mode'"
          >
            @if (layout.isDark()) {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            }
          </button>
          <a routerLink="/" class="auth-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to store
          </a>
        </div>
      </header>

      <!-- Auth Body -->
      <main class="auth-main" id="main-content">
        <div class="auth-card">
          <router-outlet />
        </div>
      </main>

      <!-- Auth Footer -->
      <footer class="auth-footer">
        <p>&copy; {{ year }} Emox. All rights reserved.</p>
      </footer>
    </div>
  `,
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent implements OnInit {
  readonly layout = inject(LayoutService);
  readonly year = new Date().getFullYear();

  ngOnInit(): void {
    this.layout.setLayoutMode('auth');
  }
}
