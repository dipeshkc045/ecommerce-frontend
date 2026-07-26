export type ProductCardBadge = 'bestseller' | 'new' | 'sale' | 'hot';
export type ProductCardVariant = 'grid' | 'compact' | 'horizontal' | 'showcase' | 'minimal';
export type StockStatus = 'inStock' | 'lowStock' | 'outOfStock';

export interface ProductFeature {
  title: string;
  detail: string;
  color?: string;
}

export interface ProductCardModel {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  discountPercentage: number | null;
  imageUrl: string;
  badge: ProductCardBadge | null;
  rating: number;
  reviewCount: number;
  categoryName: string | null;
  sku: string;
  accent: string | null;
  features: ProductFeature[];
  stockStatus: StockStatus;
  stockQuantity: number;
  wishlisted: boolean;
  tags: string[];
}
