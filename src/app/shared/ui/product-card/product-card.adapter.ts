import type { Product } from '../../../core/models/product.model';
import type { ProductCardModel, StockStatus } from './product-card.model';

function computeStockStatus(product: Product): StockStatus {
  if (product.isActive === false) return 'outOfStock';
  return 'inStock';
}

export function toProductCardModel(product: Product): ProductCardModel {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    oldPrice: null,
    discountPercentage: null,
    imageUrl: product.imageUrl,
    badge: null,
    rating: 4,
    reviewCount: 0,
    categoryName: product.categoryName,
    sku: product.sku,
    accent: null,
    features: [],
    stockStatus: computeStockStatus(product),
    stockQuantity: 0,
    wishlisted: false,
    tags: [],
  };
}

export function toProductCardModelList(products: Product[]): ProductCardModel[] {
  return products.map(toProductCardModel);
}