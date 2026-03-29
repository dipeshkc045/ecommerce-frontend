import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { UserApi } from '../../core/api/user.api';

@Component({
  standalone: true,
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UserApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);

  readonly form = this.fb.nonNullable.group({
    emailOrPhone: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

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
        const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? undefined;
        this.router.navigateByUrl(redirect && redirect.startsWith('/') ? redirect : '/');
      },
      error: () => {
        this.error.set('Invalid credentials. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
