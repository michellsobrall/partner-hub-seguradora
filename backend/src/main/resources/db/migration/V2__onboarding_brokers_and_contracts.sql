-- ============================================================
-- V2__onboarding_brokers_and_contracts.sql
-- Sprint 01: Módulo de Onboarding, Documentos e Contratos Digitais
-- ============================================================

-- Evolução da tabela de corretores para suportar SUSEP e parecer de aprovação
ALTER TABLE brokers
    ADD COLUMN IF NOT EXISTS susep_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Tabela de Documentos Comprobatórios (Upload no Onboarding)
CREATE TABLE IF NOT EXISTS broker_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    document_type VARCHAR(40) NOT NULL CHECK (document_type IN ('RG_CNH', 'ADDRESS_PROOF', 'SOCIAL_CONTRACT')),
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    file_content BYTEA NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broker_documents_broker_id ON broker_documents(broker_id);

-- Tabela de Contratos de Parceria e Auditoria Click-to-Sign
CREATE TABLE IF NOT EXISTS broker_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL UNIQUE REFERENCES brokers(id) ON DELETE CASCADE,
    contract_number VARCHAR(40) NOT NULL UNIQUE,
    contract_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    terms_text TEXT NOT NULL,
    document_hash_sha256 VARCHAR(64) NOT NULL,
    signed BOOLEAN NOT NULL DEFAULT FALSE,
    signer_name VARCHAR(255),
    signer_document VARCHAR(20),
    signer_ip VARCHAR(64),
    signer_user_agent TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broker_contracts_broker_id ON broker_contracts(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_contracts_number ON broker_contracts(contract_number);

-- Dados demonstrativos iniciais para inspeção imediata no Backoffice
INSERT INTO brokers (id, person_type, name, trade_name, document_number, email, phone, susep_code, status, review_notes, reviewed_at)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'PJ', ' Prime Corretora de Seguros e Benefícios Ltda', 'Prime Benefícios', '12345678000195', 'contato@primebeneficios.com.br', '11988776655', '202019845', 'APPROVED', 'Documentação societária, SUSEP e conta PJ conferidas e aprovadas.', CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111102', 'PF', 'Mariana Costa Albuquerque', NULL, '39485712890', 'mariana.albuquerque@corretorparceiro.com.br', '21997412365', '102938475', 'UNDER_REVIEW', 'Contrato assinado digitalmente. Aguardando conferência final do comprovante bancário.', NULL)
ON CONFLICT (document_number) DO NOTHING;

INSERT INTO broker_bank_accounts (id, broker_id, bank_code, bank_name, agency, account_number, account_type, pix_key, pix_key_type, is_primary)
VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', '341', 'Itaú Unibanco', '0352', '88412-9', 'CHECKING', '12345678000195', 'CNPJ', TRUE),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', '260', 'Nu Pagamentos (Nubank)', '0001', '9945123-4', 'CHECKING', 'mariana.albuquerque@corretorparceiro.com.br', 'EMAIL', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO broker_contracts (id, broker_id, contract_number, contract_version, terms_text, document_hash_sha256, signed, signer_name, signer_document, signer_ip, signer_user_agent, signed_at)
VALUES
    (
        '33333333-3333-3333-3333-333333333301',
        '11111111-1111-1111-1111-111111111101',
        'PH-CTR-2026-0001',
        '1.0',
        'CONTRATO DE PARCERIA COMERCIAL E INTERMEDIAÇÃO DE PLANOS DE SAÚDE — Celebrado entre PARTNER HUB ADMINISTRADORA E CORRETORA LTDA e PRIME CORRETORA DE SEGUROS E BENEFÍCIOS LTDA (CNPJ 12.345.678/0001-95). Cláusula 1ª: Objeto de distribuição e comissionamento de planos de saúde coletivos e individuais. Cláusula 2ª: Liquidação via Pix/TED na conta vinculada mediante apresentação de NFS-e.',
        '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
        TRUE,
        'Prime Corretora de Seguros e Benefícios Ltda',
        '12345678000195',
        '177.92.44.110',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        '33333333-3333-3333-3333-333333333302',
        '11111111-1111-1111-1111-111111111102',
        'PH-CTR-2026-0002',
        '1.0',
        'CONTRATO DE PARCERIA COMERCIAL E INTERMEDIAÇÃO DE PLANOS DE SAÚDE — Celebrado entre PARTNER HUB ADMINISTRADORA E CORRETORA LTDA e MARIANA COSTA ALBUQUERQUE (CPF 394.857.128-90). Cláusula 1ª: Objeto de distribuição e comissionamento de planos de saúde. Cláusula 2ª: Liquidação via Pix/TED na conta vinculada.',
        '3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1',
        TRUE,
        'Mariana Costa Albuquerque',
        '39485712890',
        '189.40.112.88',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/129.0.0.0',
        CURRENT_TIMESTAMP - INTERVAL '4 hours'
    )
ON CONFLICT (contract_number) DO NOTHING;

