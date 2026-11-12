import type { Money } from './shop.types';

/** Money arrives as whole paisa (1 NPR = 100 paisa). Shown as "Rs. 1,234.50"; whole rupees drop the decimals. */
export function formatMoney(money: Money | null | undefined): string {
  if (!money) return '';
  const negative = money.amount_minor < 0;
  const abs = Math.abs(money.amount_minor);
  const rupees = Math.floor(abs / 100);
  const paisa = abs % 100;
  const grouped = rupees.toLocaleString('en-US');
  const text = paisa === 0 ? grouped : `${grouped}.${String(paisa).padStart(2, '0')}`;
  const symbol = money.currency === 'NPR' ? 'Rs.' : money.currency;
  return `${negative ? '-' : ''}${symbol} ${text}`;
}
