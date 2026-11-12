const LABELS: Record<string, { label: string; css: string }> = {
  PENDING_PAYMENT: { label: 'Waiting for payment', css: 'badge badge--low' },
  CONFIRMED: { label: 'Confirmed', css: 'badge badge--ok' },
  PROCESSING: { label: 'Being prepared', css: 'badge badge--ok' },
  PARTIALLY_SHIPPED: { label: 'Partly shipped', css: 'badge badge--ok' },
  SHIPPED: { label: 'On its way', css: 'badge badge--ok' },
  DELIVERED: { label: 'Delivered', css: 'badge badge--ok' },
  RETURN_IN_PROGRESS: { label: 'Return in progress', css: 'badge badge--low' },
  COMPLETED: { label: 'Completed', css: 'badge badge--ok' },
  CANCELLED: { label: 'Cancelled', css: 'badge badge--bad' },
};

export function statusLabel(status: string): { label: string; css: string } {
  return LABELS[status] ?? { label: status, css: 'badge' };
}

export function methodLabel(method: string): string {
  return method === 'KHALTI' ? 'Khalti' : method === 'COD' ? 'Cash on delivery' : method;
}
