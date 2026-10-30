export interface RpaSummaryDto {
  totalJobsExecuted: number;
  totalRawExtracted: number;
  totalDuplicatesRemoved: number;
  totalBrokersIngested: number;
  totalRulesIngested: number;
}

export interface RpaMigrationJobDto {
  id: string;
  jobCode: string;
  sourcePortal: string;
  triggerMode: string;
  rawBrokersCount: number;
  rawRulesCount: number;
  duplicatesRemoved: number;
  brokersIngested: number;
  rulesIngested: number;
  durationMs: number;
  status: string;
  executionLog: string;
  executedAt: string;
}

