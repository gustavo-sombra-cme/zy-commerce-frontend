import { InjectionToken, Provider } from '@angular/core';

import { SessionTokenStorageService } from './session-token-storage.service';

export interface TokenStorage {
  getAccessToken(): string | null;
  setAccessToken(accessToken: string): void;
  clearAccessToken(): void;
}

export const TOKEN_STORAGE = new InjectionToken<TokenStorage>('TOKEN_STORAGE');

export const sessionTokenStorageProvider: Provider = {
  provide: TOKEN_STORAGE,
  useClass: SessionTokenStorageService
};
