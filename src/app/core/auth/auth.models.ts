export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
}

export interface AuthUser {
  readonly id?: string;
  readonly email: string;
  readonly displayName?: string;
}

export interface LoginResult {
  readonly accessToken: string;
}

export interface RegisterResult {
  readonly id?: string;
  readonly email?: string;
  readonly displayName?: string;
}
