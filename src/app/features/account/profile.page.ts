import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-profile-page',
  template: `
    <div class="profile-stub">
      <h2>My Profile</h2>
      <p>Manage your personal information, password, and account settings.</p>
      <div class="profile-card">
        <div class="avatar">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <div class="name">Account Profile</div>
          <div class="email">User ID: {{ auth.userId() }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .profile-stub { padding: 24px; }
    .profile-stub h2 { font-size: var(--text-2xl); font-weight: 700; margin-bottom: 8px; }
    .profile-stub p { color: var(--text-secondary); margin-bottom: 24px; }
    .profile-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      max-width: 400px;
    }
    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--bg-surface-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }
    .name { font-weight: 600; font-size: var(--text-lg); }
    .email { color: var(--text-muted); font-size: var(--text-sm); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
}
