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
  'Electronics',
  'Women',
  'Men',
  'Accessories',
  'Footwear',
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

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export const BRANDS: FilterOption[] = [
  { id: 'apple', label: 'Apple', count: 24 },
  { id: 'samsung', label: 'Samsung', count: 18 },
  { id: 'sony', label: 'Sony', count: 12 },
  { id: 'bose', label: 'Bose', count: 8 },
  { id: 'jbl', label: 'JBL', count: 6 },
];

export const COLORS: FilterOption[] = [
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'blue', label: 'Blue' },
  { id: 'red', label: 'Red' },
];

export const RATING_OPTIONS: FilterOption[] = [
  { id: '4', label: '4 ★ & Up' },
  { id: '3', label: '3 ★ & Up' },
  { id: '2', label: '2 ★ & Up' },
  { id: '1', label: '1 ★ & Up' },
];

export const AVAILABILITY_OPTIONS: FilterOption[] = [
  { id: 'inStock', label: 'In Stock' },
  { id: 'fastDelivery', label: 'Fast Delivery' },
  { id: 'freeShipping', label: 'Free Shipping' },
];

export const DISCOUNT_OPTIONS: FilterOption[] = [
  { id: '10', label: '10% Off or More' },
  { id: '20', label: '20% Off or More' },
  { id: '30', label: '30% Off or More' },
  { id: '40', label: '40% Off or More' },
  { id: '50', label: '50% Off or More' },
];
