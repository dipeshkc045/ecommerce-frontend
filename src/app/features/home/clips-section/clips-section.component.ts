import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface ClipItem {
  title: string;
  thumbnail: string;
}

@Component({
  standalone: true,
  selector: 'app-clips-section',
  imports: [RouterLink],
  templateUrl: './clips-section.component.html',
  styleUrl: './clips-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClipsSectionComponent {
  readonly clips: ClipItem[] = [
    {
      title: 'iPhone 17 Pro Max 256...',
      thumbnail: 'images/clips/clip-iphone-orange.png',
    },
    {
      title: 'Nike Air Jordan Golf',
      thumbnail: 'images/clips/clip-nike-sneakers.png',
    },
    {
      title: 'UGC Example for a be...',
      thumbnail: 'images/clips/clip-beauty-product.png',
    },
    {
      title: 'iPhone 16 Plus Ultram...',
      thumbnail: 'images/clips/clip-iphone-blue.png',
    },
  ];
}
