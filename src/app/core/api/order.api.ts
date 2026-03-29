import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export type OrderItemRequest = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
};

export type CreateOrderRequest = {
  userId: string;
  items: OrderItemRequest[];
  currency: string;
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
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
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
}
