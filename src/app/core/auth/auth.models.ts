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
  readonly userId?: string;
  readonly email: string;
  readonly displayName?: string;
  readonly role?: string | null;
  readonly roles?: string | readonly string[] | null;
  readonly claims?: AuthClaims | null;
}

export interface AuthClaim {
  readonly type?: string | null;
  readonly name?: string | null;
  readonly value?: unknown;
}

export type AuthClaims = readonly AuthClaim[] | Record<string, unknown>;

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (isAdminRole(user.role)) {
    return true;
  }

  if (typeof user.roles === 'string') {
    return isAdminRole(user.roles);
  }

  if (Array.isArray(user.roles) && user.roles.some((role) => isAdminRole(role))) {
    return true;
  }

  return hasAdminClaim(user.claims);
}

function hasAdminClaim(claims: AuthClaims | null | undefined): boolean {
  if (!claims) {
    return false;
  }

  if (Array.isArray(claims)) {
    return claims.some((claim) => {
      const key = `${claim.type ?? claim.name ?? ''}`.toLowerCase();
      return isAdminRole(claim.value) || (key.includes('admin') && isTruthyClaimValue(claim.value));
    });
  }

  return Object.entries(claims).some(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    return isAdminRole(value) || (normalizedKey.includes('admin') && isTruthyClaimValue(value));
  });
}

function isAdminRole(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'admin';
}

function isTruthyClaimValue(value: unknown): boolean {
  if (value === true) {
    return true;
  }

  return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

export interface LoginResult {
  readonly accessToken: string;
}

export interface RegisterResult {
  readonly id?: string;
  readonly email?: string;
  readonly displayName?: string;
}
