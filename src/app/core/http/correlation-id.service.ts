import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CorrelationIdService {
  private readonly activeCorrelationId = signal<string | null>(null);

  readonly currentCorrelationId = this.activeCorrelationId.asReadonly();

  getOrCreate(): string {
    const existing = this.activeCorrelationId();

    if (existing) {
      return existing;
    }

    return this.startInteraction();
  }

  startInteraction(): string {
    const correlationId = this.createCorrelationId();
    this.activeCorrelationId.set(correlationId);
    return correlationId;
  }

  clear(): void {
    this.activeCorrelationId.set(null);
  }

  private createCorrelationId(): string {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
