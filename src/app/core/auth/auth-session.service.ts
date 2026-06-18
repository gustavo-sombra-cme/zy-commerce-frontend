import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { AuthApiClient } from './auth-api.client';
import { AuthUser, LoginRequest, RegisterRequest, RegisterResult } from './auth.models';
import { TOKEN_STORAGE } from './token-storage.provider';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private readonly authApi = inject(AuthApiClient);
  private readonly tokenStorage = inject(TOKEN_STORAGE);
  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly hasStoredToken = signal(Boolean(this.tokenStorage.getAccessToken()));
  private readonly currentUserLoading = signal(false);
  private readonly currentAuthError = signal<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isCurrentUserLoading = this.currentUserLoading.asReadonly();
  readonly authError = this.currentAuthError.asReadonly();
  readonly isAuthenticated = computed(() => this.hasStoredToken());

  login(request: LoginRequest): Observable<AuthUser> {
    this.currentAuthError.set(null);

    return this.authApi.login(request).pipe(
      tap((result) => this.acceptAccessToken(result.accessToken)),
      switchMap(() => this.loadCurrentUser()),
      catchError((error: unknown) => {
        this.currentAuthError.set(this.toLoginMessage(error));
        return throwError(() => error);
      })
    );
  }

  register(request: RegisterRequest): Observable<RegisterResult> {
    this.currentAuthError.set(null);

    return this.authApi.register(request).pipe(
      catchError((error: unknown) => {
        this.currentAuthError.set(this.toRegisterMessage(error));
        return throwError(() => error);
      })
    );
  }

  ensureCurrentUser(): Observable<AuthUser> {
    const user = this.currentUser();

    if (user && this.hasAccessToken()) {
      return of(user);
    }

    if (!this.hasAccessToken()) {
      return throwError(() => new Error('Authentication is required.'));
    }

    return this.loadCurrentUser();
  }

  loadCurrentUser(): Observable<AuthUser> {
    this.currentUserLoading.set(true);
    this.currentAuthError.set(null);

    return this.authApi.getCurrentUser().pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.hasStoredToken.set(true);
      }),
      catchError((error: unknown) => {
        if (this.isUnauthorized(error)) {
          this.clearSession();
        }

        this.currentAuthError.set(this.toSessionMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.currentUserLoading.set(false))
    );
  }

  hasAccessToken(): boolean {
    return Boolean(this.tokenStorage.getAccessToken());
  }

  clearSession(): void {
    this.tokenStorage.clearAccessToken();
    this.currentUser.set(null);
    this.hasStoredToken.set(false);
    this.currentAuthError.set(null);
  }

  logout(): void {
    this.clearSession();
  }

  private acceptAccessToken(accessToken: string): void {
    this.tokenStorage.setAccessToken(accessToken);
    this.hasStoredToken.set(true);
  }

  private isUnauthorized(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private toLoginMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
      return 'Email or password is incorrect.';
    }

    return this.toBaseAuthMessage(error);
  }

  private toRegisterMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'An account with that email may already exist.';
    }

    return this.toBaseAuthMessage(error);
  }

  private toSessionMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
      return 'Your session is no longer valid. Please sign in again.';
    }

    return this.toBaseAuthMessage(error);
  }

  private toBaseAuthMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Something went wrong. Please try again.';
    }

    if (error.status === 0) {
      return 'Unable to reach the server. Please check your connection.';
    }

    if (error.status === 400) {
      return 'Please check your information and try again.';
    }

    if (error.status === 409) {
      return 'An account with that email may already exist.';
    }

    return 'Authentication failed. Please try again.';
  }
}
