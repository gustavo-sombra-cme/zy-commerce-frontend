import { Injectable } from '@angular/core';

import { TokenStorage } from './token-storage.provider';

const ACCESS_TOKEN_KEY = 'zy-commerce.access-token';

@Injectable()
export class SessionTokenStorageService implements TokenStorage {
  getAccessToken(): string | null {
    return this.withSessionStorage((storage) => storage.getItem(ACCESS_TOKEN_KEY));
  }

  setAccessToken(accessToken: string): void {
    this.withSessionStorage((storage) => {
      storage.setItem(ACCESS_TOKEN_KEY, accessToken);
      return undefined;
    });
  }

  clearAccessToken(): void {
    this.withSessionStorage((storage) => {
      storage.removeItem(ACCESS_TOKEN_KEY);
      return undefined;
    });
  }

  private withSessionStorage<T>(operation: (storage: Storage) => T): T | null {
    try {
      if (!globalThis.sessionStorage) {
        return null;
      }

      return operation(globalThis.sessionStorage);
    } catch {
      return null;
    }
  }
}
