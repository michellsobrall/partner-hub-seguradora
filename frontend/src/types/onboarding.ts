export type PersonType = 'PF' | 'PJ';
export type OnboardingStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type AccountType = 'CHECKING' | 'SAVINGS';
export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
export type DocumentType = 'RG_CNH' | 'ADDRESS_PROOF' | 'SOCIAL_CONTRACT';

export interface BankAccountDto {
  id?: string;
  bankCode: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: AccountType;
  pixKey?: string;
  pixKeyType?: PixKeyType;
}

export interface BrokerDocumentDto {
  id: string;
  documentType: DocumentType;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  sha256Hash: string;
  uploadedAt: string;
}

export interface BrokerContractDto {
  id: string;
  contractNumber: string;
  contractVersion: string;
  termsText: string;
  documentHashSha256: string;
  signed: boolean;
  signerName?: string;
  signerDocument?: string;
  signerIp?: string;
  signerUserAgent?: string;
  signedAt?: string;
  createdAt: string;
}

export interface BrokerDto {
  id: string;
  personType: PersonType;
  name: string;
  tradeName?: string;
  documentNumber: string;
  email: string;
  phone: string;
  susepCode?: string;
  status: OnboardingStatus;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  bankAccount?: BankAccountDto;
  documents: BrokerDocumentDto[];
  contract?: BrokerContractDto;
}

export interface BrokerStatsDto {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export interface BrokerOnboardingPayload {
  personType: PersonType;
  name: string;
  tradeName?: string;
  documentNumber: string;
  email: string;
  phone: string;
  susepCode?: string;
  bankAccount: BankAccountDto;
}

export interface ContractSignPayload {
  acceptedTerms: boolean;
  signerName: string;
  signerDocument: string;
}

