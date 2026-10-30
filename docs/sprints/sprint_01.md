# SPRINT 01: Módulo de Onboarding e Contratos

> **Status Atual:** 🟢 Concluída (Done)  
> **Início:** 29/10/2026  
> **Conclusão:** 29/10/2026  
> **Objetivo:** Permitir que corretores parceiros (PF e PJ) realizem o cadastro completo (dados cadastrais, bancários e upload documental), visualizem e baixem o Contrato de Parceria em PDF dinâmico, assinem eletronicamente via *click-to-sign* com trilha de auditoria (IP, User-Agent, Timestamp UTC e Hash SHA-256), e disponibilizar o Painel Administrativo de Aprovação (`PENDENTE`, `EM_ANALISE`, `APROVADO`, `REJEITADO`).

---

## 📋 BACKLOG DA SPRINT 01

### 1. Banco de Dados & Migração Flyway
- [x] **TASK-101:** Criação da migração `V2__onboarding_brokers_and_contracts.sql`:
  - Tabela `brokers` (Tipo PF/PJ, Nome/Razão Social, CPF/CNPJ único, E-mail, Telefone, SUSEP opcional, Dados Bancários e Pix, Status do Workflow, Observações de Análise).
  - Tabela `broker_documents` (Metadados e armazenamento seguro dos documentos enviados: `RG_CNH`, `COMPROVANTE_ENDERECO`, `CONTRATO_SOCIAL`).
  - Tabela `broker_contracts` (Termos do contrato gerado, Hash SHA-256 de integridade, Status de Assinatura, IP do Signatário, User-Agent, Data/Hora UTC da assinatura).

### 2. Backend (Spring Boot 3 - API de Onboarding, PDF e Auditoria)
- [x] **TASK-102:** Adição da dependência `openpdf` (`com.github.librepdf:openpdf`) no `pom.xml` para geração nativa de contratos em PDF.
- [x] **TASK-103:** Criação das Entidades JPA (`Broker`, `BrokerDocument`, `BrokerContract`), Enums (`PersonType`, `OnboardingStatus`, `PixKeyType`, `DocumentType`) e Repositórios Spring Data JPA.
- [x] **TASK-104:** Criação do serviço de geração de Contrato em PDF dinâmico + cálculo de Hash Criptográfico `SHA-256` (`ContractService`).
- [x] **TASK-105:** Criação do `BrokerOnboardingService` e `BrokerOnboardingController` (`/api/v1/brokers`):
  - `POST /api/v1/brokers/onboarding`: Cadastro completo do corretor + geração automática da minuta contratual.
  - `POST /api/v1/brokers/{id}/documents`: Upload de documentos comprobatórios (RG/CNH, Comprovante de Endereço, Contrato Social).
  - `GET /api/v1/brokers/{id}/documents/{docId}/download`: Download/visualização de documento enviado.
  - `GET /api/v1/brokers/{id}/contract/pdf`: Download do Contrato de Parceria em PDF dinâmico (com dados do corretor e carimbo de assinatura digital quando assinado).
  - `POST /api/v1/brokers/{id}/contract/sign`: Aceite digital (*click-to-sign*) capturando IP real (`X-Forwarded-For` / `RemoteAddr`), `User-Agent`, `Instant.now()` UTC e validando Hash SHA-256.
  - `PATCH /api/v1/brokers/{id}/status`: Workflow administrativo de aprovação (`PENDENTE`, `EM_ANALISE`, `APROVADO`, `REJEITADO`) com justificativa/notas.
  - `GET /api/v1/brokers`: Listagem com filtro por status e busca textual + métricas de resumo.

### 3. Frontend (React + TypeScript + Tailwind CSS)
- [x] **TASK-106:** Criação da jornada de **Onboarding de Corretor (Wizard em 3 Etapas)**:
  - **Etapa 1:** Dados Cadastrais (PF/PJ com máscaras de CPF/CNPJ e telefone) + Dados Bancários e Chave Pix + Upload de Documentos.
  - **Etapa 2:** Pré-visualização da Minuta do Contrato, download do PDF e Aceite Digital (*Click-to-Sign*) com exibição do Hash SHA-256, IP e carimbo de tempo.
  - **Etapa 3:** Comprovante de protocolo de adesão e acompanhamento do status.
- [x] **TASK-107:** Criação do **Painel Administrativo de Aprovação (Backoffice)**:
  - Indicadores no topo (Total, Pendentes, Em Análise, Aprovados, Rejeitados).
  - Tabela minimalista com filtro de status, drawer/modal de inspeção detalhada do corretor (dados bancários, documentos anexados, trilha de auditoria do contrato assinado e botão para baixar o PDF assinado).
  - Ações rápidas de workflow: *Iniciar Análise*, *Aprovar Parceiro* ou *Rejeitar com Parecer*.
- [x] **TASK-108:** Atualização do `Sidebar.tsx` e `App.tsx` permitindo alternar de forma fluida entre o módulo **Status da Plataforma (Sprint 00)** e **Onboarding & Contratos (Sprint 01)**.

---

## 🎯 DEFINIÇÃO DE PRONTO (DoD - Definition of Done)

1. [x] Migração `V2__onboarding_brokers_and_contracts.sql` aplicada automaticamente pelo Flyway sem erros.
2. [x] Cadastro de corretor PF/PJ persistindo dados bancários e documentos no PostgreSQL.
3. [x] Geração de Contrato em PDF dinâmico funcionando e download disponível.
4. [x] Assinatura digital (*click-to-sign*) gravando IP, User-Agent, Data/Hora UTC e Hash SHA-256.
5. [x] Painel de workflow administrativo alterando os status (`PENDENTE`, `EM_ANALISE`, `APROVADO`, `REJEITADO`) em tempo real.
