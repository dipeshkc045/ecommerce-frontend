export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  sku: string;
  categoryId: number | null;
  categoryName: string | null;
  isActive: boolean;
  imageUrl: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ProductFeature {
  title: string;
  detail: string;
}

export type ShowcaseAccent = 'blue' | 'pink' | 'orange' | 'teal' | 'purple';

export interface ShowcaseProduct extends Product {
  rating: number;
  features: ProductFeature[];
  accent: ShowcaseAccent;
}

export const PRODUCT_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

export const PRODUCT_CATEGORIES = [
  'Women',
  'Men',
  'Accessories',
  'Footwear',
  'Electronics',
  'Home',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface PriceRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: '0-50', label: 'Under $50', min: 0, max: 50 },
  { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { id: '100-200', label: '$100 - $200', min: 100, max: 200 },
  { id: '200+', label: 'Over $200', min: 200, max: Infinity },
];
