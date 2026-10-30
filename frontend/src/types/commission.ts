export type CommissionType = 'AGENCY' | 'RECURRING';
export type CommissionEntryStatus = 'CALCULATED' | 'APPROVED_FOR_PAYMENT' | 'PAID';
export type BatchImportStatus = 'PROCESSED' | 'PARTIAL' | 'FAILED';

export interface CommissionSummaryDto {
  totalBasePremium: number;
  totalCommissionAmount: number;
  totalAgencyAmount: number;
  totalRecurringAmount: number;
  totalEntries: number;
  activeLivesCount: number;
  pendingSalesCount: number;
  activeRulesCount: number;
}

export interface CommissionRuleDto {
  id: string;
  ruleCode: string;
  operatorName: string;
  productName: string;
  agencyPercentage: number;
  agencyInstallments: number;
  recurringPercentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  createdAt: string;
}

export interface CommissionRulePayload {
  ruleCode: string;
  operatorName: string;
  productName: string;
  agencyPercentage: number;
  agencyInstallments: number;
  recurringPercentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface CsvImportBatchDto {
  id: string;
  filename: string;
  referenceMonth: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: BatchImportStatus;
  errorReport?: string;
  createdAt: string;
}

export interface CommissionEntryDto {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerDocument: string;
  proposalNumber: string;
  beneficiaryName: string;
  operatorName: string;
  productName: string;
  ruleCode: string;
  referenceMonth: string;
  commissionType: CommissionType;
  installmentNumber: number;
  livesCount: number;
  baseAmount: number;
  appliedPercentage: number;
  commissionAmount: number;
  status: CommissionEntryStatus;
  calculatedAt: string;
}

export interface EngineExecutionResultDto {
  processedSales: number;
  calculatedEntries: number;
  unmatchedSales: number;
  generatedAmount: number;
  executedAt: string;
}

