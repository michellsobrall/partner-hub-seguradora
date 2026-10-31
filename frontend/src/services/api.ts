import { HealthResponse } from '@/types/health';

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (
    envUrl &&
    String(envUrl).startsWith('http') &&
    !String(envUrl).includes('localhost')
  ) {
    return String(envUrl);
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;
  }
  return 'http://localhost:8080/api/v1';
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function fetchSystemHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao comunicar com a API (${response.status})`);
  }

  return response.json();
}
