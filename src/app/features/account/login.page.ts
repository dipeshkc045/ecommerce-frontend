import { ChangeDetectionStrategy, Component, inject, signal, AfterViewInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { UserApi } from '../../core/api/user.api';
import { GoogleAuthService } from '../../core/auth/google-auth.service';
import { OAuthApi } from '../../core/api/oauth.api';

@Component({
  standalone: true,
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UserApi);
  private readonly oauthApi = inject(OAuthApi);
  private readonly auth = inject(AuthService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly googleAvailable = signal(true);
  readonly googleLoading = signal(true);
  readonly googleReady = signal(false);

  readonly form = this.fb.nonNullable.group({
    emailOrPhone: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  async ngAfterViewInit(): Promise<void> {
    const initialized = await this.googleAuth.initialize((response) => this.handleGoogleLogin(response));
    if (!initialized) {
      this.googleAvailable.set(false);
      this.googleLoading.set(false);
      this.googleReady.set(false);
      return;
    }

    const rendered = await this.googleAuth.renderButton('google-btn-container', 'signin_with');
    this.googleAvailable.set(rendered);
    this.googleLoading.set(false);
    this.googleReady.set(rendered);
    if (rendered) {
      await this.googleAuth.promptOneTap();
    }
  }

  private handleGoogleLogin(response: { credential: string }): void {
    this.submitting.set(true);
    this.error.set(null);

    this.oauthApi.loginWithGoogle(response.credential).subscribe({
      next: (res) => {
        const token = res.data?.accessToken;
        if (!token) {
          this.error.set(res.message ?? 'Google login failed');
          this.submitting.set(false);
          return;
        }

        this.auth.setAccessToken(token);
        this.navigateToRedirect();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Google authentication failed');
        this.submitting.set(false);
      },
    });
  }

  private navigateToRedirect(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? undefined;
    this.router.navigateByUrl(redirect && redirect.startsWith('/') ? redirect : '/products');
  }

  togglePassword(): void {
    this.passwordVisible.update((v) => !v);
  }

  showError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    this.api.customerLogin(this.form.getRawValue()).subscribe({
      next: (res) => {
        const token = res.data?.accessToken;
        if (!token) {
          this.error.set(res.message ?? 'Login failed');
          this.submitting.set(false);
          return;
        }

        this.auth.setAccessToken(token);
        this.navigateToRedirect();
      },
      error: () => {
        this.error.set('Invalid credentials. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
