import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { GlobalLoaderComponent } from '../global-loader/global-loader.component';
import { NotificationComponent } from '../notification/notification.component';
import { LayoutService } from '../layout.service';

@Component({
  standalone: true,
  selector: 'app-public-layout',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    GlobalLoaderComponent,
    NotificationComponent,
  ],
  template: `
    <app-global-loader />
    <app-notification />

    <div class="public-shell">
      <app-header />
      <main class="public-main" id="main-content" tabindex="-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
  styleUrl: './public-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent implements OnInit {
  private readonly layout = inject(LayoutService);

  ngOnInit(): void {
    this.layout.setLayoutMode('public');
  }
}
