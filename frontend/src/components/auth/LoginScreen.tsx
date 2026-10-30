import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Sparkles,
  Building2,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AuthSessionDto, DemoAccountDto } from '@/types/auth';
import { fetchDemoAccounts, loginWithCredentials } from '@/services/authApi';

interface LoginScreenProps {
  onLoginSuccess: (session: AuthSessionDto) => void;
}

const FALLBACK_DEMO_ACCOUNTS: DemoAccountDto[] = [
  {
    label: 'Administrador Backoffice (Visão Completa)',
    description:
      'Acesso irrestrito a Onboarding, Motor de Comissões, Financeiro Asaas, RPA e todos os Corretores.',
    email: 'admin@partnerhub.com.br',
    password: 'Admin@123',
    role: 'ADMIN',
  },
  {
    label: 'Corretor Parceiro [PJ] — Prime Corretora de Seguros e Benefícios Ltda',
    description:
      'Acesso exclusivo ao Portal do Corretor (Carteira PJ com alerta de NFS-e e Clawback).',
    email: 'contato@primebeneficios.com.br',
    password: 'Partner@123',
    role: 'BROKER',
  },
  {
    label: 'Corretor Parceiro [PF] — Mariana Costa Albuquerque',
    description:
      'Acesso exclusivo ao Portal do Corretor (Carteira PF isenta de NFS-e).',
    email: 'mariana.albuquerque@corretorparceiro.com.br',
    password: 'Partner@123',
    role: 'BROKER',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@partnerhub.com.br');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountDto[]>(
    FALLBACK_DEMO_ACCOUNTS
  );

  useEffect(() => {
    fetchDemoAccounts()
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          setDemoAccounts(accounts);
        }
      })
      .catch(() => {
        // Mantém contas de fallback caso o backend ainda esteja iniciando
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await loginWithCredentials({ email, password });
      onLoginSuccess(session);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível autenticar. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account: DemoAccountDto) => {
    setEmail(account.email);
    setPassword(account.password);
    setLoading(true);
    setError(null);
    try {
      const session = await loginWithCredentials({
        email: account.email,
        password: account.password,
      });
      onLoginSuccess(session);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao realizar login rápido. Verifique se o Backend está ativo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto">
        {/* Top Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Partner Hub
                </h1>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  JWT + RBAC v1.6.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Plataforma SaaS de Gestão de Comissionamento de Planos de Saúde & Contratos Digitais
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 shadow-subtle">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Autenticação Stateless HMAC-SHA256 • Spring Security 6</span>
          </div>
        </div>

        {/* Main Grid: Form + Quick Access RBAC Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Formulário de Autenticação JWT */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-card p-7 space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Controle de Acesso Corporativo
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Entrar na Plataforma
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Informe suas credenciais ou selecione um perfil de homologação ao lado.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all"
              >
                {loading ? 'Autenticando Token JWT...' : 'Acessar Ecossistema Partner Hub'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Perfil ADMIN:</strong> Acesso completo ao Backoffice (Sprints 00 a 05).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  <strong>Perfil BROKER:</strong> Visão isolada na própria carteira no Portal do Corretor.
                </span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Perfis de Homologação 1-Clique (RBAC) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Acesso Rápido de Homologação (1 Clique)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Clique em qualquer conta abaixo para autenticar imediatamente e testar o isolamento de perfil (RBAC).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {demoAccounts.map((acc) => {
                const isAdmin = acc.role === 'ADMIN';
                return (
                  <div
                    key={acc.email}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isAdmin
                        ? 'border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isAdmin
                              ? 'bg-indigo-600 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <Building2 className="w-3 h-3" />
                              ROLE_ADMIN
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              ROLE_BROKER
                            </>
                          )}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {acc.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{acc.description}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        Login: <strong className="text-slate-700">{acc.email}</strong> • Senha:{' '}
                        <strong className="text-slate-700">{acc.password}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(acc)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-subtle ${
                        isAdmin
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-white text-slate-800 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                      }`}
                    >
                      Entrar como {isAdmin ? 'Admin' : 'Corretor'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

