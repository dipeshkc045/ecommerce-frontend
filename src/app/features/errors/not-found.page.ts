import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="error-page">
      <div class="error-code">404</div>
      <h1 class="error-title">Page Not Found</h1>
      <p class="error-message">The page you're looking for doesn't exist or has been moved.</p>
      <div class="error-actions">
        <a routerLink="/" class="btn-primary">Go Home</a>
        <button class="btn-ghost" onclick="history.back()">Go Back</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .error-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
      background: var(--bg-page);
    }
    .error-code {
      font-size: 8rem;
      font-weight: 900;
      line-height: 1;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .error-title { font-size: var(--text-3xl); font-weight: 700; margin: 16px 0 12px; }
    .error-message { color: var(--text-secondary); font-size: var(--text-lg); max-width: 400px; margin-bottom: 32px; }
    .error-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .btn-primary {
      padding: 12px 28px;
      background: var(--color-accent);
      color: #fff;
      border-radius: var(--border-radius-pill);
      font-weight: 600;
      font-size: var(--text-sm);
      transition: background var(--transition-fast);
      &:hover { background: var(--color-accent-hover); }
    }
    .btn-ghost {
      padding: 12px 28px;
      border: 1.5px solid var(--border-color);
      color: var(--text-primary);
      border-radius: var(--border-radius-pill);
      font-weight: 600;
      font-size: var(--text-sm);
      background: transparent;
      cursor: pointer;
      transition: border-color var(--transition-fast);
      &:hover { border-color: var(--color-accent); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
