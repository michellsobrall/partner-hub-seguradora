import { HealthResponse } from '@/types/health';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL &&
  String(import.meta.env.VITE_API_BASE_URL).startsWith('http')
    ? String(import.meta.env.VITE_API_BASE_URL)
    : 'http://localhost:8080/api/v1';

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
