import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../layout.service';
import { MenuItem } from '../../models/menu-item.model';

import { LucideLogOut } from '@lucide/angular';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideLogOut],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly layout = inject(LayoutService);

  readonly items = input<MenuItem[]>([]);
  readonly title = input<string>('');

  readonly collapsed = this.layout.sidebarCollapsed;
  readonly mobileOpen = this.layout.sidebarOpen;

  closeMobile(): void {
    this.layout.closeMobileSidebar();
  }
}
