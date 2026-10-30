# ESCOPO PRINCIPAL (A BÍBLIA DO PROJETO) - PARTNER HUB

> **Status:** Documento Oficial de Referência (Fonte Única de Verdade)  
> **Versão:** 1.0.0  
> **Papéis:** Tech Lead, Engenheiro de Software Sênior, UI/UX Designer  

---

## 1. VISÃO GERAL DO PRODUTO

O **Partner Hub** é uma plataforma SaaS multitenant projetada para automatizar, orquestrar e gerenciar ponta a ponta o **comissionamento de planos de saúde para corretores parceiros**.

### 1.1. Objetivos Estratégicos
- **Eficiência Operacional:** Eliminar o cálculo manual em planilhas e o risco de inconsistências de cálculo de agenciamento e recorrência.
- **Transparência e Retenção:** Oferecer aos corretores um portal moderno para acompanhamento de produção, faturas e contratação digital.
- **Automação Financeira e Fiscal:** Integrar pagamentos em lote via Asaas (Pix/TED) e validar o envio de Notas Fiscais (PJ).
- **Interoperabilidade:** Extrair dados de sistemas legados de operadoras através de RPA resiliente em Python/Playwright.

---

## 2. STACK TECNOLÓGICA & ARQUITETURA

O ecossistema é desacoplado em serviços com responsabilidades bem definidas, preparados para conteinerização via Docker e posterior deploy em nuvem (AWS / OCI):

| Camada | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Backend** | Java 17+ / 21, Spring Boot 3.x, Spring Data JPA, Spring Security, Flyway | Robustez, tipagem estática forte, ecossistema empresarial maduro para regras de negócio financeiras. |
| **Banco de Dados** | PostgreSQL 15+ | Confiabilidade ACID, suporte nativo a JSONB para regras dinâmicas e alta performance transacional. |
| **Frontend** | React 18+, TypeScript, Vite, Tailwind CSS, Lucide Icons | Performance de build com Vite, tipagem estrita com TS, UI responsiva, minimalista e altamente customizável. |
| **RPA / Scraping** | Python 3.11+, Playwright, Pandas | Automação robusta com Page Object Model (POM), execução headless, facilidade no parsing e tratamento de dados. |
| **Gateway Pagamentos**| Asaas API v3 | Automação de pagamentos em lote (Pix/TED), split e webhooks de liquidação. |
| **Infraestrutura** | Docker, Docker Compose, .env (12-Factor App) | Paridade estrita entre ambientes de desenvolvimento local, homologação e produção cloud. |

---

## 3. DIRETRIZES DE DESIGN (UI/UX)

- **Minimalismo e Clareza:** Interface leve, moderna e focada em dados acionáveis.
- **Espaçamento Generoso (Whitespace):** Respiro visual adequado para evitar poluição visual em tabelas e dashboards financeiros.
- **Paleta de Cores Neutras com Acentos Pontuais:**
  - Base: Tons de cinza e ardósia (`slate-50` a `slate-900`) para estrutura, cartões e tipografia.
  - Primária/Ação: Azul tecnológico sofisticado (`indigo-600` ou `blue-600`) para botões de ação e estados ativos.
  - Semântica: Verde esmeralda para valores aprovados/pagos, âmbar para pendências, e carmim suave para débitos/estornos.
- **Tipografia:** Famílias sans-serif modernas (Inter / Plus Jakarta Sans) com hierarquia de títulos e pesos bem delineados.
- **Micro-interações:** Feedback imediato em ações (toasts, loading spinners, transições suaves de hover).

---

## 4. ESTRUTURA DE PASTAS PADRONIZADA

```text
projeto seguradora/
├── docs/
│   ├── prompt_inicial.md            # Instruções e diretrizes originais
│   ├── escopo_principal.md          # Esta Bíblia do Projeto
│   └── sprints/
│       ├── sprint_00.md             # Setup e Arquitetura Base
│       ├── sprint_01.md             # Onboarding e Contratos
│       ├── sprint_02.md             # Motor de Comissionamento
│       ├── sprint_03.md             # Gestão Financeira e Asaas
│       ├── sprint_04.md             # RPA de Migração
│       ├── sprint_05.md             # Portal do Corretor
│       └── sprint_06.md             # Autenticação JWT e RBAC
├── backend/                         # Aplicação Spring Boot
│   ├── src/
│   ├── pom.xml (ou build.gradle)
│   ├── Dockerfile
│   └── .env.example
├── frontend/                        # Aplicação React + Vite + Tailwind
│   ├── src/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
├── rpa/                             # Automação Python + Playwright
│   ├── pages/                       # Page Object Model
│   ├── scripts/
│   ├── requirements.txt
│   └── .env.example
├── docker-compose.yml               # Orquestração local de serviços
└── README.md
```

---

## 5. REGRA DE OURO E GOVERNANÇA DAS SPRINTS

1. **Documentação Antes de Código:** Toda solicitação de desenvolvimento deve primeiro verificar o `escopo_principal.md`, o status no arquivo `sprint_XX.md` correspondente e atualizar o checklist antes e depois da implementação.
2. **Critérios de Aceite:** Nenhuma tarefa é marcada como `Done` sem estar funcional, testada e com documentação/variáveis de ambiente atualizadas.
3. **Isolamento de Configurações:** Nenhuma credencial ou URL sensível no código-fonte; uso estrito de arquivos `.env` baseados em `.env.example`.

---

## 6. DETALHAMENTO DO ESCOPO POR SPRINTS

### SPRINT 00: Setup e Arquitetura Base
- **Objetivo:** Estabelecer a fundação do monorepo/multiserviço com stack configurada, comunicação de banco e ambiente pronto.
- **Entregáveis:**
  1. Estrutura de diretórios inicial (`/docs`, `/backend`, `/frontend`, `/rpa`).
  2. Setup inicial do Spring Boot com Maven, Spring Web, Spring Data JPA, PostgreSQL Driver, Lombok e Flyway.
  3. Configuração do `docker-compose.yml` para instanciar PostgreSQL localmente e persistência de dados.
  4. Migração Flyway inicial de validação de banco (`V1__init.sql`).
  5. Setup do Frontend com React 18, Vite, TypeScript, Tailwind CSS e configuração de paths/aliases.
  6. Configuração de linting, formatação e `.gitignore` unificado.

---

### SPRINT 01: Módulo de Onboarding e Contratos
- **Objetivo:** Permitir que corretores se cadastrem, submetam dados e documentos e assinem digitalmente o contrato de prestação de serviços.
- **Entregáveis:**
  1. Formulário de onboarding responsivo (Pessoa Física e Pessoa Jurídica):
     - Dados cadastrais (Nome/Razão Social, CPF/CNPJ, E-mail, Telefone).
     - Dados bancários para liquidação (Banco, Agência, Conta, Chave Pix).
     - Upload de documentos (RG/CNH, Comprovante de Endereço, Contrato Social).
  2. Mecanismo de geração de Contrato de Adesão/Prestação em PDF dinâmico com dados preenchidos.
  3. Aceite digital com click-to-sign capturando metadados de auditoria (IP público, User-Agent, carimbo de Data/Hora UTC e Hash SHA-256 do contrato).
  4. Painel administrativo para workflow de aprovação interna (Status: `PENDENTE`, `EM_ANALISE`, `APROVADO`, `REJEITADO`).

---

### SPRINT 02: Motor de Comissionamento (O Core)
- **Objetivo:** Criar o mecanismo automatizado de parametrização e apuração de repasses de comissão por venda e vidas ativas.
- **Entregáveis:**
  1. Modelo de dados e tela de cadastro de **Regras de Remuneração**:
     - Agenciamento (percentual sobre a primeira parcela ou parcelas iniciais).
     - Comissão Recorrente (percentual mensal por vida ativa vinculada).
     - Vinculação com operadora, produto/plano e vigência.
  2. Módulo de importação de arquivo CSV padronizado de vendas e vidas ativas (parsing, validação de schema e relatórios de inconsistência).
  3. Serviço assíncrono em background (Spring Batch / Scheduled Service):
     - Cruzamento automático: Vendas Importadas vs. Regras Ativas do Corretor.
     - Cálculo das parcelas devidas e consolidação em registros de extrato de comissão.

---

### SPRINT 03: Gestão Financeira e Automação de Pagamentos
- **Objetivo:** Integrar os pagamentos com o Asaas, exigir comprovação fiscal de pessoas jurídicas e tratar glosas/estornos.
- **Entregáveis:**
  1. Integração com a API do Asaas (Sandbox / Produção):
     - Criação de transferências/pagamentos em lote via Pix e TED.
     - Webhook para escuta de confirmação de pagamento (`TRANSFER_COMPLETED`, `TRANSFER_FAILED`).
  2. Portal de envio e validação de Nota Fiscal de Serviços Eletrônica (NFS-e) para corretores PJ:
     - Bloqueio de liberação de pagamento caso a NF não esteja enviada e conferida.
  3. Mecanismo de Clawback / Estornos:
     - Lançamento manual ou automatizado de débitos por cancelamento de vidas em período de carência/inadimplência.
     - Desconto automático no próximo lote de fechamento.

---

### SPRINT 04: Migração Automatizada (RPA)
- **Objetivo:** Viabilizar a extração legada de dados de corretores e tabelas de vigência usando automação de navegador resiliente.
- **Entregáveis:**
  1. Projeto em Python configurado com Playwright e arquitetura Page Object Model (POM).
  2. Pipeline de autenticação resiliente com tratamento de sessões e execução headless.
  3. Scrapers para extração de dados cadastrais de corretores e regras de tabelas de comissão.
  4. Script de higienização e validação de dados com Pandas (remoção de duplicatas, normalização de CNPJ/CPF e formato de moeda).
  5. Ingestor via requisições HTTP autenticadas (POST) para a API REST do Spring Boot.

---

### SPRINT 05: Portal do Corretor (Frontend)
- **Objetivo:** Fornecer uma experiência premium e moderna para o corretor consultar sua produção, demonstrativos e pendências.
- **Entregáveis:**
  1. Dashboard executivo do corretor:
     - Cards de métricas: Ganhos no Mês, Faturas Projetadas, Total Pago no Ano, Saldo em Aberto.
     - Gráficos minimalistas de evolução de produção e vidas ativas.
  2. Extrato analítico e sintético de comissões com exportação (PDF/Excel).
  3. Central de Alertas e Notificações (ex.: lembrete de upload de NF com prazo limite para inclusão no lote de pagamento).
  4. Perfil e manutenção de dados bancários com fluxo de validação.


---

### SPRINT 06: Autenticação JWT e Controle de Acesso por Perfil (RBAC)
- **Objetivo:** Implementar segurança corporativa com Spring Security + JWT (Stateless) e controle de acesso baseado em papéis (`ADMIN` vs `BROKER`).
- **Entregáveis:**
  1. Migração Flyway (`V6__auth_users_and_roles.sql`) com tabela `app_users` e vínculo com `brokers(id)`.
  2. Configuração do Spring Security + provedor de token JWT HMAC-SHA256 (`JwtTokenProvider`, `JwtAuthenticationFilter`) e senhas criptografadas com BCrypt.
  3. Endpoints de autenticação (`/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/demo-accounts`).
  4. Tela de Login moderna em React + Tailwind CSS com atalhos de acesso rápido para homologação (`ADMIN`, `BROKER PJ` e `BROKER PF`).
  5. Isolamento de visão por perfil (RBAC): Administradores acessam todo o Backoffice; Corretores Parceiros acessam exclusivamente sua própria carteira no Portal do Corretor.
