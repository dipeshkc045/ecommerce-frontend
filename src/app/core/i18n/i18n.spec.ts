import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { formatDate, formatMoney, formatNumber } from './format';
import { fill, langFromCookie, translateTo } from './i18n.service';
import { NE } from './messages.ne';

const SRC = join(process.cwd(), 'src', 'app');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|html)$/.test(name) && !/\.spec\.ts$/.test(name) && !path.includes('messages.ne') ? [path] : [];
  });
}

// A single-quoted string that may contain \' (backslash then quote)
const Q = String.raw`'((?:[^'\\\r\n]|\\.)*)'`;
const unescape = (s: string) => s.replace(/\\'/g, "'");

/** Every English text the code hands to the translation layer, found by reading the source. */
function usedKeys(): Map<string, string> {
  const found = new Map<string, string>();
  const add = (key: string, file: string) => {
    if (key.trim() && !/^[a-z_]+$/.test(key) && !/^[A-Z_]+$/.test(key)) found.set(unescape(key), file);
  };
  const all = (re: RegExp, text: string) => [...text.matchAll(re)];
  for (const file of files(SRC)) {
    const text = readFileSync(file, 'utf8');
    const name = file.slice(SRC.length + 1).split('\\').join('/');
    // 'text' | t      and      (cond ? 'a' : 'b') | t   (every literal inside the parentheses)
    for (const m of all(new RegExp(Q + String.raw`\s*\|\s*t\b`, 'g'), text)) add(m[1], name);
    for (const m of all(new RegExp(String.raw`\(((?:[^()]|\(\))*)\)\s*\|\s*t\b`, 'g'), text)) for (const q of all(new RegExp(Q, 'g'), m[1])) add(q[1], name);
    // texts kept in code and translated where they are shown
    for (const m of all(new RegExp(String.raw`(?:label|title):\s*` + Q, 'g'), text)) add(m[1], name);
    for (const m of all(new RegExp(String.raw`\b(?:error|fieldError|failMessage)\.set\(` + Q + String.raw`\)`, 'g'), text)) add(m[1], name);
    for (const m of all(new RegExp(String.raw`messageFor\([^,()]+,\s*` + Q + String.raw`\)`, 'g'), text)) add(m[1], name);
    for (const m of all(new RegExp(String.raw`message:\s*` + Q, 'g'), text)) add(m[1], name);
    // a text chosen in a ternary that feeds an error signal:  ? 'We could not find this order.' : messageFor(...)
    for (const m of all(new RegExp(String.raw`\?\s*` + Q + String.raw`\s*:\s*messageFor`, 'g'), text)) add(m[1], name);
    if (name.endsWith('order-view.ts')) for (const m of all(new RegExp(String.raw`\?\s*` + Q, 'g'), text)) add(m[1], name);
    if (name.endsWith('problem.ts')) {
      for (const m of all(new RegExp(String.raw`return\s+` + Q, 'g'), text)) add(m[1], name);
      for (const m of all(new RegExp(String.raw`fallback = ` + Q, 'g'), text)) add(m[1], name);
    }
    for (const m of all(new RegExp(String.raw`\['(?:recipient_name|phone|province|district|municipality|ward|landmark)',\s*` + Q + String.raw`\]`, 'g'), text)) add(m[1], name);
    if (name.endsWith('problem.ts')) for (const m of all(new RegExp(String.raw`^\s+[a-z_]+:\s*` + Q + ',?$', 'gm'), text)) add(m[1], name);
    if (name.endsWith('layout.service.ts')) for (const m of all(new RegExp(String.raw`^\s+[a-z]+:\s*'([A-Z][^']*)',$`, 'gm'), text)) add(m[1], name);
    if (name.endsWith('shop.types.ts')) {
      const provinces = /PROVINCES[^[]*\[([^\]]*)\]/.exec(text);
      if (provinces) for (const q of all(new RegExp(Q, 'g'), provinces[1])) add(q[1], name);
    }
  }
  return found;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('Nepali translations', () => {
  it('reads the source files', () => {
    expect(files(SRC).length, SRC).toBeGreaterThan(20);
    expect(usedKeys().size).toBeGreaterThan(100); // a scan that finds nothing would make the next tests pass for nothing
  });

  it('has no escaped apostrophe inside a {{ }} expression (it breaks the template; use ’)', () => {
    const bad = files(SRC).filter((file) => new RegExp(String.raw`\{\{[^}]*\\'[^}]*\}\}`).test(readFileSync(file, 'utf8')));
    expect(bad.map((f) => f.slice(SRC.length + 1))).toEqual([]);
  });

  it('has a translation for every text the code shows', () => {
    const missing = [...usedKeys()].filter(([key]) => !(key in NE)).map(([key, file]) => `${file}: ${key}`);
    expect(missing).toEqual([]);
  });

  it('has no entry that nothing uses any more', () => {
    const used = usedKeys();
    expect(Object.keys(NE).filter((key) => !used.has(key))).toEqual([]);
  });

  it('keeps the same {placeholders} as the English text, and never leaves one blank', () => {
    for (const [key, value] of Object.entries(NE)) {
      expect(value.trim(), key).not.toBe('');
      expect(placeholders(value), key).toEqual(placeholders(key));
    }
  });

  it('is Nepali: Devanagari wherever the English has words', () => {
    const latinOnly = Object.entries(NE).filter(([key, value]) => /[A-Za-z]{3,}/.test(key) && !/[\u0900-\u097F]/.test(value));
    expect(latinOnly.map(([key]) => key)).toEqual([]);
  });
});

describe('translating', () => {
  it('uses Nepali in Nepali and the text itself in English', () => {
    expect(translateTo('ne', 'Add to cart')).toBe('कार्टमा हाल्नुहोस्');
    expect(translateTo('en', 'Add to cart')).toBe('Add to cart');
  });

  it('shows the English text, never a blank, when there is no translation (a server message, say)', () => {
    expect(translateTo('ne', 'Some sentence only the server knows')).toBe('Some sentence only the server knows');
  });

  it('fills placeholders and leaves an unknown one visible', () => {
    expect(translateTo('ne', 'Order {number}', { number: 'EC-00001001' })).toBe('अर्डर EC-00001001');
    expect(fill('Hello {name} {other}', { name: 'Sita' })).toBe('Hello Sita {other}');
  });
});

describe('the language cookie', () => {
  it('is read from a Cookie header, English when absent or unknown', () => {
    expect(langFromCookie('theme=dark; lang=ne')).toBe('ne');
    expect(langFromCookie('lang=ne')).toBe('ne');
    expect(langFromCookie('lang=en; x=1')).toBe('en');
    expect(langFromCookie('lang=fr')).toBe('en');
    expect(langFromCookie('xlang=ne')).toBe('en');
    expect(langFromCookie(null)).toBe('en');
  });
});

describe('numbers, money and dates', () => {
  const money = (amount_minor: number) => ({ amount_minor, currency: 'NPR' });

  it('keeps the English look and shows Devanagari digits with lakh grouping in Nepali', () => {
    expect(formatMoney(money(123_456_00), 'en')).toBe('Rs. 123,456');
    expect(formatMoney(money(123_456_00), 'ne')).toBe('रू. १,२३,४५६');
    expect(formatMoney(money(1_234_50), 'ne')).toBe('रू. १,२३४.५०');
    expect(formatMoney(money(-5_00), 'ne')).toBe('-रू. ५');
    expect(formatMoney(null, 'ne')).toBe('');
  });

  it('writes counts in Devanagari in Nepali', () => {
    expect(formatNumber(12, 'ne')).toBe('१२');
    expect(formatNumber(12, 'en')).toBe('12');
    expect(formatNumber(1234567, 'ne')).toBe('१२,३४,५६७'); // lakh grouping
    expect(formatNumber(1234567, 'en')).toBe('1,234,567');
    expect(formatNumber(0, 'ne')).toBe('०');
    expect(formatNumber(2026, 'ne', false)).toBe('२०२६'); // a year has no thousands separator
    expect(formatNumber(2026, 'en', false)).toBe('2026');
  });

  it('writes dates with Nepali digits and month names', () => {
    const afternoon = new Date(2026, 10, 26, 15, 5).toISOString(); // built in local time, so the machine's zone does not matter
    expect(formatDate(afternoon, 'ne')).toBe('२६ नोभेम्बर २०२६');
    expect(formatDate(afternoon, 'ne', true)).toBe('२६ नोभेम्बर २०२६, १५:०५');
    expect(formatDate(new Date(2026, 0, 1).toISOString(), 'ne')).toBe('१ जनवरी २०२६');
    const ne = formatDate('2026-11-26T09:30:00Z', 'ne');
    expect(ne).toMatch(/[\u0900-\u097F]/);
    expect(ne).toContain('२६');
    expect(formatDate('2026-11-26T09:30:00Z', 'en')).toContain('Nov');
    expect(formatDate(null, 'ne')).toBe('');
    expect(formatDate('not a date', 'ne')).toBe('');
  });
});
