export type Category = {
  id: number;
  name: string;
  slug: string;
  /** Lucide icon name from the API (e.g. "Zap", "Shirt") */
  icon: string;
  /** Tailwind-style bg class from the API – mapped to a hex color for rendering */
  bgColor: string;
  /** Navigation href, e.g. /category/smart-watches */
  href: string;
  description: string | null;
};
