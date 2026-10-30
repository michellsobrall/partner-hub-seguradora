# SPRINT 02: Motor de Comissionamento (O Core)

> **Status Atual:** 🟢 Concluída (Done)  
> **Início:** 29/10/2026  
> **Conclusão:** 29/10/2026  
> **Objetivo:** Construir o coração financeiro do Partner Hub — parametrização de Regras de Remuneração (Agenciamento e Recorrência por Operadora/Produto), importador de arquivos CSV padronizados de vendas/vidas ativas com validação linha a linha, e motor de cálculo automatizado em background (`@Scheduled` + disparo sob demanda) que cruza vendas com regras ativas e gera os lançamentos de comissão.

---

## 📋 BACKLOG DA SPRINT 02

### 1. Banco de Dados & Migração Flyway
- [x] **TASK-201:** Criação da migração `V3__commission_engine.sql`:
  - Tabela `commission_rules`: Regras de remuneração por Operadora (`operator_name`), Produto/Plano (`product_name`), Percentual de Agenciamento (`agency_percentage`), Quantidade de Parcelas de Agenciamento (`agency_installments`), Percentual de Comissão Recorrente Vitalícia (`recurring_percentage`), Vigência (`effective_from`, `effective_to`) e Status (`active`).
  - Tabela `csv_import_batches`: Lotes de importação de vendas CSV (`filename`, `reference_month`, `total_rows`, `valid_rows`, `invalid_rows`, `status`, `error_report`, `created_at`).
  - Tabela `policy_sales`: Vendas e apólices/vidas ativas importadas (`batch_id`, `broker_id`, `proposal_number`, `operator_name`, `product_name`, `beneficiary_name`, `lives_count`, `monthly_premium`, `installment_number`, `reference_month`, `calculation_status`).
  - Tabela `commission_entries`: Extrato analítico de comissões apuradas pelo motor (`broker_id`, `sale_id`, `rule_id`, `reference_month`, `commission_type` [`AGENCY` | `RECURRING`], `base_amount`, `applied_percentage`, `commission_amount`, `status` [`CALCULATED` | `APPROVED_FOR_PAYMENT` | `PAID`]).
  - Dados iniciais (Seeds) de regras de operadoras (Bradesco Saúde, SulAmérica, Amil, Unimed) e vendas de exemplo já calculadas.

### 2. Backend (Spring Boot 3 - Regras, Importação CSV e Motor em Background)
- [x] **TASK-202:** Habilitação de `@EnableScheduling` no `PartnerHubApplication` para processamento periódico em background.
- [x] **TASK-203:** Criação das Entidades JPA (`CommissionRule`, `CsvImportBatch`, `PolicySale`, `CommissionEntry`), Enums (`CommissionType`, `SaleCalculationStatus`, `CommissionEntryStatus`, `BatchImportStatus`) e Repositórios Spring Data JPA.
- [x] **TASK-204:** Criação do `CommissionEngineService`:
  - CRUD e ativação/inativação de Regras de Remuneração.
  - Parser e validador de arquivo CSV de vendas/vidas ativas (valida CPF/CNPJ do corretor, existência na base, formato de valor, número da parcela e quantidade de vidas, gerando relatório de inconsistências linha a linha).
  - Motor de Cálculo de Comissões (`@Scheduled(fixedDelay = 30000)` + trigger manual `POST /api/v1/commissions/engine/run`):
    - Localiza vendas `PENDING` de corretores aprovados.
    - Cruza `operator_name` + `product_name` com a regra ativa vigente.
    - Se `installment_number <= agency_installments`, aplica o percentual de **Agenciamento (`AGENCY`)**; caso contrário (ou cumulativamente conforme regra), aplica a **Comissão Recorrente (`RECURRING`)** sobre o prêmio mensal das vidas ativas.
    - Persiste os lançamentos em `commission_entries` de forma idempotente.
- [x] **TASK-205:** Criação do `CommissionController` (`/api/v1/commissions`):
  - `GET /api/v1/commissions/summary`: KPIs consolidados do motor (Volume de Prêmios, Total Comissões Apuradas, Agenciamento vs. Recorrência, Vendas Pendentes de Cálculo).
  - `GET /api/v1/commissions/rules` & `POST /api/v1/commissions/rules` & `PATCH /api/v1/commissions/rules/{id}/toggle`: Gestão de regras.
  - `POST /api/v1/commissions/imports/csv`: Upload e processamento de arquivo CSV padronizado.
  - `GET /api/v1/commissions/imports/template`: Download do modelo CSV oficial para preenchimento.
  - `GET /api/v1/commissions/imports`: Histórico de lotes CSV importados e relatórios de inconsistências.
  - `POST /api/v1/commissions/engine/run`: Execução imediata do motor de apuração.
  - `GET /api/v1/commissions/entries`: Listagem analítica das comissões apuradas por corretor, competência e tipo.

### 3. Frontend (React + TypeScript + Tailwind CSS)
- [x] **TASK-206:** Criação dos tipos e cliente HTTP (`frontend/src/types/commission.ts` e `frontend/src/services/commissionApi.ts`).
- [x] **TASK-207:** Criação do módulo `CommissionModule.tsx` dividido em 3 visões integradas:
  - **1. Extrato & Motor de Apuração:** Cards executivos (Prêmio Bruto, Total Comissões, Agenciamento, Recorrência), botão para disparar o Motor de Cálculo em tempo real e tabela analítica de comissões apuradas.
  - **2. Regras de Remuneração:** Formulário e catálogo de regras por Operadora e Produto (percentual de agenciamento, limite de parcelas e percentual de recorrência vitalícia).
  - **3. Importador CSV de Vendas/Vidas Ativas:** Botão para baixar o modelo `.csv` padrão, área de upload do CSV, feedback imediato de linhas válidas vs. inconsistentes e histórico de lotes importados.
- [x] **TASK-208:** Habilitação do item **Motor de Comissões (Sprint 02)** no `Sidebar.tsx` e `App.tsx`.

---

## 🎯 DEFINIÇÃO DE PRONTO (DoD - Definition of Done)

1. [x] Migração `V3__commission_engine.sql` aplicada automaticamente pelo Flyway.
2. [x] Cadastro e listagem de Regras de Remuneração (Agenciamento e Recorrência) funcionando.
3. [x] Importação de arquivo CSV validando schema, reportando inconsistências e gravando vendas válidas.
4. [x] Serviço em background (`@Scheduled` e trigger sob demanda) cruzando Vendas vs. Regras e gerando lançamentos de comissão exatos.
5. [x] Interface do Motor de Comissões integrada e responsiva no Frontend.
