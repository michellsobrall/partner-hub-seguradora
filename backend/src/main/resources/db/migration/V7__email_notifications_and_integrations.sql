-- ============================================================
-- V7__email_notifications_and_integrations.sql
-- Sprint 07: Integrações Reais (Asaas API Key & Motor de E-mails SMTP/SendGrid)
-- ============================================================

CREATE TABLE IF NOT EXISTS email_notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES brokers(id) ON DELETE SET NULL,
    recipient_email VARCHAR(160) NOT NULL,
    recipient_name VARCHAR(180) NOT NULL,
    template_code VARCHAR(60) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_preview TEXT NOT NULL,
    provider VARCHAR(40) NOT NULL,
    delivery_status VARCHAR(40) NOT NULL,
    external_message_id VARCHAR(120),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_broker_id ON email_notification_logs(broker_id);

INSERT INTO email_notification_logs (
    id, broker_id, recipient_email, recipient_name, template_code,
    subject, body_preview, provider, delivery_status, external_message_id, sent_at
) VALUES
    (
        '99999999-9999-9999-9999-999999999901',
        '11111111-1111-1111-1111-111111111101',
        'contato@primebeneficios.com.br',
        'Prime Corretora de Seguros e Benefícios Ltda',
        'CONTRACT_APPROVED',
        '[Partner Hub] Contrato Homologado! Credenciamento Aprovado (PH-CTR-2026-0001)',
        'Parabéns! Seu contrato de parceria PH-CTR-2026-0001 e dados bancários (Itaú Ag 0352 CC 88412-9) foram homologados pela Mesa de Compliance. Seu acesso ao Portal do Corretor já está ativo.',
        'SMTP_SANDBOX_OUTBOX',
        'DELIVERED',
        'msg_ph_approval_0001',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        '99999999-9999-9999-9999-999999999902',
        '11111111-1111-1111-1111-111111111101',
        'contato@primebeneficios.com.br',
        'Prime Corretora de Seguros e Benefícios Ltda',
        'NFSE_DEADLINE_3_DAYS',
        '⚠️ [Partner Hub] Faltam 3 dias para o envio da NFS-e — Liberação de Lote Pix Asaas',
        'Aviso Importante: Seu saldo líquido de comissões está apurado, porém restam 3 dias para o prazo limite fiscal (Dia 05). Realize o upload do PDF/XML da NFS-e no Portal do Corretor para liberação automática no lote Pix/TED.',
        'SMTP_SANDBOX_OUTBOX',
        'DELIVERED',
        'msg_ph_nfse_alert_0002',
        CURRENT_TIMESTAMP - INTERVAL '3 hours'
    )
ON CONFLICT (id) DO NOTHING;

UPDATE system_metadata
SET system_version = '1.7.0',
    environment = 'sprint_07_asaas_and_email_ready'
WHERE id = 'partnerhub_core';

