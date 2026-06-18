import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';

import { AuthSessionService } from './auth-session.service';

export const authGuard: CanActivateFn = (_route, state) => evaluateAuth(state);

export const authChildGuard: CanActivateChildFn = (_route, state) => evaluateAuth(state);

function evaluateAuth(state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSession.hasAccessToken()) {
    return loginRedirect(router, state.url);
  }

  if (authSession.user()) {
    return true;
  }

  return authSession.ensureCurrentUser().pipe(
    map(() => true),
    catchError(() => of(loginRedirect(router, state.url)))
  );
}

function loginRedirect(router: Router, returnUrl: string): UrlTree {
  return router.createUrlTree(['/auth/login'], {
    queryParams: {
      returnUrl
    }
  });
}
