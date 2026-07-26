import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { UserApi } from '../../core/api/user.api';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-register-page',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UserApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly passwordVisible = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  /** Reactive password strength: 0 = none, 1 = weak, 2 = good, 3 = strong */
  readonly passwordStrength = computed(() => {
    const pw = this.form.get('password')?.value ?? '';
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return score;
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

    this.api.customerRegister(this.form.getRawValue()).subscribe({
      next: (res) => {
        if (!res.data?.userId) {
          this.error.set(res.message ?? 'Registration failed');
          this.submitting.set(false);
          return;
        }
        this.success.set(true);
        this.submitting.set(false);
        setTimeout(() => this.router.navigateByUrl('/login'), 1500);
      },
      error: () => {
        this.error.set('Registration failed. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
