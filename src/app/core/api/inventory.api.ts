import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { GlobalApiResponse } from './types';

export type InventoryResponse = {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string | null;
};

@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private readonly http = inject(HttpClient);

  getInventory(productId: number) {
    return this.http.get<GlobalApiResponse<InventoryResponse>>(
      `/inventory-service/api/inventory/${productId}`
    );
  }
}
