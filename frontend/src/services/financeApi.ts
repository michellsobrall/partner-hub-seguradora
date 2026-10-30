import {
  BrokerInvoiceDto,
  ClawbackPayload,
  ClawbackResponseDto,
  FinanceSummaryDto,
  InvoiceStatus,
  PayoutSettlementDto,
} from '@/types/finance';

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

export async function fetchFinanceSummary(): Promise<FinanceSummaryDto> {
  const response = await fetch(`${API_BASE_URL}/finance/summary`);
  return handleResponse<FinanceSummaryDto>(response);
}

export async function fetchSettlements(): Promise<PayoutSettlementDto[]> {
  const response = await fetch(`${API_BASE_URL}/finance/settlements`);
  return handleResponse<PayoutSettlementDto[]>(response);
}

export async function triggerBatchPayout(): Promise<PayoutSettlementDto[]> {
  const response = await fetch(`${API_BASE_URL}/finance/settlements/pay-batch`, {
    method: 'POST',
  });
  return handleResponse<PayoutSettlementDto[]>(response);
}

export async function triggerSinglePayout(
  settlementId: string
): Promise<PayoutSettlementDto> {
  const response = await fetch(
    `${API_BASE_URL}/finance/settlements/${settlementId}/pay`,
    {
      method: 'POST',
    }
  );
  return handleResponse<PayoutSettlementDto>(response);
}

export async function simulateAsaasWebhook(
  asaasTransferId: string,
  event: 'TRANSFER_COMPLETED' | 'TRANSFER_FAILED',
  failureReason?: string
): Promise<PayoutSettlementDto> {
  const response = await fetch(`${API_BASE_URL}/finance/webhooks/asaas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asaasTransferId, event, failureReason }),
  });
  return handleResponse<PayoutSettlementDto>(response);
}

export async function fetchInvoices(): Promise<BrokerInvoiceDto[]> {
  const response = await fetch(`${API_BASE_URL}/finance/invoices`);
  return handleResponse<BrokerInvoiceDto[]>(response);
}

export async function uploadBrokerInvoice(params: {
  brokerId: string;
  referenceMonth: string;
  invoiceNumber: string;
  verificationCode?: string;
  grossAmount: number;
  file: File;
}): Promise<BrokerInvoiceDto> {
  const formData = new FormData();
  formData.append('brokerId', params.brokerId);
  formData.append('referenceMonth', params.referenceMonth);
  formData.append('invoiceNumber', params.invoiceNumber);
  if (params.verificationCode) {
    formData.append('verificationCode', params.verificationCode);
  }
  formData.append('grossAmount', String(params.grossAmount));
  formData.append('file', params.file);

  const response = await fetch(`${API_BASE_URL}/finance/invoices`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<BrokerInvoiceDto>(response);
}

export async function reviewBrokerInvoice(
  invoiceId: string,
  status: InvoiceStatus,
  reviewNotes: string
): Promise<BrokerInvoiceDto> {
  const response = await fetch(`${API_BASE_URL}/finance/invoices/${invoiceId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reviewNotes }),
  });
  return handleResponse<BrokerInvoiceDto>(response);
}

export function getInvoiceDownloadUrl(invoiceId: string): string {
  return `${API_BASE_URL}/finance/invoices/${invoiceId}/download`;
}

export async function fetchClawbacks(): Promise<ClawbackResponseDto[]> {
  const response = await fetch(`${API_BASE_URL}/finance/clawbacks`);
  return handleResponse<ClawbackResponseDto[]>(response);
}

export async function createClawback(
  payload: ClawbackPayload
): Promise<ClawbackResponseDto> {
  const response = await fetch(`${API_BASE_URL}/finance/clawbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<ClawbackResponseDto>(response);
}

export async function cancelClawback(id: string): Promise<ClawbackResponseDto> {
  const response = await fetch(`${API_BASE_URL}/finance/clawbacks/${id}/cancel`, {
    method: 'PATCH',
  });
  return handleResponse<ClawbackResponseDto>(response);
}

