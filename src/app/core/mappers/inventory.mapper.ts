import { Injectable } from '@angular/core';


import type { Inventory } from '../models';
import {InventoryResponse} from '../api/types';

@Injectable({ providedIn: 'root' })
export class InventoryMapper {
  toDomain(dto: InventoryResponse): Inventory {
    return {
      id: dto.id,
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantity,
      reservedQuantity: dto.reservedQuantity,
      availableQuantity: dto.availableQuantity,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
    };
  }
}
