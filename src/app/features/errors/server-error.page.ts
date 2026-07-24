import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-server-error-page',
  imports: [RouterLink],
  template: `
    <div class="error-page">
      <div class="error-code">500</div>
      <h1 class="error-title">Server Error</h1>
      <p class="error-message">Something went wrong on our end. We're working to fix it. Please try again in a few minutes.</p>
      <div class="error-actions">
        <a routerLink="/" class="btn-primary">Go Home</a>
        <button class="btn-ghost" onclick="location.reload()">Retry</button>
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
      background: linear-gradient(135deg, var(--color-danger), var(--color-primary));
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
      transition: background var(--transition-fast);
      &:hover { background: var(--color-accent-hover); }
    }
    .btn-ghost {
      padding: 12px 28px;
      border: 1.5px solid var(--border-color);
      color: var(--text-primary);
      border-radius: var(--border-radius-pill);
      font-weight: 600;
      background: transparent;
      cursor: pointer;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerErrorPage {}
