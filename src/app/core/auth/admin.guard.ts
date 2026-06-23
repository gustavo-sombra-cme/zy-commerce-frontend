import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';

import { AuthSessionService } from './auth-session.service';

export const adminGuard: CanActivateFn = (_route, state) => evaluateAdmin(state);

function evaluateAdmin(state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSession.hasAccessToken()) {
    return loginRedirect(router, state.url);
  }

  if (authSession.user()) {
    return authSession.isAdmin() ? true : adminAccessDenied(router);
  }

  return authSession.ensureCurrentUser().pipe(
    map(() => authSession.isAdmin() ? true : adminAccessDenied(router)),
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

function adminAccessDenied(router: Router): UrlTree {
  return router.createUrlTree(['/admin/access-denied']);
}
