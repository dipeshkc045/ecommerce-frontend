import type { Money } from '../shop/shop.types';
import type { Lang } from './i18n.service';

// Nepali is formatted by hand, not with Intl: browsers and phones differ in whether they carry Nepali locale data, and
// the same amount must read the same everywhere (and on the server that renders the page).

const DEVA_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
export const toDeva = (digits: string): string => digits.replace(/\d/g, (d) => DEVA_DIGITS[Number(d)]);

const NE_MONTHS = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'];

/** 1234567 → "12,34,567": the last three digits, then pairs (the lakh and crore grouping Nepal uses). */
function lakh(integerDigits: string): string {
  if (integerDigits.length <= 3) return integerDigits;
  const head = integerDigits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${integerDigits.slice(-3)}`;
}

/** @param grouped false for a year or an id, which never gets a thousands separator */
export function formatNumber(value: number, lang: Lang, grouped = true): string {
  if (lang === 'en') return value.toLocaleString('en-US', { maximumFractionDigits: 2, useGrouping: grouped });
  const negative = value < 0;
  const [whole, fraction] = Math.abs(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '').split('.');
  return `${negative ? '-' : ''}${toDeva(grouped ? lakh(whole) : whole)}${fraction ? `.${toDeva(fraction)}` : ''}`;
}

/** Money arrives as whole paisa. "Rs. 1,234.50" / "रू. १,२३४.५०"; whole rupees drop the decimals. */
export function formatMoney(money: Money | null | undefined, lang: Lang = 'en'): string {
  if (!money) return '';
  const negative = money.amount_minor < 0;
  const abs = Math.abs(money.amount_minor);
  const rupees = Math.floor(abs / 100);
  const paisa = abs % 100;
  const fraction = paisa === 0 ? '' : `.${String(paisa).padStart(2, '0')}`;
  const symbol = money.currency === 'NPR' ? (lang === 'ne' ? 'रू.' : 'Rs.') : money.currency;
  const amount = lang === 'ne' ? toDeva(`${lakh(String(rupees))}${fraction}`) : `${rupees.toLocaleString('en-US')}${fraction}`;
  return `${negative ? '-' : ''}${symbol} ${amount}`;
}

/** A date, or a date with the time, in the customer's language: "26 Nov 2026" / "२६ नोभेम्बर २०२६". */
export function formatDate(iso: string | number | Date | null | undefined, lang: Lang, withTime = false): string {
  if (iso === null || iso === undefined || iso === '') return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  if (lang === 'en') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    }).format(date);
  }
  const day = toDeva(String(date.getDate()));
  const year = toDeva(String(date.getFullYear()));
  const text = `${day} ${NE_MONTHS[date.getMonth()]} ${year}`;
  if (!withTime) return text;
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${text}, ${toDeva(time)}`;
}
