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
        <a routerLink="/" class="auth-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to store
        </a>
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
  private readonly layout = inject(LayoutService);
  readonly year = new Date().getFullYear();

  ngOnInit(): void {
    this.layout.setLayoutMode('auth');
  }
}
