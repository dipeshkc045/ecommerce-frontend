import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export type GlobalApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field?: string; message?: string; code?: string }>;
  timestamp?: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type CartItemApiDto = {
  id?: number | string;
  productId: string | number;
  productName?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  unitPrice?: string | number | null;
  quantity: number;
  totalPrice?: string | number | null;
};

export type CartResponseDto = {
  id?: number | string;
  userId?: string | null;
  items: CartItemApiDto[];
  totalAmount?: string | number | null;
  totalItems?: number;
  updatedAt?: string | null;
};

export type AddCartItemRequest = {
  productId: string | number;
  quantity: number;
};

export type UpdateCartItemRequest = {
  quantity: number;
};

export type MergeCartRequest = {
  items: AddCartItemRequest[];
};


export type ProductResponse = {
  id: number;
  name: string;
  description: string | null;
  price: string; // BigDecimal serialized as string
  sku: string;
  categoryId: number | null;
  categoryName: string | null;
  active: boolean | null;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProductCategoryPageResponse = {
  content: ProductResponse[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
};

/** Shape returned by /api/products/featured and /api/products/trending */
export type ProductCardApiItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  discountPercentage: number | null;
  imageUrl: string | null;
  badge: 'bestseller' | 'new' | 'sale' | 'hot' | null;
  rating: number;
  reviewCount: number;
  categoryName: string | null;
  sku: string;
  accent: 'blue' | 'pink' | 'orange' | 'teal' | 'purple' | null;
  features: Array<{ title: string; detail: string; color?: string }>;
  stockStatus: 'inStock' | 'lowStock' | 'outOfStock';
  stockQuantity: number;
  wishlisted: boolean;
  tags: string[];
};

export type ProductPayload = {
  name: string;
  description?: string | null;
  price: string;
  sku: string;
  categoryId?: number | null;
  active?: boolean | null;
  imageUrl?: string | null;
};

export type ProductSearchFilterPayload = {
  query?: string;
  categories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  brands?: string[];
  colors?: string[];
  minRating?: number;
  availability?: string[];
  minDiscount?: number;
  sortBy?: string;
  pagination?: {
    page?: number;
    size?: number;
  };
};

export type InventoryResponse = {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string | null;
};

export type OrderItemRequest = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
};

export type ShippingAddressRequest = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};
export interface PromotionValidationResult {
  valid: boolean;
  discountAmount: number;
  message?: string;
}

export type LoginResponse = {
  userId: string | null;
  email: string | null;
  userType: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number | null;
  requiresVerification: boolean | null;
  requiresKycVerification: boolean | null;
};

export type LoginRequest = {
  emailOrPhone: string;
  password: string;
};

export type CustomerRegistrationRequest = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type RegistrationResponse = {
  userId: string;
  email: string;
  userType: string;
  status: string;
  message: string;
  requiresEmailVerification: boolean | null;
  requiresPhoneVerification: boolean | null;
  requiresKycVerification: boolean | null;
};

export interface UserAddress {
  id: string;
  userId?: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export type CreateAddressRequest = Omit<UserAddress, 'id'>;

export interface UserPaymentMethod {
  id: string;
  userId?: string;
  brand: string;
  last4: string;
  exp: string;
  name: string;
  isDefault?: boolean;
}

export type CreatePaymentMethodRequest = Omit<UserPaymentMethod, 'id'>;

export type ContactInfoRequest = {
  email: string;
  phone: string;
};

export type PaymentInfoRequest = {
  methodType: string;
  last4: string;
  expiry: string;
};

export type CreateOrderRequest = {
  userId?: string;
  items: OrderItemRequest[];
  currency: string;
  guestEmail?: string;
  idempotencyKey?: string;
  shippingAddress?: ShippingAddressRequest;
  contactInfo?: ContactInfoRequest;
  paymentInfo?: PaymentInfoRequest;
};

export type OrderItemResponse = {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
};

export type OrderResponse = {
  id: number;
  orderNumber: string;
  userId: string;
  guestEmail?: string;
  status: string;
  totalAmount: string;
  currency: string;
  // ── Shipping ──
  shippingName?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  // ── Contact ──
  contactEmail?: string;
  contactPhone?: string;
  // ── Payment ──
  paymentMethodType?: string;
  paymentLast4?: string;
  paymentExpiry?: string;
  // ── Cost breakdown ──
  subtotal?: string;
  shippingCost?: string;
  taxAmount?: string;
  // ── Dates ──
  createdAt: string;
  updatedAt: string;
  // ── Items ──
  items: OrderItemResponse[];
};

export type CategoryResponse = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  bgColor: string;
  href: string;
  description: string | null;
};
