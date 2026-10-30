-- ============================================================
-- V5__rpa_migration_jobs.sql
-- Sprint 04: Migração Automatizada (RPA Python + Playwright + Pandas)
-- ============================================================

CREATE TABLE IF NOT EXISTS rpa_migration_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_code VARCHAR(40) NOT NULL UNIQUE,
    source_portal VARCHAR(150) NOT NULL,
    trigger_mode VARCHAR(40) NOT NULL,
    raw_brokers_count INTEGER NOT NULL DEFAULT 0,
    raw_rules_count INTEGER NOT NULL DEFAULT 0,
    duplicates_removed INTEGER NOT NULL DEFAULT 0,
    brokers_ingested INTEGER NOT NULL DEFAULT 0,
    rules_ingested INTEGER NOT NULL DEFAULT 0,
    duration_ms BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED'
        CHECK (status IN ('COMPLETED', 'PARTIAL', 'FAILED')),
    execution_log TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rpa_migration_jobs_executed_at
    ON rpa_migration_jobs(executed_at DESC);

-- Job histórico inicial demonstrativo
INSERT INTO rpa_migration_jobs (
    id, job_code, source_portal, trigger_mode,
    raw_brokers_count, raw_rules_count, duplicates_removed,
    brokers_ingested, rules_ingested, duration_ms, status, execution_log, executed_at
) VALUES (
    '88888888-8888-8888-8888-888888888801',
    'RPA-JOB-2026-0001',
    'SGP-Saúde Legado v4.2 (Playwright Headless POM)',
    'SCHEDULED_PIPELINE',
    2,
    4,
    0,
    2,
    4,
    1840,
    'COMPLETED',
    '[Playwright POM] Autenticação headless concluída em SGP-Saúde v4.2' || E'\n' ||
    '[Scraper DOM] 2 corretores e 4 regras de comissão extraídos das tabelas HTML' || E'\n' ||
    '[Pandas Sanitizer] Normalização de CPF/CNPJ e formato de moeda concluída (0 duplicatas)' || E'\n' ||
    '[REST Ingestor] POST /api/v1/rpa/ingest processado com HTTP 201 Created.',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
) ON CONFLICT (job_code) DO NOTHING;

