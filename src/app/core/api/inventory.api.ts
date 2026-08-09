import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import {GlobalApiResponse, InventoryResponse} from './types';



@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private readonly http = inject(HttpClient);

  getInventory(productId: number) {
    return this.http.get<GlobalApiResponse<InventoryResponse>>(
      `/inventory-service/api/inventory/${productId}`
    );
  }
}
