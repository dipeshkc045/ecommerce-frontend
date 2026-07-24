import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard-page',
  template: `
    <div class="admin-dash">
      <h2>Admin Dashboard</h2>
      <p>Welcome to the admin panel. Monitor and manage your store from here.</p>
      <div class="stats-grid">
        @for (stat of stats; track stat.label) {
          <div class="stat-card">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .admin-dash { padding: 24px; }
    .admin-dash h2 { font-size: var(--text-2xl); font-weight: 700; margin-bottom: 8px; }
    .admin-dash p { color: var(--text-secondary); margin-bottom: 32px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    .stat-card {
      padding: 24px 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      text-align: center;
      box-shadow: var(--shadow-sm);
    }
    .stat-value { font-size: var(--text-3xl); font-weight: 700; color: var(--color-accent); }
    .stat-label { font-size: var(--text-sm); color: var(--text-muted); margin-top: 4px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage {
  readonly stats = [
    { label: 'Total Orders',    value: '1,248' },
    { label: 'Total Customers', value: '4,832' },
    { label: 'Total Products',  value: '386' },
    { label: 'Revenue (USD)',   value: '$84,291' },
  ];
}
