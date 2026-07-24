import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-rating-stars',
  template: `
    <div class="rating-stars" [attr.aria-label]="'Rating: ' + rating() + ' out of 5'">
      @for (star of stars; track star) {
        <svg
          class="rating-stars__icon"
          [class.rating-stars__icon--filled]="star <= rating()"
          viewBox="0 0 24 24"
          width="13"
          height="13"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      }
    </div>
  `,
  styleUrl: './rating-stars.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingStarsComponent {
  readonly rating = input(0);
  readonly stars = [1, 2, 3, 4, 5];
}
