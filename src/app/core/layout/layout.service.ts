import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { Breadcrumb } from '../models/breadcrumb.model';
import { AppNotification } from '../models/notification.model';

export type LayoutMode = 'public' | 'customer' | 'admin' | 'auth' | 'error';
export type ThemePreset = 'light' | 'dark' | 'luxury' | 'electronics' | 'fashion';

/** @deprecated Use ThemePreset */
export type ThemeMode = ThemePreset;

export const THEME_PRESETS: ThemePreset[] = [
  'light',
  'dark',
  'luxury',
  'electronics',
  'fashion',
];

export const THEME_LABELS: Record<ThemePreset, string> = {
  light: 'Light',
  dark: 'Dark',
  luxury: 'Luxury',
  electronics: 'Electronics',
  fashion: 'Fashion',
};
export type PageWidth = 'default' | 'wide' | 'narrow' | 'full';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ── Sidebar State
  private readonly _sidebarCollapsed = signal<boolean>(false);
  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();

  // ── Mobile Sidebar Drawer
  private readonly _sidebarOpen = signal<boolean>(false);
  readonly sidebarOpen = this._sidebarOpen.asReadonly();

  // ── Page Title & Meta
  private readonly _pageTitle = signal<string>('');
  readonly pageTitle = this._pageTitle.asReadonly();

  private readonly _pageSubtitle = signal<string>('');
  readonly pageSubtitle = this._pageSubtitle.asReadonly();

  // ── Breadcrumbs
  private readonly _breadcrumbs = signal<Breadcrumb[]>([]);
  readonly breadcrumbs = this._breadcrumbs.asReadonly();

  // ── Theme
  private readonly _theme = signal<ThemePreset>(
    this.isBrowser
      ? (localStorage.getItem('ecommerce.theme') as ThemePreset | null) ?? 'light'
      : 'light'
  );
  readonly theme = this._theme.asReadonly();
  readonly themeLabel = computed(() => THEME_LABELS[this._theme()]);
  readonly isDark = computed(() => {
    const preset = this._theme();
    return preset === 'dark' || preset === 'electronics';
  });

  // ── Loading
  private readonly _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  // ── Notifications (Toasts)
  private readonly _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  // ── Layout Mode
  private readonly _layoutMode = signal<LayoutMode>('public');
  readonly layoutMode = this._layoutMode.asReadonly();

  // ── Page Width
  private readonly _pageWidth = signal<PageWidth>('default');
  readonly pageWidth = this._pageWidth.asReadonly();

  // ─────────────────────────────────────────────────────────────────
  // Sidebar Methods
  // ─────────────────────────────────────────────────────────────────

  toggleSidebar(): void {
    this._sidebarCollapsed.update(v => !v);
  }

  collapseSidebar(): void {
    this._sidebarCollapsed.set(true);
  }

  expandSidebar(): void {
    this._sidebarCollapsed.set(false);
  }

  toggleMobileSidebar(): void {
    this._sidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this._sidebarOpen.set(false);
  }

  openMobileSidebar(): void {
    this._sidebarOpen.set(true);
  }

  // ─────────────────────────────────────────────────────────────────
  // Page Meta Methods
  // ─────────────────────────────────────────────────────────────────

  setPageTitle(title: string): void {
    this._pageTitle.set(title);
    if (this.isBrowser) {
      document.title = title ? `${title} — Emox` : 'Emox';
    }
  }

  setPageSubtitle(subtitle: string): void {
    this._pageSubtitle.set(subtitle);
  }

  setPageMeta(title: string, subtitle = ''): void {
    this.setPageTitle(title);
    this.setPageSubtitle(subtitle);
  }

  // ─────────────────────────────────────────────────────────────────
  // Breadcrumb Methods
  // ─────────────────────────────────────────────────────────────────

  setBreadcrumbs(crumbs: Breadcrumb[]): void {
    this._breadcrumbs.set(crumbs);
  }

  // ─────────────────────────────────────────────────────────────────
  // Theme Methods
  // ─────────────────────────────────────────────────────────────────

  setTheme(theme: ThemePreset): void {
    this._theme.set(theme);
    if (this.isBrowser) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme =
        theme === 'dark' || theme === 'electronics' ? 'dark' : 'light';
      localStorage.setItem('ecommerce.theme', theme);
    }
  }

  cycleTheme(): void {
    const current = this._theme();
    const index = THEME_PRESETS.indexOf(current);
    const next = THEME_PRESETS[(index + 1) % THEME_PRESETS.length];
    this.setTheme(next);
  }

  toggleTheme(): void {
    this.cycleTheme();
  }

  initTheme(): void {
    if (this.isBrowser) {
      const saved = localStorage.getItem('ecommerce.theme') as ThemePreset | null;
      const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const theme = saved && THEME_PRESETS.includes(saved) ? saved : preferred;
      this.setTheme(theme);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Loading Methods
  // ─────────────────────────────────────────────────────────────────

  startLoading(): void {
    this._loading.set(true);
  }

  stopLoading(): void {
    this._loading.set(false);
  }

  // ─────────────────────────────────────────────────────────────────
  // Layout Mode Methods
  // ─────────────────────────────────────────────────────────────────

  setLayoutMode(mode: LayoutMode): void {
    this._layoutMode.set(mode);
  }

  setPageWidth(width: PageWidth): void {
    this._pageWidth.set(width);
  }
}
