import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ShopApi } from '../../core/shop/shop.api';
import { codeOf, messageFor, retryAfterSeconds } from '../../core/shop/problem';

/** Only paths inside this site are allowed as a place to return to. */
export function safeRedirect(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/products';
}

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [FormsModule],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop" style="max-width: 440px">
      <h1>Sign in</h1>
      @if (error()) {
        <p class="notice notice--error" role="alert">{{ error() }}</p>
      }
      @if (step() === 'phone') {
        <form class="card" (ngSubmit)="sendCode()" novalidate>
          <div class="field">
            <label for="phone">Mobile number</label>
            <input id="phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national"
                   placeholder="98XXXXXXXX" [ngModel]="phone()" (ngModelChange)="phone.set($event)" required />
            <span class="muted">We send a 6-digit code by SMS.</span>
          </div>
          <button class="btn btn--block" type="submit" [disabled]="busy() || !phone().trim()">
            {{ busy() ? 'Sending…' : 'Send code' }}
          </button>
        </form>
      } @else {
        <form class="card" (ngSubmit)="verify()" novalidate>
          <p class="muted">Code sent to {{ phone() }}. It works for 5 minutes.</p>
          <div class="field">
            <label for="code">6-digit code</label>
            <input id="code" name="code" class="code-input" type="text" inputmode="numeric" maxlength="6"
                   autocomplete="one-time-code" [ngModel]="code()" (ngModelChange)="code.set($event)" required />
          </div>
          <button class="btn btn--block" type="submit" [disabled]="busy() || code().trim().length !== 6">
            {{ busy() ? 'Checking…' : 'Sign in' }}
          </button>
          <p class="center" style="padding: 12px 0 0">
            <button class="btn btn--link" type="button" (click)="back()">Change number</button>
            <button class="btn btn--link" type="button" [disabled]="busy() || wait() > 0" (click)="sendCode()">
              {{ wait() > 0 ? 'Send again in ' + wait() + 's' : 'Send a new code' }}
            </button>
          </p>
        </form>
      }
    </div>
  `,
})
export class LoginPage implements OnDestroy {
  private readonly api = inject(ShopApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly phone = signal('');
  readonly code = signal('');
  readonly step = signal<'phone' | 'code'>('phone');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly wait = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  sendCode(): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.requestCode(this.phone().trim()).subscribe({
      next: (sent) => {
        this.busy.set(false);
        this.code.set('');
        this.step.set('code');
        this.countdown(sent.resend_after_seconds);
      },
      error: (e) => {
        this.busy.set(false);
        const retry = retryAfterSeconds(e);
        if (retry) this.countdown(retry);
        this.error.set(messageFor(e));
      },
    });
  }

  verify(): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.verifyCode(this.phone().trim(), this.code().trim()).subscribe({
      next: (session) => {
        this.auth.setSession(session);
        void this.router.navigateByUrl(safeRedirect(this.route.snapshot.queryParamMap.get('redirect')));
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(messageFor(e));
        if (codeOf(e) === 'code_locked') this.code.set('');
      },
    });
  }

  back(): void {
    this.step.set('phone');
    this.error.set(null);
  }

  private countdown(seconds: number): void {
    if (this.timer) clearInterval(this.timer);
    this.wait.set(seconds);
    this.timer = setInterval(() => {
      this.wait.update((v) => Math.max(0, v - 1));
      if (this.wait() === 0 && this.timer) clearInterval(this.timer);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
