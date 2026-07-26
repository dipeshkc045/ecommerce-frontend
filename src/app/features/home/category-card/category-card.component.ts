import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Maps the Tailwind-style bgColor class strings returned by the API
 * to real CSS colour values used in the card circle.
 */
const BG_COLOR_MAP: Record<string, string> = {
  'bg-indigo-100': '#e0e7ff',
  'bg-rose-100':   '#ffe4e6',
  'bg-emerald-100':'#d1fae5',
  'bg-blue-100':   '#dbeafe',
  'bg-amber-100':  '#fef3c7',
  'bg-purple-100': '#ede9fe',
  'bg-pink-100':   '#fce7f3',
  'bg-teal-100':   '#ccfbf1',
  'bg-orange-100': '#ffedd5',
  'bg-yellow-100': '#fef9c3',
  'bg-green-100':  '#dcfce7',
};

/** Emoji fallback icons for common Lucide icon names from the API */
const ICON_EMOJI_MAP: Record<string, string> = {
  Zap:       '⚡',
  Shirt:     '👕',
  Home:      '🏠',
  Gem:       '💎',
  Gamepad2:  '🎮',
  BookOpen:  '📚',
  ShoppingCart: '🛒',
  Heart:     '❤️',
  Star:      '⭐',
  Package:   '📦',
};

@Component({
  standalone: true,
  selector: 'app-category-card',
  imports: [RouterLink],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryCardComponent {
  @Input({ required: true }) name!: string;
  /** Lucide icon name (e.g. "Zap") OR an emoji string. Falls back to emoji map. */
  @Input({ required: true }) icon!: string;
  /** Tailwind bgColor class (e.g. "bg-indigo-100") OR a raw CSS colour string. */
  @Input() color = '#f5f6fa';
  /** Router link target for this category (e.g. "/category/smart-watches"). */
  @Input() href = '/products';
  /** Optional query params to pass with the router link. */
  @Input() queryParams: Record<string, string> = {};

  get resolvedColor(): string {
    return BG_COLOR_MAP[this.color] ?? this.color;
  }

  get resolvedIcon(): string {
    return ICON_EMOJI_MAP[this.icon] ?? this.icon;
  }
}
