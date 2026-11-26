import { Injectable, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { I18nService } from './i18n.service';

/** The tab title is a route title in the customer's language, and changes with the language switch. */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private current: string | undefined;

  constructor() {
    super();
    effect(() => {
      this.i18n.lang();
      if (this.current !== undefined) this.apply();
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.current = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    if (this.current) this.title.setTitle(this.i18n.t(this.current));
  }
}
