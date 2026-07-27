import type { Product } from '../../../core/models/product.model';
import type { ProductCardApiItem } from '../../../core/api/product.api';
import type { ProductCardModel, StockStatus } from './product-card.model';

const PLACEHOLDER_IMAGE = '/images/headphones.svg';
const ACCENT_CYCLE = ['blue', 'pink', 'orange', 'teal', 'purple'] as const;

export function toProductCardModelFromApi(item: ProductCardApiItem, index = 0): ProductCardModel {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    price: item.price,
    oldPrice: item.oldPrice,
    discountPercentage: item.discountPercentage,
    imageUrl: item.imageUrl ?? PLACEHOLDER_IMAGE,
    badge: item.badge,
    rating: item.rating,
    reviewCount: item.reviewCount,
    categoryName: item.categoryName,
    sku: item.sku,
    accent: item.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length],
    features: item.features ?? [],
    stockStatus: item.stockStatus,
    stockQuantity: item.stockQuantity,
    wishlisted: item.wishlisted,
    tags: item.tags ?? [],
  };
}

export function toProductCardModelFromApiList(items: ProductCardApiItem[]): ProductCardModel[] {
  return items.map((item, i) => toProductCardModelFromApi(item, i));
}

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