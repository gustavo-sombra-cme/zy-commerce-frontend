import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let authSession: {
    authError: ReturnType<typeof signal<string | null>>;
    login: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authSession = {
      authError: signal<string | null>(null),
      login: vi.fn(() => of({ id: 'user-1', email: 'buyer@example.com' }))
    };

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        {
          provide: AuthSessionService,
          useValue: authSession
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                returnUrl: '/orders'
              })
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
  });

  it('does not submit invalid login forms', () => {
    fixture.componentInstance.submit();

    expect(authSession.login).not.toHaveBeenCalled();
  });

  it('logs in and navigates to the return URL', () => {
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.form.setValue({
      email: 'buyer@example.com',
      password: 'secret-password'
    });
    fixture.componentInstance.submit();

    expect(authSession.login).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      password: 'secret-password'
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/orders');
  });
});
