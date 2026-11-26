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
  /** Display order, the main image first. A product list carries only the main image. */
  images?: ProductImage[];
}

/** One `<source>` of a `<picture>`: a format (best first) and a ready srcset in the allowed widths. */
export interface ImageSource {
  type: string;
  srcset: string;
}

/** A product image as the API gives it; width and height are of the original, for the aspect ratio. */
export interface ProductImage {
  alt: string;
  width: number;
  height: number;
  src: string;
  sources: ImageSource[];
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

/** Answer of `POST /web/v1/cart/merge` (ADR-0025): `capped` and `skipped` are SKU ids. */
export interface CartMerge {
  merged: boolean;
  lines_moved: number;
  capped: string[];
  skipped: string[];
  cart: Cart;
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

/** A saved delivery address (ticket #7). Nepal addresses: province, district, municipality, ward, landmark. */
export interface Address {
  address_id: string;
  recipient_name: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  ward: number;
  street?: string | null;
  landmark: string;
  is_default: boolean;
}

export interface AddressBody {
  recipient_name: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  ward: number;
  street?: string;
  landmark: string;
  make_default?: boolean;
}

export const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'] as const;
