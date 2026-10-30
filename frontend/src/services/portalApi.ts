import { BankAccountDto, BrokerDto } from '@/types/onboarding';
import { BrokerPortalDashboardDto } from '@/types/portal';

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

export async function fetchBrokerPortalDashboard(
  brokerId: string
): Promise<BrokerPortalDashboardDto> {
  const response = await fetch(
    `${API_BASE_URL}/portal/brokers/${brokerId}/dashboard`
  );
  return handleResponse<BrokerPortalDashboardDto>(response);
}

export async function updateBrokerPortalBankAccount(
  brokerId: string,
  payload: BankAccountDto
): Promise<BrokerDto> {
  const response = await fetch(
    `${API_BASE_URL}/portal/brokers/${brokerId}/bank-account`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<BrokerDto>(response);
}

export function getBrokerStatementPdfUrl(brokerId: string): string {
  return `${API_BASE_URL}/portal/brokers/${brokerId}/statement/pdf`;
}

export function getBrokerStatementCsvUrl(brokerId: string): string {
  return `${API_BASE_URL}/portal/brokers/${brokerId}/statement/csv`;
}

