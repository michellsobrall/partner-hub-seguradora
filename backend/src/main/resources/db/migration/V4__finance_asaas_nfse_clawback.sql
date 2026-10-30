-- ============================================================
-- V4__finance_asaas_nfse_clawback.sql
-- Sprint 03: Gestão Financeira, Asaas API v3, Upload NFS-e e Clawback
-- ============================================================

-- 1. Tabela de Notas Fiscais de Serviços Eletrônicas (NFS-e) de Corretores PJ
CREATE TABLE IF NOT EXISTS broker_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    reference_month VARCHAR(7) NOT NULL, -- formato YYYY-MM
    invoice_number VARCHAR(60) NOT NULL,
    verification_code VARCHAR(60),
    gross_amount NUMERIC(14,2) NOT NULL CHECK (gross_amount > 0),
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    file_content BYTEA NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW'
        CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    review_notes VARCHAR(255),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (broker_id, reference_month, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_broker_invoices_broker_month
    ON broker_invoices(broker_id, reference_month);

-- 2. Tabela de Controle de Estornos / Clawback (Inadimplência e Cancelamento em Carência)
CREATE TABLE IF NOT EXISTS clawback_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    proposal_number VARCHAR(60) NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_month VARCHAR(7) NOT NULL,
    debit_amount NUMERIC(14,2) NOT NULL CHECK (debit_amount > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_DEDUCTION'
        CHECK (status IN ('PENDING_DEDUCTION', 'DEDUCTED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clawback_entries_broker_month
    ON clawback_entries(broker_id, reference_month);

-- 3. Tabela de Fechamentos e Liquidações Financeiras via Asaas (Pix / TED)
CREATE TABLE IF NOT EXISTS payout_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    reference_month VARCHAR(7) NOT NULL,
    gross_commission NUMERIC(14,2) NOT NULL DEFAULT 0,
    clawback_deduction NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_payout_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    transfer_method VARCHAR(20) NOT NULL DEFAULT 'PIX'
        CHECK (transfer_method IN ('PIX', 'TED')),
    invoice_id UUID REFERENCES broker_invoices(id) ON DELETE SET NULL,
    asaas_transfer_id VARCHAR(100) UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'AWAITING_INVOICE'
        CHECK (status IN ('AWAITING_INVOICE', 'READY_TO_PAY', 'PROCESSING_ASAAS', 'PAID', 'FAILED')),
    asaas_receipt_url VARCHAR(255),
    webhook_event_log TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (broker_id, reference_month)
);

CREATE INDEX IF NOT EXISTS idx_payout_settlements_month_status
    ON payout_settlements(reference_month, status);

-- ============================================================
-- DADOS DEMONSTRATIVOS INICIAIS (SEEDS SPRINT 03)
-- ============================================================

-- Exemplo de Clawback/Estorno por cancelamento em carência na competência 2026-10
INSERT INTO clawback_entries (
    id, broker_id, proposal_number, beneficiary_name, reason, reference_month, debit_amount, status
) VALUES (
    '77777777-7777-7777-7777-777777777701',
    '11111111-1111-1111-1111-111111111101',
    'PROP-2026-8102',
    'Construtora Vanguarda Sul Ltda',
    'Cancelamento de apólice antes de 90 dias (período de carência contratual) — Estorno de 1ª parcela.',
    '2026-10',
    1250.00,
    'PENDING_DEDUCTION'
) ON CONFLICT (id) DO NOTHING;

