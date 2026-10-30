import {
  BrokerDocumentDto,
  BrokerDto,
  BrokerOnboardingPayload,
  BrokerStatsDto,
  ContractSignPayload,
  DocumentType,
  OnboardingStatus,
} from '@/types/onboarding';

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

export async function fetchBrokers(
  status?: OnboardingStatus | 'ALL',
  search?: string
): Promise<BrokerDto[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') {
    params.set('status', status);
  }
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/brokers${query}`);
  return handleResponse<BrokerDto[]>(response);
}

export async function fetchBrokerStats(): Promise<BrokerStatsDto> {
  const response = await fetch(`${API_BASE_URL}/brokers/stats`);
  return handleResponse<BrokerStatsDto>(response);
}

export async function createBrokerOnboarding(
  payload: BrokerOnboardingPayload
): Promise<BrokerDto> {
  const response = await fetch(`${API_BASE_URL}/brokers/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<BrokerDto>(response);
}

export async function uploadBrokerDocument(
  brokerId: string,
  documentType: DocumentType,
  file: File
): Promise<BrokerDocumentDto> {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/documents`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<BrokerDocumentDto>(response);
}

export async function signBrokerContract(
  brokerId: string,
  payload: ContractSignPayload
): Promise<BrokerDto> {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/contract/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<BrokerDto>(response);
}

export async function updateBrokerStatus(
  brokerId: string,
  status: OnboardingStatus,
  reviewNotes: string
): Promise<BrokerDto> {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reviewNotes }),
  });
  return handleResponse<BrokerDto>(response);
}

export function getContractPdfUrl(brokerId: string): string {
  return `${API_BASE_URL}/brokers/${brokerId}/contract/pdf`;
}

export function getDocumentDownloadUrl(brokerId: string, documentId: string): string {
  return `${API_BASE_URL}/brokers/${brokerId}/documents/${documentId}/download`;
}

