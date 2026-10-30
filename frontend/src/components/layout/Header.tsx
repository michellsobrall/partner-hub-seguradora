import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LogOut,
  Shield,
} from 'lucide-react';
import { HealthResponse } from '@/types/health';
import { AuthSessionDto } from '@/types/auth';

interface HeaderProps {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  authSession: AuthSessionDto;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  loading,
  error,
  onRefresh,
  authSession,
  onLogout,
}) => {
  const envName = import.meta.env.VITE_APP_ENV || 'development';

  const renderStatusBadge = () => {
    if (loading) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          Verificando serviços...
        </span>
      );
    }

    if (error || !health) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          API Offline
        </span>
      );
    }

    if (health.status === 'UP' && health.database === 'CONNECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Ecossistema Operacional
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Degradado
      </span>
    );
  };

  return (
    <header className="min-h-[5rem] py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight">
            {authSession.role === 'ADMIN'
              ? 'Central de Arquitetura & Governança Backoffice'
              : `Portal do Corretor • ${authSession.fullName}`}
          </h1>
          <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
            {envName}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {authSession.role === 'ADMIN'
            ? 'Sessão Administrativa (ROLE_ADMIN) • Acesso completo às Sprints 00 a 06'
            : `Sessão Autenticada via JWT (ROLE_BROKER) • ${authSession.email}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            authSession.role === 'ADMIN'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          {authSession.role === 'ADMIN' ? 'Admin Backoffice' : 'Corretor Parceiro'}
        </span>

        {renderStatusBadge()}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition-all disabled:opacity-50 shadow-subtle"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              loading ? 'animate-spin text-indigo-600' : 'text-slate-500'
            }`}
          />
          Status
        </button>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 hover:bg-rose-100 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </header>
  );
};
