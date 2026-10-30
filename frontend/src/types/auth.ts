export type UserRole = 'ADMIN' | 'BROKER';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSessionDto {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  brokerId?: string | null;
  brokerName?: string | null;
  brokerDocument?: string | null;
  authenticatedAt: string;
}

export interface DemoAccountDto {
  label: string;
  description: string;
  email: string;
  password: string;
  role: UserRole;
  brokerId?: string | null;
}

