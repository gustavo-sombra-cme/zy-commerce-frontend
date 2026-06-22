import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TOKEN_STORAGE } from '../auth/token-storage.provider';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { isAllowedRequestUrl } from './http-origin.util';

export const authorizationInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStorage = inject(TOKEN_STORAGE);
  const runtimeConfig = inject(RuntimeConfigService).snapshot;
  const accessToken = tokenStorage.getAccessToken();

  if (!accessToken || !isAllowedRequestUrl(request.url, runtimeConfig.authorizationAllowedOrigins)) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  }));
};
