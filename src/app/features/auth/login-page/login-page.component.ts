import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'zy-login-page',
  imports: [PageHeaderComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly registeredMessage = signal(this.route.snapshot.queryParamMap.get('registered') === '1');
  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    this.form.markAllAsTouched();
    this.errorMessage.set(null);

    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.authSession.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl(this.safeReturnUrl());
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set(this.authSession.authError() ?? 'Sign in failed. Please try again.');
      }
    });
  }

  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
      return returnUrl;
    }

    return '/catalog';
  }
}
