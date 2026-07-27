import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class OrderApi {
  private readonly http = inject(HttpClient);

  create(request: CreateOrderRequest) {
    return this.http.post<OrderResponse>('/order-service/api/orders', request);
  }

  getByUserId(userId: string) {
    return this.http.get<OrderResponse[]>(`/order-service/api/orders/user/${userId}`);
  }

  getById(id: number) {
    return this.http.get<OrderResponse>(`/order-service/api/orders/${id}`);
  }

  getByOrderNumber(orderNumber: string) {
    return this.http.get<OrderResponse>(`/order-service/api/orders/number/${orderNumber}`);
  }
}
