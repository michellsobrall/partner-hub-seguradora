# SPRINT 03: Gestão Financeira e Automação de Pagamentos (Asaas, NFS-e e Clawback)

> **Status Atual:** 🟢 Concluída (Done)  
> **Início:** 29/10/2026  
> **Conclusão:** 29/10/2026  
> **Objetivo:** Orquestrar o fechamento financeiro de comissões — exigência e validação de Nota Fiscal de Serviços Eletrônica (NFS-e) para corretores PJ (trava fiscal), lançamento e abatimento automático de estornos/clawbacks por inadimplência ou cancelamento precoce, e liquidação em lote via Pix/TED integrada com a API v3 do Asaas (com suporte a Sandbox real + simulador local e Webhook de confirmação `TRANSFER_COMPLETED` / `TRANSFER_FAILED`).

---

## 📋 BACKLOG DA SPRINT 03

### 1. Banco de Dados & Migração Flyway
- [x] **TASK-301:** Criação da migração `V4__finance_asaas_nfse_clawback.sql`:
  - Tabela `broker_invoices`: Notas Fiscais (NFS-e) enviadas pelos corretores PJ por competência (`reference_month`, `invoice_number`, `Verification_code`, `gross_amount`, `original_filename`, `content_type`, `file_size`, `sha256_hash`, `file_content`, `status` [`PENDING_REVIEW` | `APPROVED` | `REJECTED`], `review_notes`).
  - Tabela `clawback_entries`: Lançamentos de estornos/débitos por inadimplência ou cancelamento em carência (`broker_id`, `proposal_number`, `beneficiary_name`, `reason`, `reference_month`, `debit_amount`, `status` [`PENDING_DEDUCTION` | `DEDUCTED` | `CANCELLED`]).
  - Tabela `payout_settlements`: Fechamentos financeiros e transferências Asaas (`broker_id`, `reference_month`, `gross_commission`, `clawback_deduction`, `net_payout_amount`, `transfer_method` [`PIX` | `TED`], `invoice_id`, `asaas_transfer_id`, `asaas_status` [`AWAITING_INVOICE` | `READY_TO_PAY` | `PROCESSING_ASAAS` | `PAID` | `FAILED`], `asaas_receipt_url`, `webhook_event_log`).
  - Dados iniciais (Seeds) de NFS-e, estorno de inadimplência (clawback) para demonstração imediata.

### 2. Backend (Spring Boot 3 - Fechamento Financeiro, Trava Fiscal PJ, Clawback e Asaas API v3)
- [x] **TASK-302:** Criação das Entidades JPA (`BrokerInvoice`, `ClawbackEntry`, `PayoutSettlement`), Enums (`InvoiceStatus`, `ClawbackStatus`, `PayoutStatus`, `TransferMethod`) e Repositórios Spring Data JPA.
- [x] **TASK-303:** Criação do `AsaasGatewayClient`:
  - Integração HTTP com `POST ${ASAAS_API_URL}/transfers` enviando `access_token` quando `ASAAS_API_KEY` estiver preenchida, ou operando em **Modo Sandbox Simulado Inteligente** quando sem chave externa (gerando `asaas_transfer_id` realista ` pay_asaas_pix_...` e comprovante de liquidação).
- [x] **TASK-304:** Criação do `FinanceSettlementService`:
  - Consolidação automática de fechamento por corretor e competência (`grossCommission - clawbacks = netPayoutAmount`).
  - **Regra de Trava Fiscal (PJ):** Bloqueia o disparo para o Asaas caso o corretor seja `PJ` e não possua NFS-e com status `APPROVED` na competência; corretores `PF` ficam `READY_TO_PAY` diretamente.
  - Upload, download e aprovação/rejeição de NFS-e (ao aprovar a NFS-e de um corretor PJ, desbloqueia automaticamente o fechamento para `READY_TO_PAY`).
  - Registro de Clawback/Estorno (recalculando imediatamente o líquido a pagar na competência).
  - Liquidação individual ou em lote via Pix/TED no Asaas (`executeBatchPayout`).
  - Processamento de Webhook do Asaas (`POST /api/v1/finance/webhooks/asaas`: eventos `TRANSFER_COMPLETED` e `TRANSFER_FAILED`).
- [x] **TASK-305:** Criação do `FinanceController` (`/api/v1/finance`):
  - `GET /api/v1/finance/summary`: KPIs financeiros (Bruto Apurado, Total Retido em Clawback, Líquido Liberado, Total Liquidado via Asaas, Bloqueados por NFS-e).
  - `GET /api/v1/finance/settlements` & `POST /api/v1/finance/settlements/consolidate`: Listagem e consolidação de fechamentos.
  - `POST /api/v1/finance/settlements/pay-batch`: Disparo de pagamentos em lote via Pix/TED para o Asaas.
  - `POST /api/v1/finance/webhooks/asaas`: Endpoint receptor de Webhook Asaas (`TRANSFER_COMPLETED` / `TRANSFER_FAILED`).
  - `GET /api/v1/finance/invoices`, `POST /api/v1/finance/invoices` (upload NFS-e), `PATCH /api/v1/finance/invoices/{id}/status`, `GET /api/v1/finance/invoices/{id}/download`.
  - `GET /api/v1/finance/clawbacks`, `POST /api/v1/finance/clawbacks`, `PATCH /api/v1/finance/clawbacks/{id}/cancel`.

### 3. Frontend (React + TypeScript + Tailwind CSS)
- [x] **TASK-306:** Criação dos tipos e cliente HTTP (`frontend/src/types/finance.ts` e `frontend/src/services/financeApi.ts`).
- [x] **TASK-307:** Criação do módulo `FinanceModule.tsx` dividido em 3 visões executivas:
  - **1. Lotes de Pagamento & Asaas (Pix/TED):** KPIs de liquidação, botão **Liquidar Lote Aprovado via Asaas (Pix/TED)**, indicador de Trava Fiscal NFS-e para PJ, abatimento de clawback visível em cada linha e simulador de Webhook Asaas (`TRANSFER_COMPLETED`).
  - **2. Portal de Notas Fiscais (NFS-e PJ):** Upload de XML/PDF da NFS-e pelo corretor PJ + mesa de validação fiscal (Aprovar / Glosar NF) que libera o pagamento automaticamente.
  - **3. Controle de Estornos / Clawback:** Lançamento de débitos por inadimplência ou cancelamento em carência e visualização do abatimento no lote.
- [x] **TASK-308:** Habilitação do item **Financeiro & Asaas (Sprint 03)** no `Sidebar.tsx` e `App.tsx`.

---

## 🎯 DEFINIÇÃO DE PRONTO (DoD - Definition of Done)

1. [x] Migração `V4__finance_asaas_nfse_clawback.sql` aplicada automaticamente pelo Flyway.
2. [x] Regra de bloqueio de pagamento para corretores PJ sem NFS-e aprovada funcionando rigorosamente.
3. [x] Upload e validação de NFS-e desbloqueando o lote financeiro automaticamente.
4. [x] Lançamento de Clawback/Estorno deduzindo o valor líquido do lote do corretor.
5. [x] Disparo de pagamento em lote via Asaas (Pix/TED) e confirmação via Webhook (`TRANSFER_COMPLETED`) atualizando o status para `PAID`.
