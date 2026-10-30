# SPRINT 06: Autenticação JWT e Controle de Acesso por Perfil (RBAC)

> **Status da Sprint:** 🟢 Concluída (Done)  
> **Objetivo:** Implementar autenticação Stateless via JWT (JSON Web Token) com Spring Security, criptografia BCrypt e controle de acesso por perfil (`ADMIN` Backoffice vs `BROKER` Corretor Parceiro).

---

## 1. ENTREGÁVEIS E CHECKLIST DE TAREFAS

### 1.1. Banco de Dados & Migração Flyway
- [x] Criar migração `V6__auth_users_and_roles.sql` com a tabela `app_users` (`id`, `email`, `password_hash`, `full_name`, `role`, `broker_id`, `active`, `last_login_at`, `created_at`).
- [x] Semear contas de homologação para `ADMIN` (`admin@partnerhub.com.br`), `BROKER PJ` (`financeiro@primecorretora.com.br`), `BROKER PF` (`roberto.almeida@corretor.com.br`) e provisão automática para novos corretores cadastrados.
- [x] Atualizar `system_metadata` para a versão `1.6.0` (`sprint_06_auth_jwt_rbac`).

### 1.2. Backend (Spring Security + JWT)
- [x] Adicionar dependências `spring-boot-starter-security` e `jjwt` (`0.11.5`) no `backend/pom.xml`.
- [x] Criar enum `UserRole` (`ADMIN`, `BROKER`), entidade `AppUser` e repositório `AppUserRepository`.
- [x] Implementar `JwtTokenProvider` (assinatura HMAC-SHA256, claims de `role`, `brokerId`, `fullName`) e `JwtAuthenticationFilter`.
- [x] Configurar `SecurityConfig` (Stateless session, BCryptPasswordEncoder, CORS integrado e proteção de rotas).
- [x] Criar `AuthService` e `AuthController` (`POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `GET /api/v1/auth/demo-accounts`).

### 1.3. Frontend (Tela de Login, Sessão JWT & RBAC)
- [x] Criar tipagens `frontend/src/types/auth.ts` e cliente `frontend/src/services/authApi.ts` com persistência segura do token JWT no `localStorage`.
- [x] Criar tela de Login (`frontend/src/components/auth/LoginScreen.tsx`) com preenchimento 1-clique para testar os perfis (`ADMIN`, `BROKER PJ`, `BROKER PF` e novos corretores).
- [x] Implementar RBAC na `Sidebar.tsx`, `Header.tsx`, `App.tsx` e `BrokerPortalModule.tsx`:
  - Perfil `ADMIN`: Visão completa de todos os 6 módulos do Backoffice.
  - Perfil `BROKER`: Visão restrita ao **Portal do Corretor** travada exclusivamente no `brokerId` do corretor autenticado.
