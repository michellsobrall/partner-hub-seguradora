import { PersonType } from './onboarding';

export type InvoiceStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type ClawbackStatus = 'PENDING_DEDUCTION' | 'DEDUCTED' | 'CANCELLED';
export type PayoutStatus =
  | 'AWAITING_INVOICE'
  | 'READY_TO_PAY'
  | 'PROCESSING_ASAAS'
  | 'PAID'
  | 'FAILED';
export type TransferMethod = 'PIX' | 'TED';

export interface FinanceSummaryDto {
  totalGrossCommission: number;
  totalClawbackDeductions: number;
  totalReadyToPayNet: number;
  totalPaidViaAsaas: number;
  awaitingInvoiceCount: number;
  readyToPayCount: number;
  paidSettlementsCount: number;
  pendingInvoicesCount: number;
}

export interface PayoutSettlementDto {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerDocument: string;
  personType: PersonType;
  bankSummary: string;
  pixSummary: string;
  referenceMonth: string;
  grossCommission: number;
  clawbackDeduction: number;
  netPayoutAmount: number;
  transferMethod: TransferMethod;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceStatus?: InvoiceStatus;
  asaasTransferId?: string;
  status: PayoutStatus;
  asaasReceiptUrl?: string;
  webhookEventLog?: string;
  paidAt?: string;
  updatedAt: string;
}

export interface BrokerInvoiceDto {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerDocument: string;
  referenceMonth: string;
  invoiceNumber: string;
  verificationCode?: string;
  grossAmount: number;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  sha256Hash: string;
  status: InvoiceStatus;
  reviewNotes?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

export interface ClawbackResponseDto {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerDocument: string;
  proposalNumber: string;
  beneficiaryName: string;
  reason: string;
  referenceMonth: string;
  debitAmount: number;
  status: ClawbackStatus;
  createdAt: string;
}

export interface ClawbackPayload {
  brokerId: string;
  proposalNumber: string;
  beneficiaryName: string;
  reason: string;
  referenceMonth: string;
  debitAmount: number;
}


export interface EmailNotificationDto {
  id: string;
  brokerId?: string;
  recipientEmail: string;
  recipientName: string;
  templateCode: string;
  subject: string;
  bodyPreview: string;
  provider: string;
  deliveryStatus: string;
  externalMessageId?: string;
  sentAt: string;
}

export interface IntegrationStatusDto {
  asaasLiveKeyConfigured: boolean;
  asaasMode: string;
  asaasApiUrl: string;
  emailLiveConfigured: boolean;
  emailProvider: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  emailFromAddress: string;
  nfseDeadlineDay: number;
  totalEmailsDispatched: number;
}

export interface IntegrationConfigPayload {
  asaasApiUrl?: string;
  asaasApiKey?: string;
  sendgridApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  emailFromAddress?: string;
  nfseDeadlineDay?: number;
}
