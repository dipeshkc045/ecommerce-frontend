import { Injectable, inject } from '@angular/core';
import {
  LayoutService,
  THEME_LABELS,
  THEME_PRESETS,
  type ThemePreset,
} from '../layout/layout.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly layout = inject(LayoutService);

  readonly theme = this.layout.theme;
  readonly themeLabel = this.layout.themeLabel;
  readonly isDark = this.layout.isDark;
  readonly presets = THEME_PRESETS;
  readonly labels = THEME_LABELS;

  cycle(): void {
    this.layout.cycleTheme();
  }

  set(preset: ThemePreset): void {
    this.layout.setTheme(preset);
  }

  toggle(): void {
    this.layout.cycleTheme();
  }

  init(): void {
    this.layout.initTheme();
  }
}
