export interface JWTPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  iat: number;
  exp: number;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem('access_token', accessToken);
  sessionStorage.setItem('refresh_token', refreshToken);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem('access_token');
}

export function clearTokens(): void {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
}

export function getUser(): JWTPayload | null {
  const token = getAccessToken();
  if (!token || isTokenExpired(token)) return null;
  return decodeToken(token);
}
