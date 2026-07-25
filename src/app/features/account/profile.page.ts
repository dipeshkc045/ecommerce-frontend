import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import {ProfileComponent} from '../profile/profile.component';

@Component({
  standalone: true,
  selector: 'app-profile-page',
  template: `
    <app-profile></app-profile>
  `,
  styles: [`
    :host {
      display: block;
    }

    .profile-stub {
      padding: 24px;
    }

    .profile-stub h2 {
      font-size: var(--text-2xl);
      font-weight: 700;
      margin-bottom: 8px;
    }

    .profile-stub p {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    .profile-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
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

    .name {
      font-weight: 600;
      font-size: var(--text-lg);
    }

    .email {
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ProfileComponent
  ]
})
export class ProfilePage {
  readonly auth = inject(AuthService);
}
