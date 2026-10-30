-- ============================================================
-- V3__commission_engine.sql
-- Sprint 02: Motor de Comissionamento (Regras, Importação CSV e Apuração)
-- ============================================================

-- 1. Tabela de Regras de Remuneração (Agenciamento e Recorrência por Operadora/Produto)
CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(40) NOT NULL UNIQUE,
    operator_name VARCHAR(120) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    agency_percentage NUMERIC(5,2) NOT NULL CHECK (agency_percentage >= 0),
    agency_installments INTEGER NOT NULL DEFAULT 1 CHECK (agency_installments >= 1),
    recurring_percentage NUMERIC(5,2) NOT NULL CHECK (recurring_percentage >= 0),
    effective_from DATE NOT NULL,
    effective_to DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_operator_product
    ON commission_rules(operator_name, product_name, active);

-- 2. Tabela de Lotes de Importação CSV de Vendas e Vidas Ativas
CREATE TABLE IF NOT EXISTS csv_import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    reference_month VARCHAR(7) NOT NULL, -- formato YYYY-MM
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    invalid_rows INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PROCESSED', 'PARTIAL', 'FAILED')),
    error_report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Vendas / Apólices e Vidas Ativas Importadas
CREATE TABLE IF NOT EXISTS policy_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES csv_import_batches(id) ON DELETE SET NULL,
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    proposal_number VARCHAR(60) NOT NULL,
    operator_name VARCHAR(120) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    lives_count INTEGER NOT NULL CHECK (lives_count >= 1),
    monthly_premium NUMERIC(14,2) NOT NULL CHECK (monthly_premium > 0),
    installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
    reference_month VARCHAR(7) NOT NULL, -- formato YYYY-MM
    calculation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (calculation_status IN ('PENDING', 'CALCULATED', 'NO_MATCHING_RULE')),
    calculation_notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proposal_number, installment_number, reference_month)
);

CREATE INDEX IF NOT EXISTS idx_policy_sales_status ON policy_sales(calculation_status);
CREATE INDEX IF NOT EXISTS idx_policy_sales_broker ON policy_sales(broker_id);

-- 4. Tabela de Lançamentos de Comissão Apurados (Extrato do Motor)
CREATE TABLE IF NOT EXISTS commission_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES policy_sales(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES commission_rules(id) ON DELETE RESTRICT,
    reference_month VARCHAR(7) NOT NULL,
    commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('AGENCY', 'RECURRING')),
    installment_number INTEGER NOT NULL,
    lives_count INTEGER NOT NULL,
    base_amount NUMERIC(14,2) NOT NULL,
    applied_percentage NUMERIC(5,2) NOT NULL,
    commission_amount NUMERIC(14,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CALCULATED'
        CHECK (status IN ('CALCULATED', 'APPROVED_FOR_PAYMENT', 'PAID')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commission_entries_broker ON commission_entries(broker_id);
CREATE INDEX IF NOT EXISTS idx_commission_entries_month ON commission_entries(reference_month);

-- ============================================================
-- DADOS DEMONSTRATIVOS INICIAIS (SEEDS SPRINT 02)
-- ============================================================

INSERT INTO commission_rules (
    id, rule_code, operator_name, product_name,
    agency_percentage, agency_installments, recurring_percentage,
    effective_from, effective_to, active
) VALUES
    ('44444444-4444-4444-4444-444444444401', 'REG-BRAD-PME-01', 'Bradesco Saúde', 'Saúde Top Nacional PME', 200.00, 1, 5.00, '2026-01-01', NULL, TRUE),
    ('44444444-4444-4444-4444-444444444402', 'REG-SULA-EXA-02', 'SulAmérica', 'Exato Empresarial', 150.00, 2, 4.50, '2026-01-01', NULL, TRUE),
    ('44444444-4444-4444-4444-444444444403', 'REG-AMIL-S450-03', 'Amil', 'Amil S450 Coletivo', 180.00, 1, 4.00, '2026-01-01', NULL, TRUE),
    ('44444444-4444-4444-4444-444444444404', 'REG-UNIM-CLASS-04', 'Unimed Nacional', 'Clássico Adesão PF', 120.00, 1, 3.50, '2026-01-01', NULL, TRUE)
ON CONFLICT (rule_code) DO NOTHING;

INSERT INTO csv_import_batches (
    id, filename, reference_month, total_rows, valid_rows, invalid_rows, status, error_report
) VALUES (
    '55555555-5555-5555-5555-555555555501',
    'faturamento_operadoras_2026_10.csv',
    '2026-10',
    4,
    4,
    0,
    'PROCESSED',
    'Importação concluída sem inconsistências.'
) ON CONFLICT (id) DO NOTHING;

-- Inserimos 4 vendas iniciais como PENDING para que o Motor (@Scheduled) as processe automaticamente ao subir!
INSERT INTO policy_sales (
    id, batch_id, broker_id, proposal_number, operator_name, product_name,
    beneficiary_name, lives_count, monthly_premium, installment_number,
    reference_month, calculation_status
) VALUES
    (
        '66666666-6666-6666-6666-666666666601',
        '55555555-5555-5555-5555-555555555501',
        '11111111-1111-1111-1111-111111111101',
        'PROP-2026-9001',
        'Bradesco Saúde',
        'Saúde Top Nacional PME',
        'TechSolutions Engenharia Ltda',
        12,
        14800.00,
        1,
        '2026-10',
        'PENDING'
    ),
    (
        '66666666-6666-6666-6666-666666666602',
        '55555555-5555-5555-5555-555555555501',
        '11111111-1111-1111-1111-111111111101',
        'PROP-2026-8410',
        'SulAmérica',
        'Exato Empresarial',
        'Grupo Horizonte Logística S.A.',
        28,
        32500.00,
        6,
        '2026-10',
        'PENDING'
    ),
    (
        '66666666-6666-6666-6666-666666666603',
        '55555555-5555-5555-5555-555555555501',
        '11111111-1111-1111-1111-111111111102',
        'PROP-2026-9104',
        'Amil',
        'Amil S450 Coletivo',
        'Clínica Médica Santa Clara Ltda',
        7,
        8900.00,
        1,
        '2026-10',
        'PENDING'
    ),
    (
        '66666666-6666-6666-6666-666666666604',
        '55555555-5555-5555-5555-555555555501',
        '11111111-1111-1111-1111-111111111102',
        'PROP-2026-7721',
        'Unimed Nacional',
        'Clássico Adesão PF',
        'Roberto Almeida Vasconcelos',
        3,
        3450.00,
        4,
        '2026-10',
        'PENDING'
    )
ON CONFLICT (proposal_number, installment_number, reference_month) DO NOTHING;

