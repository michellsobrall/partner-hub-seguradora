# SPRINT 05: Portal do Corretor (Dashboard Executivo, Extratos Exportáveis e Central de Alertas)

> **Status Atual:** 🟢 Concluída (Done)  
> **Início:** 29/10/2026  
> **Conclusão:** 29/10/2026  
> **Objetivo:** Entregar a experiência autoatendimento (*Self-Service Portal*) para o corretor parceiro — com seletor dinâmico de corretor logado, Dashboard Executivo de Ganhos (Ganhos no Mês, Faturas Projetadas de Recorrência, Total Pago no Ano e Saldo Líquido em Aberto), gráficos minimalistas de evolução mensal e carteira por operadora, Central de Alertas inteligentes (prazo limite para upload de NFS-e, notificações de clawback e status de liquidação Asaas), exportação de extrato analítico em **PDF oficial** e **Excel/CSV**, e manutenção do domicílio bancário/Pix.

---

## 📋 BACKLOG DA SPRINT 05

### 1. Backend (Spring Boot 3 - API do Portal do Corretor & Exportação PDF/CSV)
- [x] **TASK-501:** Criação dos DTOs dedicados do Portal do Corretor (`BrokerPortalDashboardDto`, `BrokerAlertDto`, `MonthlyEvolutionPointDto`, `OperatorShareDto`, `BankUpdateRequestDto`).
- [x] **TASK-502:** Criação do `BrokerPortalService`:
  - Cálculo consolidado individualizado por corretor:
    - **Ganhos no Mês Atual** (Bruto e Líquido descontando Clawbacks).
    - **Faturas Projetadas (Próximo Ciclo)** baseadas na carteira recorrente ativa + parcelas remanescentes de agenciamento.
    - **Total Pago no Ano** (liquidações confirmadas ou em processamento via Asaas).
    - **Saldo Líquido em Aberto** aguardando fechamento/NFS-e.
  - Geração dinâmica de **Alertas Inteligentes de Compliance & Financeiro**:
    - Alerta Crítico / Âmbar: *"Envio de NFS-e Pendente — Envie até o dia 05 para inclusão no lote Pix Asaas"* (para corretores PJ com fechamento `AWAITING_INVOICE`).
    - Alerta Informativo / Esmeralda: *"Lote Liberado para Liquidação Pix/TED"* ou *"Pagamento Liquidado via Asaas"*.
    - Alerta de Glosa / Carmim: *"Desconto de Clawback registrado na competência"*.
  - Geração de **Demonstrativo Analítico de Comissões em PDF** (OpenPDF) e **Planilha CSV/Excel** do corretor.
  - Atualização validada de **Dados Bancários e Chave Pix** do corretor (`PUT /api/v1/portal/brokers/{brokerId}/bank-account`).
- [x] **TASK-503:** Criação do `BrokerPortalController` (`/api/v1/portal/brokers/{brokerId}`):
  - `GET /api/v1/portal/brokers/{brokerId}/dashboard`: Retorna métricas, gráficos, alertas, extrato analítico, faturas e dados bancários.
  - `GET /api/v1/portal/brokers/{brokerId}/statement/pdf`: Download do Demonstrativo Oficial de Comissões em PDF.
  - `GET /api/v1/portal/brokers/{brokerId}/statement/csv`: Exportação do Extrato Analítico para Excel (`.csv` UTF-8 com BOM).
  - `PUT /api/v1/portal/brokers/{brokerId}/bank-account`: Atualização de conta bancária e chave Pix com validação imediata.

### 2. Frontend (React + TypeScript + Tailwind CSS)
- [x] **TASK-504:** Criação dos tipos e cliente HTTP (`frontend/src/types/portal.ts` e `frontend/src/services/portalApi.ts`).
- [x] **TASK-505:** Criação do módulo `BrokerPortalModule.tsx`:
  - **Seletor de Visão do Corretor Parceiro** no topo (permite alternar instantaneamente entre qualquer corretor cadastrado/migrado para simular a visão exata daquele parceiro).
  - **Central de Alertas e Lembretes de NFS-e** com atalho direto para envio de Nota Fiscal quando pendente.
  - **4 Cards Executivos:** Ganhos no Mês, Faturas Projetadas (Recorrência), Total Pago no Ano e Saldo Líquido em Aberto.
  - **Gráficos Minimalistas Nativo SVG/Tailwind:** Evolução de Produção/Comissões (6 meses) e Distribuição de Vidas Ativas por Operadora.
  - **Extrato Analítico & Sintético** com botões de exportação **Baixar Demonstrativo PDF** e **Exportar Excel (.CSV)**.
  - **Aba Meu Perfil & Domicílio Bancário (Pix/TED):** Formulário para o corretor atualizar banco, agência, conta e chave Pix com feedback imediato.
- [x] **TASK-506:** Habilitação do item **Portal do Corretor (Sprint 05)** no `Sidebar.tsx` e `App.tsx`, concluindo todos os 6 módulos do ecossistema Partner Hub!

---

## 🎯 DEFINIÇÃO DE PRONTO (DoD - Definition of Done)

1. [x] Dashboard do Corretor exibindo Ganhos no Mês, Faturas Projetadas, Total Pago no Ano e Saldo em Aberto.
2. [x] Gráficos minimalistas de evolução de produção e carteira por operadora renderizados.
3. [x] Sistema de avisos/lembretes de envio de Nota Fiscal (NFS-e) e alertas financeiros ativos.
4. [x] Exportação de extrato de comissões em PDF e Excel/CSV funcionando.
5. [x] Manutenção de dados bancários e chave Pix pelo corretor persistindo no PostgreSQL.
