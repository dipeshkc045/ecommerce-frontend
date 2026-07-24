import { Injectable } from '@angular/core';

import type { ProductPayload, ProductResponse } from '../api/product.api';
import { PRODUCT_PLACEHOLDER_IMAGE, type Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductMapper {
  toDomain(dto: ProductResponse): Product {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? '',
      price: Number.parseFloat(dto.price) || 0,
      sku: dto.sku,
      categoryId: dto.categoryId,
      categoryName: dto.categoryName,
      isActive: dto.active ?? true,
      imageUrl: dto.imageUrl ?? PRODUCT_PLACEHOLDER_IMAGE,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
    };
  }

  toDomainList(dtos: ProductResponse[]): Product[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  toPayload(product: Pick<Product, 'name' | 'description' | 'price' | 'sku' | 'categoryId' | 'isActive' | 'imageUrl'>): ProductPayload {
    return {
      name: product.name,
      description: product.description || null,
      price: product.price.toFixed(2),
      sku: product.sku,
      categoryId: product.categoryId,
      active: product.isActive,
      imageUrl: product.imageUrl || null,
    };
  }
}
