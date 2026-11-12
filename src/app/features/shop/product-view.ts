import type { Availability, Money, Product, Sku } from '../../core/shop/shop.types';

export function lowestPrice(p: Product): Money | null {
  const prices = p.skus.filter((s) => s.purchasable && s.price).map((s) => s.price as Money);
  if (prices.length === 0) return null;
  return prices.reduce((a, b) => (b.amount_minor < a.amount_minor ? b : a));
}

const LABELS: Record<Availability, { label: string; css: string }> = {
  IN_STOCK: { label: 'In stock', css: 'badge badge--ok' },
  LOW_STOCK: { label: 'Only a few left', css: 'badge badge--low' },
  OUT_OF_STOCK: { label: 'Out of stock', css: 'badge badge--out' },
};

/** Best availability among the buyable options; display only, checkout checks stock again. */
export function stockBadge(skus: Sku[]): { label: string; css: string } {
  const buyable = skus.filter((s) => s.purchasable);
  if (buyable.length === 0) return LABELS.OUT_OF_STOCK;
  if (buyable.some((s) => s.availability === 'IN_STOCK')) return LABELS.IN_STOCK;
  if (buyable.some((s) => s.availability === 'LOW_STOCK')) return LABELS.LOW_STOCK;
  return LABELS.OUT_OF_STOCK;
}

export function skuBadge(sku: Sku) {
  return sku.purchasable ? LABELS[sku.availability] : LABELS.OUT_OF_STOCK;
}
