import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from './core/layout/layout.service';

/**
 * AppComponent is the bare root component.
 * It renders only <router-outlet> — all layout chrome (header, sidebar, footer)
 * lives inside the layout shell components (PublicLayout, CustomerLayout, etc.).
 * This follows the Shell Layout Pattern for zero layout duplication.
 */
@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly layout = inject(LayoutService);

  ngOnInit(): void {
    this.layout.initTheme();
  }
}
