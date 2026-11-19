import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('shows whole rupees without decimals', () => {
    expect(formatMoney({ amount_minor: 125000, currency: 'NPR' })).toBe('Rs. 1,250');
  });
  it('shows paisa with two digits', () => {
    expect(formatMoney({ amount_minor: 100505, currency: 'NPR' })).toBe('Rs. 1,005.05');
    expect(formatMoney({ amount_minor: 99, currency: 'NPR' })).toBe('Rs. 0.99');
  });
  it('handles empty and other currencies', () => {
    expect(formatMoney(null)).toBe('');
    expect(formatMoney({ amount_minor: 1000, currency: 'USD' })).toBe('USD 10');
  });
});
