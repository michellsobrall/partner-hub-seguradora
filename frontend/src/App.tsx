import React, { useEffect, useState, useCallback } from 'react';
import {
  Server,
  Database,
  GitBranch,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Terminal,
  Shield,
} from 'lucide-react';
import { Sidebar, ActiveModuleId } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { OnboardingModule } from '@/components/onboarding/OnboardingModule';
import { CommissionModule } from '@/components/commissions/CommissionModule';
import { FinanceModule } from '@/components/finance/FinanceModule';
import { RpaModule } from '@/components/rpa/RpaModule';
import { BrokerPortalModule } from '@/components/portal/BrokerPortalModule';
import { fetchSystemHealth } from '@/services/api';
import { clearAuthSession, getStoredAuthSession } from '@/services/authApi';
import { HealthResponse } from '@/types/health';
import { AuthSessionDto } from '@/types/auth';

const roadmapSprints = [
  {
    code: 'SPRINT 00',
    title: 'Setup e Arquitetura Base',
    description:
      'Monorepo padronizado, Spring Boot 3 + PostgreSQL 15 + Flyway, React 18 + Tailwind CSS e base RPA.',
    status: 'DONE',
  },
  {
    code: 'SPRINT 01',
    title: 'Módulo de Onboarding e Contratos',
    description:
      'Cadastro PF/PJ, dados bancários, upload documental, geração de PDF e click-to-sign com hash SHA-256.',
    status: 'DONE',
  },
  {
    code: 'SPRINT 02',
    title: 'Motor de Comissionamento (Core)',
    description:
      'Regras de agenciamento e recorrência vitalícia, importação CSV de vidas ativas e cálculo em background.',
    status: 'DONE',
  },
  {
    code: 'SPRINT 03',
    title: 'Gestão Financeira e Asaas',
    description:
      'Liquidação em lote via Pix/TED na API Asaas v3, validação de NFS-e (PJ) e controle de clawback/estornos.',
    status: 'DONE',
  },
  {
    code: 'SPRINT 04',
    title: 'Migração Automatizada (RPA)',
    description:
      'Extração resiliente com Python + Playwright (POM), higienização via Pandas e ingestão REST no Backend.',
    status: 'DONE',
  },
  {
    code: 'SPRINT 05',
    title: 'Portal do Corretor',
    description:
      'Dashboard executivo de ganhos, faturas projetadas, extrato analítico PDF/Excel e central de alertas.',
    status: 'DONE',
  },
  {
    code: 'SPRINT 06',
    title: 'Autenticação JWT & RBAC',
    description:
      'Segurança Stateless com Spring Security 6, HMAC-SHA256 JWT, BCrypt e isolamento de visão Admin vs. Corretor.',
    status: 'DONE',
  },
];

export const App: React.FC = () => {
  const [authSession, setAuthSession] = useState<AuthSessionDto | null>(() =>
    getStoredAuthSession()
  );
  const [activeModule, setActiveModule] = useState<ActiveModuleId>(() => {
    const stored = getStoredAuthSession();
    return stored?.role === 'BROKER' ? 'broker-portal' : 'overview';
  });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar ao Backend Spring Boot.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handleLoginSuccess = (session: AuthSessionDto) => {
    setAuthSession(session);
    if (session.role === 'BROKER') {
      setActiveModule('broker-portal');
    } else {
      setActiveModule('overview');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthSession(null);
  };

  if (!authSession) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isHealthy = health?.status === 'UP' && health?.database === 'CONNECTED';
  const effectiveModule: ActiveModuleId =
    authSession.role === 'BROKER' ? 'broker-portal' : activeModule;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeModule={effectiveModule}
        onSelectModule={setActiveModule}
        authSession={authSession}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          health={health}
          loading={loading}
          error={error}
          onRefresh={loadHealth}
          authSession={authSession}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
          {effectiveModule === 'broker-portal' ? (
            <BrokerPortalModule
              lockedBrokerId={
                authSession.role === 'BROKER' ? authSession.brokerId : null
              }
              isBrokerRole={authSession.role === 'BROKER'}
            />
          ) : effectiveModule === 'rpa' ? (
            <RpaModule />
          ) : effectiveModule === 'finance' ? (
            <FinanceModule />
          ) : effectiveModule === 'commissions' ? (
            <CommissionModule />
          ) : effectiveModule === 'onboarding' ? (
            <OnboardingModule />
          ) : (
            <>
              {/* Welcome Banner */}
              <section className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    Fundação SaaS Multitenant • JWT + RBAC Ativo
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Bem-vindo ao Partner Hub, {authSession.fullName}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Plataforma corporativa para orquestração de comissionamento de planos de saúde,
                    contratos digitais de corretores parceiros e liquidação financeira automatizada.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  <a
                    href="http://localhost:8080/api/v1/health"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  >
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Endpoint JSON (/api/v1/health)
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              </section>

              {/* Telemetry Cards */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Backend API
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Server className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-slate-900">
                        {loading ? '...' : health?.service || 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Spring Boot 3.2.5 • Spring Security JWT
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Status HTTP</span>
                    <span
                      className={`font-semibold ${
                        isHealthy ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {loading ? 'Consultando' : health?.status || 'Indisponível'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Banco de Dados
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900">
                      {loading
                        ? '...'
                        : health?.details?.databaseProduct || 'PostgreSQL'}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Versão Motor:{' '}
                      <span className="font-mono font-medium text-slate-700">
                        {health?.details?.databaseVersion || '15-alpine'}
                      </span>
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Conexão JDBC</span>
                    <span
                      className={`font-semibold ${
                        health?.database === 'CONNECTED'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {loading ? '...' : health?.database || 'DISCONNECTED'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Migrações Flyway
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <GitBranch className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900">
                      v{health?.details?.schemaVersion || '1.6.0'}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Migrations: <span className="font-mono">V1 a V6</span>
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Integridade</span>
                    <span className="font-semibold text-emerald-600">
                      {health?.details?.schemaStatus || 'OPERATIONAL'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Sessão & RBAC
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900">
                      {authSession.role}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {authSession.email}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Token JWT</span>
                    <span className="font-mono text-emerald-600 font-semibold">
                      HMAC-SHA256
                    </span>
                  </div>
                </div>
              </section>

              {/* Roadmap Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Plano Diretor de Engenharia (Sprints)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Governança guiada pelo documento oficial{' '}
                      <code className="font-mono text-slate-700">docs/escopo_principal.md</code>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {roadmapSprints.map((sprint) => {
                    const isDone = sprint.status === 'DONE';
                    const isNext = sprint.status === 'NEXT';

                    return (
                      <div
                        key={sprint.code}
                        className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                          isDone
                            ? 'bg-white border-emerald-200/80 shadow-subtle'
                            : isNext
                            ? 'bg-white border-indigo-200 shadow-card ring-1 ring-indigo-500/10'
                            : 'bg-white/70 border-slate-200/70'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold tracking-wider text-slate-500">
                              {sprint.code}
                            </span>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" />
                                Concluída
                              </span>
                            ) : isNext ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                <Clock className="w-3 h-3" />
                                Próxima Etapa
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                Planejada
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900">
                            {sprint.title}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {sprint.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
