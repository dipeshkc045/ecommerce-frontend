/** Shapes of the commerce-core web API (docs/06). Field names are snake_case exactly as sent. */

export interface Money {
  amount_minor: number;
  currency: string;
}

export type Availability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Sku {
  sku_id: string;
  sku_code: string;
  option: string | null;
  price: Money | null;
  availability: Availability;
  purchasable: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  skus: Sku[];
}

export interface Page<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CartLine {
  sku_id: string;
  sku_code: string | null;
  product_name: string | null;
  option: string | null;
  quantity: number;
  unit_price: Money | null;
  line_total: Money | null;
  availability: Availability;
  buyable: boolean;
  message?: string | null;
}

export interface Cart {
  cart_id: string | null;
  version: number;
  lines: CartLine[];
  subtotal: Money;
  delivery: Money;
  total: Money;
  item_count: number;
}

export type PaymentMethod = 'KHALTI' | 'COD';

export interface PlaceOrderRequest {
  from_cart: true;
  payment_method: PaymentMethod;
}

/** 201 confirmed, or 202 with a redirect to pay. */
export interface Placement {
  saga_id: string;
  order_id: string;
  order_number: string;
  status: 'CONFIRMED' | 'AWAITING_CUSTOMER_ACTION';
  total?: Money;
  next_action?: { type: 'REDIRECT'; url: string; expires_at: string };
  status_url?: string;
}

export interface OrderSummary {
  order_id: string;
  order_number: string;
  status: string;
  payment_method: string;
  total: Money;
  item_count: number;
  placed_at: string;
}

export interface OrderLine {
  sku_id: string;
  sku_code: string;
  product_name: string;
  option: string | null;
  quantity: number;
  unit_price: Money;
  vat: Money;
  line_total: Money;
}

export interface OrderDetail {
  order: OrderSummary;
  items_total: Money;
  shipping_total: Money;
  vat_included: Money;
  prices_include_vat: boolean;
  lines: OrderLine[];
}

export interface Session {
  customer_id: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
}

export interface CodeSent {
  expires_in_seconds: number;
  resend_after_seconds: number;
}

/** RFC 7807 body with our `code` extension. */
export interface Problem {
  status: number;
  detail?: string;
  code?: string;
  saga_id?: string;
}
