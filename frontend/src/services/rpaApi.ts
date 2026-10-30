import { RpaMigrationJobDto, RpaSummaryDto } from '@/types/rpa';

import { API_BASE_URL } from '@/services/api';

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

export async function fetchRpaSummary(): Promise<RpaSummaryDto> {
  const response = await fetch(`${API_BASE_URL}/rpa/summary`);
  return handleResponse<RpaSummaryDto>(response);
}

export async function fetchRpaJobs(): Promise<RpaMigrationJobDto[]> {
  const response = await fetch(`${API_BASE_URL}/rpa/jobs`);
  return handleResponse<RpaMigrationJobDto[]>(response);
}

export async function triggerRpaPipeline(): Promise<RpaMigrationJobDto> {
  const response = await fetch(`${API_BASE_URL}/rpa/trigger-pipeline`, {
    method: 'POST',
  });
  return handleResponse<RpaMigrationJobDto>(response);
}

