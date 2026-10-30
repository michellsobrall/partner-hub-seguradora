# Partner Hub — SaaS de Gestão de Comissionamento de Planos de Saúde

Plataforma corporativa completa para automação de onboarding de corretores parceiros (PF/PJ), contratos digitais com assinatura *Click-to-Sign* (`SHA-256`), motor automatizado de cálculo de comissões (Agenciamento e Recorrência), liquidação financeira via API do Asaas (`Pix`/`TED`) com trava fiscal de `NFS-e`, controle de estornos (*Clawback*), migração legada via RPA (`Python + Playwright POM + Pandas`), Portal do Corretor, Autenticação `JWT + RBAC` e Motor de E-mails Transacionais (`SMTP / SendGrid`).

---

## Arquitetura & Stack Tecnológica

| Camada | Tecnologia | Porta Padrão |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons | `http://localhost:5173` |
| **Backend API** | Java 17 LTS, Spring Boot 3.2.5, Spring Security 6 (JWT), JavaMail, Spring Data JPA, Flyway, OpenPDF | `http://localhost:8080` |
| **Banco de Dados** | PostgreSQL 15 Alpine | `localhost:5432` |
| **PGAdmin 4** | Interface Web de Administração PostgreSQL | `http://localhost:5050` |
| **RPA / ETL** | Python 3.11+, Playwright (Page Object Model), Pandas | CLI / API REST |

---

## Como Executar Todo o Ecossistema (Docker Compose)

Na raiz do projeto, execute:

```powershell
docker compose up -d --build
```

Acesse no navegador:
- **Aplicação Web (Partner Hub):** `http://localhost:5173`
- **Health Check Backend:** `http://localhost:8080/api/v1/health`

---

## Credenciais de Acesso (JWT + RBAC)

| Perfil (Role) | E-mail | Senha | Escopo de Acesso |
| :--- | :--- | :--- | :--- |
| **`ROLE_ADMIN`** | `admin@partnerhub.com.br` | `Admin@123` | Visão completa do Backoffice (Sprints 00 a 07) |
| **`ROLE_BROKER` (PJ)** | `contato@primebeneficios.com.br` | `Partner@123` | Portal do Corretor isolado (Prime Corretora PJ) |
| **`ROLE_BROKER` (PF)** | `mariana.albuquerque@corretorparceiro.com.br` | `Partner@123` | Portal do Corretor isolado (Mariana Costa PF) |

---

## Como Ativar Chaves Reais (Asaas API v3 & E-mails SMTP/SendGrid)

Basta editar o arquivo `.env` na raiz do projeto (que é ignorado pelo Git por segurança):

1. **Pagamentos Reais via Asaas (`Pix`/`TED`):**
   - Preencha `ASAAS_API_KEY=$aact_...` no arquivo `.env`.
   - O `AsaasGatewayClient` muda automaticamente do modo Sandbox Simulado para chamadas reais em `POST /v3/transfers`.
2. **Disparo Real de E-mails (`SMTP` ou `SendGrid`):**
   - **SendGrid API:** Preencha `SENDGRID_API_KEY=SG.xxxx` no `.env`.
   - **SMTP (Gmail / AWS SES / Office365):** Preencha `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME` e `MAIL_PASSWORD` no `.env`.
   - E-mails são disparados automaticamente quando **um contrato de corretor é aprovado** (`CONTRACT_APPROVED`), quando **faltam 3 dias para o envio da NFS-e** (`NFSE_DEADLINE_3_DAYS`) e quando **um Pix/TED é confirmado pelo Asaas** (`ASAAS_PAYOUT_CONFIRMED`).

---

## Módulos Entregues (Sprints 00 a 07)

- **Sprint 00 (`docs/sprints/sprint_00.md`):** Fundação Monorepo, Docker Compose, Flyway `V1` e Telemetria em Tempo Real.
- **Sprint 01 (`docs/sprints/sprint_01.md`):** Onboarding PF/PJ, Upload Documental, Geração de Contrato em PDF e Assinatura Digital *Click-to-Sign* (`SHA-256`).
- **Sprint 02 (`docs/sprints/sprint_02.md`):** Motor de Comissionamento (`@Scheduled`), Regras de Agenciamento/Recorrência e Importador CSV de Vendas/Vidas Ativas.
- **Sprint 03 (`docs/sprints/sprint_03.md`):** Gestão Financeira, Liquidação em Lote via Asaas (`Pix`/`TED`), Trava Fiscal `NFS-e` para PJ e Controle de *Clawback*.
- **Sprint 04 (`docs/sprints/sprint_04.md`):** Migração Automatizada RPA (`Python + Playwright Headless POM + Pandas`) e Ingestão via API REST.
- **Sprint 05 (`docs/sprints/sprint_05.md`):** Portal Executivo do Corretor (Dashboard de Ganhos, Faturas Projetadas, Exportação PDF/Excel, Central de Alertas e Manutenção Bancária/Pix).
- **Sprint 06 (`docs/sprints/sprint_06.md`):** Autenticação Stateless via JWT (`HMAC-SHA256`), Criptografia `BCrypt` e Controle de Acesso Baseado em Papéis (`ROLE_ADMIN` vs `ROLE_BROKER`).
- **Sprint 07 (`docs/sprints/sprint_07.md`):** Integração Chave Real Asaas v3 (`.env`) e Motor de E-mails Transacionais (`SMTP / SendGrid`) com alertas automáticos de Contrato Aprovado e Prazo de 3 Dias de NFS-e.
