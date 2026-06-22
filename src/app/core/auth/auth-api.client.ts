import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from '../config/runtime-config.service';
import { AuthUser, LoginRequest, LoginResult, RegisterRequest, RegisterResult } from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthApiClient {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  login(request: LoginRequest): Observable<LoginResult> {
    return this.http.post<LoginResult>(this.authUsersUrl('login'), request);
  }

  register(request: RegisterRequest): Observable<RegisterResult> {
    return this.http.post<RegisterResult>(this.authUsersUrl('register'), request);
  }

  getCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(this.authUsersUrl('me'));
  }

  private authUsersUrl(path: 'login' | 'register' | 'me'): string {
    return `${this.runtimeConfig.snapshot.apiBaseUrl}/api/auth/users/${path}`;
  }
}
