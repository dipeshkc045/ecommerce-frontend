import { DOCUMENT } from '@angular/common';
import { Injectable, PLATFORM_ID, REQUEST, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { NE } from './messages.ne';

export type Lang = 'en' | 'ne';
export const LANGUAGES: readonly Lang[] = ['en', 'ne'];

const COOKIE = 'lang';
const ONE_YEAR = 60 * 60 * 24 * 365;

/** The language named in a Cookie header ("a=1; lang=ne"), or English. Pure, so the server and the tests can use it. */
export function langFromCookie(header: string | null | undefined): Lang {
  const match = /(?:^|;\s*)lang=([a-z]{2})(?:;|$)/.exec(header ?? '');
  return match && (LANGUAGES as readonly string[]).includes(match[1]) ? (match[1] as Lang) : 'en';
}

/** Fills {name} placeholders. A placeholder with no value stays visible, which is easier to notice than a blank. */
export function fill(text: string, params?: Record<string, string | number | null | undefined>): string {
  return params ? text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name] ?? '') : whole)) : text;
}

/** The text in Nepali if there is a translation, else as written (English is the source language). */
export function translateTo(lang: Lang, text: string, params?: Record<string, string | number | null | undefined>): string {
  return fill(lang === 'ne' ? (NE[text] ?? text) : text, params);
}

/**
 * The customer's language (ticket #58). One per request on the server and one per tab in the browser, never shared
 * between visitors. It is kept in a cookie, not in storage, so the server renders the right language at once;
 * it is not tied to signing in, so it survives sign-in and sign-out.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly request = inject(REQUEST, { optional: true });

  readonly lang = signal<Lang>(
    langFromCookie(this.browser ? this.document.cookie : this.request?.headers.get('cookie')),
  );

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.lang(); // screen readers, hyphenation and the Nepali font rules
    });
  }

  set(lang: Lang): void {
    this.lang.set(lang);
    if (this.browser) {
      this.document.cookie = `${COOKIE}=${lang}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
    }
  }

  toggle(): void {
    this.set(this.lang() === 'en' ? 'ne' : 'en');
  }

  t(text: string, params?: Record<string, string | number | null | undefined>): string {
    return translateTo(this.lang(), text, params);
  }
}
