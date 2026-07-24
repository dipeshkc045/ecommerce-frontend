import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

@Component({
  standalone: true,
  selector: 'app-skeleton',
  template: '',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('rect');
  readonly width = input<string>('100%');
  readonly height = input<string>('16px');
  readonly lines = input<number>(1);

  @HostBinding('style.width')  get w() { return this.width(); }
  @HostBinding('style.height') get h() { return this.height(); }
  @HostBinding('class') get hostClass(): string {
    return `app-skeleton app-skeleton--${this.variant()}`;
  }
}
