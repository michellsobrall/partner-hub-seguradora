import { API_BASE_URL } from '@/services/api';
import { AuthSessionDto, DemoAccountDto, LoginPayload } from '@/types/auth';

const AUTH_STORAGE_KEY = 'partnerhub_jwt_session_v1';

export function getStoredAuthSession(): AuthSessionDto | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSessionDto;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSessionDto): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthorizationHeader(): Record<string, string> {
  const session = getStoredAuthSession();
  if (!session?.accessToken) {
    return {};
  }
  return {
    Authorization: `Bearer ${session.accessToken}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Erro HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // ignora erro de parse
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function loginWithCredentials(
  payload: LoginPayload
): Promise<AuthSessionDto> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const session = await handleResponse<AuthSessionDto>(response);
  saveAuthSession(session);
  return session;
}

export async function fetchCurrentUser(): Promise<AuthSessionDto> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      ...getAuthorizationHeader(),
    },
  });
  return handleResponse<AuthSessionDto>(response);
}

export async function fetchDemoAccounts(): Promise<DemoAccountDto[]> {
  const response = await fetch(`${API_BASE_URL}/auth/demo-accounts`);
  return handleResponse<DemoAccountDto[]>(response);
}

