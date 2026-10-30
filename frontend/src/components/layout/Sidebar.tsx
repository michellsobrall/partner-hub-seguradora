import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Calculator,
  Wallet,
  Bot,
  Briefcase,
  ShieldCheck,
  LogOut,
  Lock,
} from 'lucide-react';
import { AuthSessionDto, UserRole } from '@/types/auth';

export type ActiveModuleId =
  | 'overview'
  | 'onboarding'
  | 'commissions'
  | 'finance'
  | 'rpa'
  | 'broker-portal';

interface NavItem {
  id: ActiveModuleId;
  label: string;
  sprint: string;
  icon: React.ElementType;
  enabled: boolean;
  badge?: string;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Status da Plataforma',
    sprint: 'Sprint 00',
    icon: LayoutDashboard,
    enabled: true,
    badge: 'Done',
    allowedRoles: ['ADMIN'],
  },
  {
    id: 'onboarding',
    label: 'Onboarding & Contratos',
    sprint: 'Sprint 01',
    icon: UserCheck,
    enabled: true,
    badge: 'Done',
    allowedRoles: ['ADMIN'],
  },
  {
    id: 'commissions',
    label: 'Motor de Comissões',
    sprint: 'Sprint 02',
    icon: Calculator,
    enabled: true,
    badge: 'Done',
    allowedRoles: ['ADMIN'],
  },
  {
    id: 'finance',
    label: 'Financeiro & Asaas',
    sprint: 'Sprint 03',
    icon: Wallet,
    enabled: true,
    badge: 'Done',
    allowedRoles: ['ADMIN'],
  },
  {
    id: 'rpa',
    label: 'Migração RPA',
    sprint: 'Sprint 04',
    icon: Bot,
    enabled: true,
    badge: 'Done',
    allowedRoles: ['ADMIN'],
  },
  {
    id: 'broker-portal',
    label: 'Portal do Corretor',
    sprint: 'Sprint 05',
    icon: Briefcase,
    enabled: true,
    badge: 'Ativo',
    allowedRoles: ['ADMIN', 'BROKER'],
  },
];

interface SidebarProps {
  activeModule: ActiveModuleId;
  onSelectModule: (moduleId: ActiveModuleId) => void;
  authSession: AuthSessionDto;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  authSession,
  onLogout,
}) => {
  const visibleItems = navItems.filter((item) =>
    item.allowedRoles.includes(authSession.role)
  );

  return (
    <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 block">
              Partner Hub
            </span>
            <span className="text-xs font-medium text-slate-500">
              Gestão de Comissionamento
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            {authSession.role === 'ADMIN'
              ? 'Módulos do Ecossistema'
              : 'Autoatendimento do Parceiro'}
          </p>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.enabled}
                  onClick={() => item.enabled && onSelectModule(item.id)}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-indigo-50/90 text-indigo-700 shadow-subtle'
                      : item.enabled
                      ? 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                      : 'text-slate-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-indigo-600'
                          : item.enabled
                          ? 'text-slate-500 group-hover:text-indigo-600'
                          : 'text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        item.badge === 'Ativo'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">
                      {item.sprint}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {authSession.role === 'BROKER' && (
            <div className="mt-4 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                <Lock className="w-3.5 h-3.5" />
                <span>Isolamento RBAC Ativo</span>
              </div>
              <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                Sua sessão JWT está restrita exclusivamente aos dados e comissões da sua corretora.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Session & Footer Info */}
      <div className="p-4 space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                authSession.role === 'ADMIN'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {authSession.role === 'ADMIN' ? 'ROLE_ADMIN' : 'ROLE_BROKER'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">JWT Ativo</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 truncate">
              {authSession.fullName}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{authSession.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Trocar Perfil / Sair
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-700">
              Ecossistema Completo
            </span>
            <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
              v1.6.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Sprints 00 a 06 concluídas • JWT + RBAC Ativo.
          </p>
        </div>
      </div>
    </aside>
  );
};
