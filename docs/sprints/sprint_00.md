# SPRINT 00: Setup e Arquitetura Base

> **Status Atual:** 🟢 Concluída (Done)  
> **Início:** 29/10/2026  
> **Conclusão:** 29/10/2026  
> **Objetivo:** Estabelecer a fundação do monorepo/multiserviço com a estrutura de pastas padronizada, configuração inicial do Spring Boot com PostgreSQL/Flyway, e inicialização do projeto React com Vite, TypeScript e Tailwind CSS.

---

## 📋 BACKLOG DA SPRINT 00

### 1. Estrutura Base e Documentação
- [x] **TASK-001:** Criação da estrutura de pastas raiz (`/docs`, `/backend`, `/frontend`, `/rpa`)
- [x] **TASK-002:** Criação e congelamento do `docs/prompt_inicial.md`
- [x] **TASK-003:** Criação do `docs/escopo_principal.md` (Bíblia do Projeto)
- [x] **TASK-004:** Criação do acompanhamento da sprint `docs/sprints/sprint_00.md`
- [x] **TASK-005:** Configuração do `.gitignore` global e `.dockerignore`

### 2. Infraestrutura & Banco de Dados Local
- [x] **TASK-006:** Criação do `docker-compose.yml` para banco de dados PostgreSQL 15 e PGAdmin (opcional)
- [x] **TASK-007:** Definição do arquivo de variáveis de ambiente do backend (`backend/.env.example` e `backend/.env`)
- [x] **TASK-008:** Criação do script Flyway de migração inicial `V1__init.sql`
> *Nota Operacional (Windows): O Docker Desktop precisa estar em execução (status 'Engine running') para que o daemon atenda as requisições de pipe local (`//./pipe/dockerDesktopLinuxEngine`).*


### 3. Backend (Java + Spring Boot 3)
- [x] **TASK-009:** Criação do projeto Spring Boot (Maven) com Java 17+
  - Dependências: Spring Web, Spring Data JPA, PostgreSQL Driver, Lombok, Flyway Migration, Validation
- [x] **TASK-010:** Configuração do `application.yml` apontando para variáveis de ambiente com fallbacks locais
- [x] **TASK-011:** Criação do Health Check Endpoint (`GET /api/v1/health`) para validação de conectividade com PostgreSQL
- [x] **TASK-012:** Validação do build e execução da aplicação Spring Boot

### 4. Frontend (React + TypeScript + Vite + Tailwind CSS)
- [x] **TASK-013:** Inicialização do projeto React com Vite e TypeScript na pasta `/frontend`
- [x] **TASK-014:** Instalação e configuração do Tailwind CSS, PostCSS e Autoprefixer
- [x] **TASK-015:** Configuração do Design System básico (paleta neutra, tipografia limpa, fontes e tokens de espaçamento)
- [x] **TASK-016:** Criação de layout base com componente de Header/Sidebar minimalista e tela de boas-vindas/status da plataforma
- [x] **TASK-017:** Configuração de `.env.example` e teste de execução local do servidor de desenvolvimento (`npm run dev`)

### 5. RPA (Python - Estrutura Preparatória)
- [x] **TASK-018:** Criação da estrutura base na pasta `/rpa` (arquivos `requirements.txt`, `.env.example`, pastas `/pages` e `/scripts`)

---

## 🎯 DEFINIÇÃO DE PRONTO (DoD - Definition of Done)

Para que a Sprint 00 seja marcada como **Concluída (Done)**, os seguintes critérios devem ser atendidos:
1. [x] Estrutura de pastas totalmente criada e versionável.
2. [x] Banco de dados PostgreSQL rodando via Docker Compose e aceitando conexões.
3. [x] Aplicação Spring Boot subindo sem erros e conectando ao PostgreSQL via Flyway.
4. [x] Aplicação Frontend React rodando com Tailwind CSS funcionando e renderizando a interface minimalista de boas-vindas.
5. [x] Todos os arquivos `.env.example` criados e documentados.
