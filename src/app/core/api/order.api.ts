import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {CreateOrderRequest, OrderResponse} from './types';

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
