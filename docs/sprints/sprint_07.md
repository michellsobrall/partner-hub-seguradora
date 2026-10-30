# SPRINT 07: Integrações Reais (Asaas API Key & E-mails Automáticos SMTP/SendGrid)

> **Status da Sprint:** 🟢 Concluída (Done)  
> **Objetivo:** Deixar preparado o chaveamento automático para a API Real do Asaas v3 via `.env` (`ASAAS_API_KEY`) e implementar o motor de e-mails transacionais via SMTP / SendGrid para aprovação de contratos e aviso de 3 dias para envio de NFS-e.

---

## 1. ENTREGÁVEIS E CHECKLIST DE TAREFAS

### 1.1. Variáveis de Ambiente & Docker Compose
- [x] Criar arquivo `.env` local (ignorado pelo Git) e atualizar `.env.example` e `backend/.env.example` com as chaves do Asaas (`ASAAS_API_KEY`, `ASAAS_API_URL`, `ASAAS_WEBHOOK_TOKEN`) e de E-mail (`SENDGRID_API_KEY`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`).
- [x] Mapear todas as variáveis de integração no serviço `backend` do `docker-compose.yml` e no `application.yml`.

### 1.2. Banco de Dados & Migração Flyway
- [x] Criar migração `V7__email_notifications_and_integrations.sql` com a tabela `email_notification_logs` e registros demonstrativos iniciais.

### 1.3. Backend (Asaas Live v3 + Motor de E-mails SMTP/SendGrid)
- [x] Adicionar `spring-boot-starter-mail` ao `backend/pom.xml`.
- [x] Evoluir `AsaasGatewayClient.java` com suporte ao payload oficial `/v3/transfers` (`operationType: PIX/TED`), status de integração (`LIVE_ASAAS_API_V3` vs `SANDBOX_SIMULATOR`) e validação de `asaas-access-token` no webhook.
- [x] Criar `EmailNotificationLog`, `EmailNotificationLogRepository` e `EmailNotificationService`:
  - Disparo real via **SendGrid REST API v3** (se `SENDGRID_API_KEY` estiver preenchida no `.env`).
  - Disparo real via **SMTP / JavaMailSender** (se `MAIL_USERNAME` e `MAIL_PASSWORD` estiverem preenchidos no `.env`).
  - Persistência de auditoria em `email_notification_logs` para todos os disparos.
- [x] Conectar gatilho automático ao aprovar corretor no `BrokerOnboardingService` (`CONTRACT_APPROVED`).
- [x] Implementar rotina `@Scheduled` + endpoint manual `POST /api/v1/finance/notifications/nfse-reminders` para disparar e-mail de alerta quando faltar 3 dias para o envio da NFS-e (`NFSE_DEADLINE_3_DAYS`).

### 1.4. Frontend (Painel de Integrações & Disparo de Alertas de E-mail)
- [x] Exibir status de conexão Asaas (`ASAAS_API_KEY`) e Motor de E-mail (`SMTP / SendGrid`) no módulo Financeiro (`FinanceModule.tsx`).
- [x] Adicionar aba de auditoria de **E-mails & Alertas (`SMTP / SendGrid`)** e botão **`Disparar Alerta NFS-e (Prazo 3 Dias)`**.
