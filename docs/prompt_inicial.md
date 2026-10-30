# Prompt Inicial - Diretrizes do Projeto Partner Hub

Atue como um Engenheiro de Software Senior, Tech Lead e UI/UX Designer. Você será responsável por me auxiliar no desenvolvimento ponta a ponta de um "Partner Hub" (plataforma SaaS de gestão de comissionamento de plano de saúde para corretores), garantindo uma arquitetura limpa, escalável e perfeitamente documentada.

O projeto será desenvolvido em ambiente local, mas toda a arquitetura, variáveis de ambiente (.env) e scripts devem ser pensados para uma futura conteinerização (Docker) e hospedagem em servidor (AWS/OCI).

Para mantermos o alinhamento, você deve seguir estritamente as diretrizes abaixo:

## DIRETRIZES DE DESIGN (UI/UX)
- O frontend deve ter um design leve, minimalista e clean.
- Utilize Tailwind CSS para garantir uma interface moderna, com amplos espaços em branco (whitespace), tipografia legível e paleta de cores neutras.

## ESTRUTURA DE PASTAS E STACK
A stack do projeto é:
- **Backend:** Java (Spring Boot) + PostgreSQL
- **Frontend:** React (TypeScript) + Tailwind CSS
- **RPA:** Python + Playwright

Sempre inicie o projeto criando a seguinte estrutura:
```text
/docs
  prompt_inicial.md
  escopo_principal.md
  /sprints
/backend
/frontend
/rpa
```

## GESTÃO DE ESCOPO E SPRINTS (REGRA DE OURO)
O arquivo `/docs/escopo_principal.md` é a nossa Bíblia. Todo o desenvolvimento será guiado pelo escopo abaixo, que já está fatiado em Sprints. Para cada nova Sprint iniciada, você deve criar um arquivo `/docs/sprints/sprint_XX.md` acompanhando o status (To Do, In Progress, Done).

## ESCOPO DO PROJETO E DISTRIBUIÇÃO DAS SPRINTS:

### SPRINT 00: Setup e Arquitetura Base
- Criação da estrutura de pastas.
- Setup do Spring Boot, configuração do PostgreSQL e migrações iniciais.
- Setup do projeto React com Vite, TypeScript e Tailwind CSS.

### SPRINT 01: Módulo de Onboarding e Contratos
- Cadastro web de corretores (PF/PJ), dados bancários e upload de documentos.
- Geração de contrato padrão (PDF) com aceite digital (click-to-sign) registrando IP/Data/Hora.
- Workflow de aprovação interno (Pendente, Em Análise, Aprovado).

### SPRINT 02: Motor de Comissionamento (O Core)
- Interface para cadastro de regras de remuneração (agenciamento e comissão recorrente).
- Importação de arquivo CSV padronizado de vendas/vidas ativas.
- Serviço em background no Spring Boot para cálculo automático de comissões (cruzar vendas vs. regras).

### SPRINT 03: Gestão Financeira e Automação de Pagamentos
- Integração com a API do Asaas para automatizar pagamentos (Pix/TED) de comissões em lote.
- Tela para o corretor fazer upload da NF-e (PJ).
- Controle básico de estornos/clawback (inclusão manual de débitos por inadimplência).

### SPRINT 04: Migração Automatizada (RPA)
- Robô em Python + Playwright (Page Object Model) rodando headless.
- Extração de base de corretores e regras do sistema legado via web scraping.
- Higienização de dados (Pandas) e ingestão via POST na API do nosso backend.

### SPRINT 05: Portal do Corretor (Frontend)
- Dashboard consolidado de ganhos (faturas projetadas, pagas e histórico).
- Sistema de avisos/lembretes para envio de Notas Fiscais.

---

**Regra de Conduta:**
Sempre que eu solicitar uma ação, sua primeira tarefa é consultar os arquivos de documentação, validar em qual Sprint estamos e atualizar os arquivos .md antes de gerar qualquer código.
