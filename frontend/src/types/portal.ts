import { CommissionEntryDto } from './commission';
import { ClawbackResponseDto, PayoutSettlementDto } from './finance';
import { BrokerDto } from './onboarding';

export interface BrokerAlertDto {
  id: string;
  severity: 'WARNING' | 'DANGER' | 'SUCCESS' | 'INFO';
  title: string;
  message: string;
  deadlineLabel: string;
  actionType: 'UPLOAD_NFSE' | 'VIEW_STATEMENT' | 'NONE';
}

export interface MonthlyEvolutionPointDto {
  referenceMonth: string;
  label: string;
  agencyAmount: number;
  recurringAmount: number;
  totalAmount: number;
  activeLives: number;
}

export interface OperatorShareDto {
  operatorName: string;
  livesCount: number;
  commissionAmount: number;
  sharePercentage: number;
}

export interface BrokerPortalDashboardDto {
  broker: BrokerDto;
  earningsInCurrentMonth: number;
  projectedNextInvoice: number;
  totalPaidInYear: number;
  openNetBalance: number;
  totalActiveLives: number;
  totalPoliciesCount: number;
  alerts: BrokerAlertDto[];
  monthlyEvolution: MonthlyEvolutionPointDto[];
  operatorBreakdown: OperatorShareDto[];
  entries: CommissionEntryDto[];
  settlements: PayoutSettlementDto[];
  clawbacks: ClawbackResponseDto[];
}

