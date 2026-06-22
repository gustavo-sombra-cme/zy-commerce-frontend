import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { RuntimeConfigService } from '../config/runtime-config.service';
import { CorrelationIdService } from './correlation-id.service';
import { isAllowedRequestUrl } from './http-origin.util';

export const correlationIdInterceptor: HttpInterceptorFn = (request, next) => {
  const runtimeConfig = inject(RuntimeConfigService).snapshot;
  const correlationIdService = inject(CorrelationIdService);
  const headerName = runtimeConfig.correlationHeaderName;

  if (request.headers.has(headerName) || !isAllowedRequestUrl(request.url, runtimeConfig.authorizationAllowedOrigins)) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      [headerName]: correlationIdService.getOrCreate()
    }
  }));
};
