// Shared auth types used by both backend and frontend

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  sub: string;       // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}
