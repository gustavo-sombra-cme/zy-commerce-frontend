import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { RegisterPageComponent } from './register-page.component';

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let authSession: {
    authError: ReturnType<typeof signal<string | null>>;
    register: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authSession = {
      authError: signal<string | null>(null),
      register: vi.fn(() => of({ id: 'user-1', email: 'buyer@example.com' }))
    };

    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        {
          provide: AuthSessionService,
          useValue: authSession
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPageComponent);
  });

  it('does not submit invalid register forms', () => {
    fixture.componentInstance.submit();

    expect(authSession.register).not.toHaveBeenCalled();
  });

  it('registers and returns the user to login', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.form.setValue({
      displayName: 'Buyer',
      email: 'buyer@example.com',
      password: 'secret-password'
    });
    fixture.componentInstance.submit();

    expect(authSession.register).toHaveBeenCalledWith({
      displayName: 'Buyer',
      email: 'buyer@example.com',
      password: 'secret-password'
    });
    expect(navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: {
        registered: '1'
      }
    });
  });
});
