import {
  CommissionEntryDto,
  CommissionRuleDto,
  CommissionRulePayload,
  CommissionSummaryDto,
  CommissionType,
  CsvImportBatchDto,
  EngineExecutionResultDto,
} from '@/types/commission';

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

export async function fetchCommissionSummary(): Promise<CommissionSummaryDto> {
  const response = await fetch(`${API_BASE_URL}/commissions/summary`);
  return handleResponse<CommissionSummaryDto>(response);
}

export async function fetchCommissionEntries(
  type?: CommissionType | 'ALL',
  search?: string
): Promise<CommissionEntryDto[]> {
  const params = new URLSearchParams();
  if (type && type !== 'ALL') {
    params.set('type', type);
  }
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/commissions/entries${query}`);
  return handleResponse<CommissionEntryDto[]>(response);
}

export async function fetchCommissionRules(): Promise<CommissionRuleDto[]> {
  const response = await fetch(`${API_BASE_URL}/commissions/rules`);
  return handleResponse<CommissionRuleDto[]>(response);
}

export async function createCommissionRule(
  payload: CommissionRulePayload
): Promise<CommissionRuleDto> {
  const response = await fetch(`${API_BASE_URL}/commissions/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<CommissionRuleDto>(response);
}

export async function toggleCommissionRule(id: string): Promise<CommissionRuleDto> {
  const response = await fetch(`${API_BASE_URL}/commissions/rules/${id}/toggle`, {
    method: 'PATCH',
  });
  return handleResponse<CommissionRuleDto>(response);
}

export async function uploadSalesCsv(
  file: File,
  referenceMonth?: string
): Promise<CsvImportBatchDto> {
  const formData = new FormData();
  formData.append('file', file);
  if (referenceMonth) {
    formData.append('referenceMonth', referenceMonth);
  }

  const response = await fetch(`${API_BASE_URL}/commissions/imports/csv`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<CsvImportBatchDto>(response);
}

export async function fetchCsvImportBatches(): Promise<CsvImportBatchDto[]> {
  const response = await fetch(`${API_BASE_URL}/commissions/imports`);
  return handleResponse<CsvImportBatchDto[]>(response);
}

export async function triggerCalculationEngine(): Promise<EngineExecutionResultDto> {
  const response = await fetch(`${API_BASE_URL}/commissions/engine/run`, {
    method: 'POST',
  });
  return handleResponse<EngineExecutionResultDto>(response);
}

export function getCsvTemplateUrl(): string {
  return `${API_BASE_URL}/commissions/imports/template`;
}

