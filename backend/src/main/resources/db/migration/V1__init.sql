-- ============================================================
-- V1__init.sql - Partner Hub Schema Inicial
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Metadados / Validação de Sistema
CREATE TABLE IF NOT EXISTS system_metadata (
    id VARCHAR(64) PRIMARY KEY,
    system_version VARCHAR(20) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    initialized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL
);

INSERT INTO system_metadata (id, system_version, environment, status)
VALUES ('partnerhub_core', '1.0.0', 'setup', 'OPERATIONAL')
ON CONFLICT (id) DO NOTHING;

-- Tabela de Corretores (Preparação para Sprint 01)
CREATE TABLE IF NOT EXISTS brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_type VARCHAR(10) NOT NULL CHECK (person_type IN ('PF', 'PJ')),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Dados Bancários dos Corretores
CREATE TABLE IF NOT EXISTS broker_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    bank_code VARCHAR(10) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    agency VARCHAR(20) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CHECKING', 'SAVINGS')),
    pix_key VARCHAR(100),
    pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brokers_document ON brokers(document_number);
CREATE INDEX IF NOT EXISTS idx_brokers_status ON brokers(status);
CREATE INDEX IF NOT EXISTS idx_broker_bank_accounts_broker_id ON broker_bank_accounts(broker_id);
