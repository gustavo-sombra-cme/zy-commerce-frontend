import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { authorizationInterceptor } from './core/http/authorization.interceptor';
import { correlationIdInterceptor } from './core/http/correlation-id.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { sessionTokenStorageProvider } from './core/auth/token-storage.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({
        paramsInheritanceStrategy: 'always'
      })
    ),
    provideHttpClient(withInterceptors([authorizationInterceptor, correlationIdInterceptor])),
    provideAppInitializer(() => inject(RuntimeConfigService).load()),
    sessionTokenStorageProvider,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]
};
