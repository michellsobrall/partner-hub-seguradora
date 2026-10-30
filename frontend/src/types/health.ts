export interface HealthDetails {
  schemaStatus?: string;
  schemaVersion?: string;
  databaseProduct?: string;
  databaseVersion?: string;
  schemaEnvironment?: string;
  error?: string;
}

export interface HealthResponse {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  service: string;
  database: 'CONNECTED' | 'DISCONNECTED';
  version: string;
  timestamp: string;
  details: HealthDetails;
}

