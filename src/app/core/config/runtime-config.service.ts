import { Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { DEFAULT_RUNTIME_CONFIG, RuntimeConfig } from './runtime-config.model';

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private readonly config = signal<RuntimeConfig>(DEFAULT_RUNTIME_CONFIG);

  readonly config$ = this.config.asReadonly();

  get snapshot(): RuntimeConfig {
    return this.config();
  }

  async load(): Promise<void> {
    try {
      const response = await globalThis.fetch(environment.runtimeConfigPath, {
        cache: 'no-store'
      });

      if (!response.ok) {
        return;
      }

      const runtimeConfig = await response.json() as Partial<RuntimeConfig>;
      this.config.set({
        ...DEFAULT_RUNTIME_CONFIG,
        ...runtimeConfig,
        authorizationAllowedOrigins: runtimeConfig.authorizationAllowedOrigins?.length
          ? runtimeConfig.authorizationAllowedOrigins
          : DEFAULT_RUNTIME_CONFIG.authorizationAllowedOrigins
      });
    } catch {
      this.config.set(DEFAULT_RUNTIME_CONFIG);
    }
  }
}
