# SPRINT 04: Migração Automatizada (RPA em Python + Playwright + Pandas)

> **Status Atual:** 🟢 Concluída (Done)  
> **Início:** 29/10/2026  
> **Conclusão:** 29/10/2026  
> **Objetivo:** Viabilizar a extração automatizada de corretores e regras de comissionamento a partir de portais legados de operadoras utilizando **Python + Playwright (Page Object Model)** em modo headless, higienização de dados com **Pandas** (remoção de duplicatas, normalização de CPF/CNPJ, telefone e moeda) e ingestão autenticada via API REST (`POST /api/v1/rpa/ingest`) no Backend Spring Boot.

---

## 📋 BACKLOG DA SPRINT 04

### 1. Robô Python + Playwright (Page Object Model) & Higienização Pandas (`/rpa`)
- [x] **TASK-401:** Criação do Portal Legado Simulado (`rpa/mock_legacy_portal/legacy_portal.html`) contendo tela de autenticação e tabelas HTML com dados legados reais (incluindo registros duplicados, CPF/CNPJ com formatação inconsistente e percentuais com símbolos monetários/textuais para exercitar a limpeza via Pandas).
- [x] **TASK-402:** Implementação das classes Page Object Model (POM) em `rpa/pages/`:
  - `login_page.py`: Autenticação resiliente com espera explícita de sessão e validação de token/cookie.
  - `brokers_legacy_page.py`: Extração estruturada da tabela legada de corretores e contas bancárias.
  - `rules_legacy_page.py`: Extração estruturada da tabela legada de regras e vigências de comissão.
- [x] **TASK-403:** Implementação do pipeline de higienização com **Pandas** (`rpa/scripts/sanitizer.py`):
  - Remoção de linhas duplicadas (`drop_duplicates` por CPF/CNPJ e código de regra).
  - Normalização de CPF/CNPJ (remoção de pontuação espúria e validação de dígitos).
  - Padronização de percentuais, datas de vigência e códigos bancários.
- [x] **TASK-404:** Implementação do cliente de ingestão HTTP (`rpa/scripts/ingestor.py`) com retentativas exponenciais (`tenacity`) e cabeçalho de autenticação `X-RPA-Token`, além do orquestrador `rpa/scripts/run_migration.py`.

### 2. Banco de Dados & Backend Spring Boot 3 (API de Ingestão RPA & Auditoria)
- [x] **TASK-405:** Criação da migração Flyway `V5__rpa_migration_jobs.sql`:
  - Tabela `rpa_migration_jobs` para rastrear execuções do robô (`job_code`, `source_portal`, `trigger_mode`, `raw_brokers_count`, `raw_rules_count`, `duplicates_removed`, `brokers_ingested`, `rules_ingested`, `duration_ms`, `status`, `execution_log`, `executed_at`).
- [x] **TASK-406:** Criação da Entidade `RpaMigrationJob`, Repositório, DTOs de Ingestão (`RpaIngestPayloadDto`, `RpaMigrationJobDto`, `RpaSummaryDto`), `RpaMigrationService` e `RpaMigrationController` (`/api/v1/rpa`):
  - `POST /api/v1/rpa/ingest`: Endpoint REST autenticado que recebe o lote higienizado pelo Python/Pandas e persiste corretores, contas bancárias, contratos e regras de comissão de forma idempotente.
  - `POST /api/v1/rpa/trigger-pipeline`: Disparo sob demanda pela interface web para demonstrar a extração, higienização e ingestão de dados legados em tempo real.
  - `GET /api/v1/rpa/jobs` e `GET /api/v1/rpa/summary`: Telemetria e histórico de lotes migrados pelo RPA.

### 3. Frontend (React + TypeScript + Tailwind CSS)
- [x] **TASK-407:** Criação do módulo `RpaModule.tsx` (Central de Comando RPA & Migração Legada):
  - Visualização das 4 etapas do pipeline (`Playwright POM Headless` → `Web Scraping DOM` → `Pandas Data Cleaning` → `Spring Boot API Ingest`).
  - Comparativo antes/depois (Dado Bruto do Sistema Legado vs. Dado Higienizado pelo Pandas).
  - Botão **Executar Pipeline RPA Agora** e console de logs de execução em tempo real.
- [x] **TASK-408:** Habilitação do item **Migração RPA (Sprint 04)** no `Sidebar.tsx` e `App.tsx`.

---

## 🎯 DEFINIÇÃO DE PRONTO (DoD - Definition of Done)

1. [x] Arquitetura Page Object Model (POM) completa em `/rpa/pages` e scripts Pandas em `/rpa/scripts`.
2. [x] Migração `V5__rpa_migration_jobs.sql` aplicada automaticamente pelo Flyway.
3. [x] Endpoint `POST /api/v1/rpa/ingest` recebendo payload higienizado e criando corretores e regras no PostgreSQL.
4. [x] Painel de Migração RPA no Frontend exibindo telemetria, comparativo de higienização Pandas e logs de execução.
