import { ErrorHandler, inject, Injectable } from '@angular/core';

import { AppLoggerService } from '../logging/app-logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(AppLoggerService);

  handleError(error: unknown): void {
    this.logger.error('Unhandled application error.', error);
  }
}
