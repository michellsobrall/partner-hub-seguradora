-- ============================================================
-- V6__auth_users_and_roles.sql
-- Sprint 06: Autenticação JWT & Controle de Acesso por Perfil (RBAC)
-- ============================================================

CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(180) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'BROKER')),
    broker_id UUID REFERENCES brokers(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_broker_id ON app_users(broker_id);

-- Atualiza versão do sistema nos metadados (colunas de V1__init.sql)
UPDATE system_metadata
SET system_version = '1.6.0',
    environment = 'sprint_06_auth_jwt_rbac'
WHERE id = 'partnerhub_core';
