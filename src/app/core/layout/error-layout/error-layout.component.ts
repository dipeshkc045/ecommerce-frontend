import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../layout.service';

@Component({
  standalone: true,
  selector: 'app-error-layout',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './error-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorLayoutComponent implements OnInit {
  private readonly layout = inject(LayoutService);

  ngOnInit(): void {
    this.layout.setLayoutMode('error');
  }
}
