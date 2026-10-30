import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  TrendingUp,
  CalendarClock,
  CheckCircle2,
  Wallet,
  Bell,
  FileText,
  FileSpreadsheet,
  Landmark,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Upload,
  Users,
  ShieldCheck,
  Save,
} from 'lucide-react';
import {
  AccountType,
  BrokerDto,
  PixKeyType,
} from '@/types/onboarding';
import { BrokerPortalDashboardDto } from '@/types/portal';
import { fetchBrokers, getContractPdfUrl } from '@/services/onboardingApi';
import { uploadBrokerInvoice } from '@/services/financeApi';
import {
  fetchBrokerPortalDashboard,
  getBrokerStatementCsvUrl,
  getBrokerStatementPdfUrl,
  updateBrokerPortalBankAccount,
} from '@/services/portalApi';

function formatBRL(val: number | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

interface BrokerPortalModuleProps {
  lockedBrokerId?: string | null;
  isBrokerRole?: boolean;
}

export const BrokerPortalModule: React.FC<BrokerPortalModuleProps> = ({
  lockedBrokerId,
  isBrokerRole = false,
}) => {
  const [brokers, setBrokers] = useState<BrokerDto[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>(
    lockedBrokerId || ''
  );
  const [dashboard, setDashboard] = useState<BrokerPortalDashboardDto | null>(null);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'STATEMENT' | 'PROFILE'>(
    'DASHBOARD'
  );
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Bank Profile Form state
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CNPJ');
  const [pixKey, setPixKey] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  // Quick NFS-e Upload Modal state
  const [showNfseModal, setShowNfseModal] = useState(false);
  const [nfseNumber, setNfseNumber] = useState('');
  const [nfseMonth, setNfseMonth] = useState('2026-10');
  const [nfseFile, setNfseFile] = useState<File | null>(null);
  const [uploadingNfse, setUploadingNfse] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    if (lockedBrokerId) {
      setSelectedBrokerId(lockedBrokerId);
    }
    fetchBrokers('ALL').then((list) => {
      setBrokers(list);
      if (lockedBrokerId) {
        setSelectedBrokerId(lockedBrokerId);
      } else if (list.length > 0 && !selectedBrokerId) {
        setSelectedBrokerId(list[0].id);
      }
    });
  }, [selectedBrokerId, lockedBrokerId]);

  const loadDashboard = useCallback(async (brokerId: string) => {
    if (!brokerId) return;
    setLoading(true);
    try {
      const data = await fetchBrokerPortalDashboard(brokerId);
      setDashboard(data);

      if (data.broker.bankAccount) {
        const b = data.broker.bankAccount;
        setBankCode(b.bankCode);
        setBankName(b.bankName);
        setAgency(b.agency);
        setAccountNumber(b.accountNumber);
        setAccountType(b.accountType);
        setPixKeyType(b.pixKeyType || 'CNPJ');
        setPixKey(b.pixKey || '');
      }
    } catch (err) {
      console.error('Erro ao carregar portal do corretor:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBrokerId) {
      loadDashboard(selectedBrokerId);
    }
  }, [selectedBrokerId, loadDashboard]);

  const handleSaveBankProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrokerId) return;
    setSavingBank(true);
    try {
      await updateBrokerPortalBankAccount(selectedBrokerId, {
        bankCode,
        bankName,
        agency,
        accountNumber,
        accountType,
        pixKeyType: pixKey ? pixKeyType : undefined,
        pixKey: pixKey || undefined,
      });
      showToast('Domicílio bancário e Chave Pix atualizados e validados com sucesso!');
      await loadDashboard(selectedBrokerId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar dados bancários');
    } finally {
      setSavingBank(false);
    }
  };

  const handleQuickUploadNfse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrokerId || !nfseFile || !dashboard) return;
    setUploadingNfse(true);
    try {
      await uploadBrokerInvoice({
        brokerId: selectedBrokerId,
        referenceMonth: nfseMonth,
        invoiceNumber: nfseNumber,
        grossAmount: dashboard.openNetBalance || dashboard.earningsInCurrentMonth,
        file: nfseFile,
      });
      setShowNfseModal(false);
      setNfseNumber('');
      setNfseFile(null);
      showToast('NFS-e enviada com sucesso para validação da Mesa Financeira!');
      await loadDashboard(selectedBrokerId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar NFS-e');
    } finally {
      setUploadingNfse(false);
    }
  };

  const maxEvolutionValue = Math.max(
    ...(dashboard?.monthlyEvolution.map((m) => m.totalAmount) || [1]),
    1
  );

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Bar: Broker Switcher & Sub-Navigation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
            Sprint 05 • Portal do Corretor Parceiro
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {dashboard?.broker.name || 'Portal Executivo do Corretor'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento transparente de produção, faturas projetadas, extratos PDF/Excel e avisos de NFS-e.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Corretor (Apenas para ADMIN) ou Badge de Sessão Isolada (Para BROKER) */}
          {isBrokerRole && lockedBrokerId ? (
            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/80 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Carteira Autenticada JWT: [{dashboard?.broker.personType || 'PARCEIRO'}]{' '}
                {dashboard?.broker.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">
                Visão do Parceiro (Admin):
              </span>
              <select
                value={selectedBrokerId}
                onChange={(e) => setSelectedBrokerId(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.personType}] {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('DASHBOARD')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'DASHBOARD'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              Visão Geral
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('STATEMENT')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'STATEMENT'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Extrato & Exportação
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PROFILE')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'PROFILE'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-indigo-600" />
              Meus Dados & Pix
            </button>
          </div>
        </div>
      </div>

      {/* Central de Alertas e Lembretes (NFS-e / Clawbacks / Liquidação) */}
      {dashboard && dashboard.alerts.length > 0 && (
        <section className="space-y-3">
          {dashboard.alerts.map((alert) => {
            const isWarn = alert.severity === 'WARNING';
            const isDanger = alert.severity === 'DANGER';
            const isSuccess = alert.severity === 'SUCCESS';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isWarn
                    ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                    : isDanger
                    ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                    : isSuccess
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isWarn ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : isDanger ? (
                      <AlertOctagon className="w-5 h-5 text-rose-600" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Bell className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold">{alert.title}</h4>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/80">
                        {alert.deadlineLabel}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>

                {alert.actionType === 'UPLOAD_NFSE' && (
                  <button
                    type="button"
                    onClick={() => setShowNfseModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shrink-0 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Enviar NFS-e Agora
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ganhos no Mês</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '...' : formatBRL(dashboard?.earningsInCurrentMonth)}
          </p>
          <span className="text-[11px] text-slate-400 block">
            {dashboard?.totalPoliciesCount || 0} apólices comissionadas no ciclo
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Faturas Projetadas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '...' : formatBRL(dashboard?.projectedNextInvoice)}
          </p>
          <span className="text-[11px] text-slate-400 block">
            Carteira ativa: {dashboard?.totalActiveLives || 0} vidas recorrentes
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-emerald-200/80 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Total Pago no Ano</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {loading ? '...' : formatBRL(dashboard?.totalPaidInYear)}
          </p>
          <span className="text-[11px] text-slate-400 block">
            Liquidações Pix/TED via Asaas
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Saldo Líquido em Aberto</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '...' : formatBRL(dashboard?.openNetBalance)}
          </p>
          <span className="text-[11px] text-slate-400 block">
            Já deduzido de eventuais clawbacks
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: DASHBOARD DE EVOLUÇÃO & CARTEIRA                           */}
      {/* ================================================================= */}
      {activeTab === 'DASHBOARD' && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico Minimalista de Evolução de Produção (6 Meses) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evolução de Produção & Comissões (Últimos 6 Meses)
                </h3>
                <p className="text-xs text-slate-500">
                  Composição mensal entre Agenciamento (implantação) e Recorrência Vitalícia.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                  Agenciamento
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Recorrência
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-4 items-end h-56 pt-6 px-2 border-b border-slate-100">
              {dashboard.monthlyEvolution.map((point) => {
                const heightPct = Math.max(
                  14,
                  Math.round((point.totalAmount / maxEvolutionValue) * 100)
                );
                const recRatio =
                  point.totalAmount > 0
                    ? Math.round((point.recurringAmount / point.totalAmount) * 100)
                    : 20;

                return (
                  <div
                    key={point.referenceMonth}
                    className="flex flex-col items-center justify-end h-full group"
                  >
                    <span className="text-[10px] font-mono font-semibold text-slate-500 mb-1.5">
                      {formatBRL(point.totalAmount)}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[44px] rounded-t-xl overflow-hidden flex flex-col justify-end bg-indigo-600 transition-all group-hover:opacity-90 shadow-sm"
                    >
                      <div
                        style={{ height: `${recRatio}%` }}
                        className="w-full bg-emerald-500"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 mt-2.5">
                      {point.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mb-2">
                      {point.activeLives} vidas
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribuição por Operadora */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Share por Operadora de Saúde
              </h3>
              <p className="text-xs text-slate-500">
                Concentração de comissões e vidas ativas na carteira.
              </p>
            </div>

            {dashboard.operatorBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Nenhuma venda vinculada a este corretor ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {dashboard.operatorBreakdown.map((op) => (
                  <div key={op.operatorName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{op.operatorName}</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {formatBRL(op.commissionAmount)} ({op.sharePercentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(8, op.sharePercentage)}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {op.livesCount} vidas ativas nesta operadora
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: EXTRATO ANALÍTICO & EXPORTAÇÃO PDF / EXCEL                 */}
      {/* ================================================================= */}
      {activeTab === 'STATEMENT' && dashboard && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Demonstrativo Analítico de Comissões ({dashboard.entries.length} lançamentos)
              </h3>
              <p className="text-xs text-slate-500">
                Exporte seu relatório oficial para contabilidade e emissão de NFS-e.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={getBrokerStatementCsvUrl(dashboard.broker.id)}
                download
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel (.CSV)
              </a>
              <a
                href={getBrokerStatementPdfUrl(dashboard.broker.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                Baixar Demonstrativo PDF
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Proposta & Competência</th>
                  <th className="py-3.5 px-4">Beneficiário / Estipulante</th>
                  <th className="py-3.5 px-4">Operadora & Produto</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Prêmio Base</th>
                  <th className="py-3.5 px-4">% Aplicado</th>
                  <th className="py-3.5 px-6 text-right">Valor Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {dashboard.entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80">
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-indigo-600 block">
                        {entry.proposalNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Comp. {entry.referenceMonth} • Parcela #{entry.installmentNumber}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900 text-xs block">
                        {entry.beneficiaryName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {entry.livesCount} vidas ativas
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-700">
                      <strong>{entry.operatorName}</strong> — {entry.productName}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          entry.commissionType === 'AGENCY'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {entry.commissionType === 'AGENCY' ? 'Agenciamento' : 'Recorrência'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-700">
                      {formatBRL(entry.baseAmount)}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs font-bold text-slate-800">
                      {entry.appliedPercentage.toFixed(2)}%
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm font-bold text-emerald-600">
                      {formatBRL(entry.commissionAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: PERFIL & MANUTENÇÃO DE DADOS BANCÁRIOS / PIX               */}
      {/* ================================================================= */}
      {activeTab === 'PROFILE' && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Dados Cadastrais & Contrato Assinado */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4 self-start">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {dashboard.broker.personType}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {dashboard.broker.name}
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  {dashboard.broker.documentNumber}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <span className="text-slate-400">E-mail Oficial:</span>{' '}
                <strong className="text-slate-800">{dashboard.broker.email}</strong>
              </p>
              <p>
                <span className="text-slate-400">Telefone:</span>{' '}
                <strong className="text-slate-800">{dashboard.broker.phone}</strong>
              </p>
              <p>
                <span className="text-slate-400">Registro SUSEP:</span>{' '}
                <strong className="text-slate-800">
                  {dashboard.broker.susepCode || 'Isento'}
                </strong>
              </p>
              <p>
                <span className="text-slate-400">Contrato Digital:</span>{' '}
                <strong className="font-mono text-indigo-600">
                  {dashboard.broker.contract?.contractNumber}
                </strong>
              </p>
            </div>

            <a
              href={getContractPdfUrl(dashboard.broker.id)}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Baixar Meu Contrato Assinado (PDF)
            </a>
          </div>

          {/* Formulário de Manutenção Bancária e Pix */}
          <form
            onSubmit={handleSaveBankProfile}
            className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-600" />
                Manutenção de Domicílio Bancário & Chave Pix (Liquidação Asaas)
              </h3>
              <p className="text-xs text-slate-500">
                Mantenha sua conta e chave Pix atualizadas para recebimento automático dos lotes de comissão.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código do Banco *
                </label>
                <input
                  type="text"
                  required
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Instituição Bancária *
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agência *
                </label>
                <input
                  type="text"
                  required
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conta com Dígito *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Chave Pix
                </label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="CPF">CPF</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="PHONE">Telefone</option>
                  <option value="RANDOM">Chave Aleatória</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chave Pix Ativa
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingBank}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingBank
                  ? 'Validando e Salvando...'
                  : 'Salvar e Atualizar Conta Bancária'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Rápido de Envio de NFS-e direto pelo Alerta do Corretor */}
      {showNfseModal && dashboard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleQuickUploadNfse}
            className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Enviar NFS-e da Competência ({dashboard.broker.name})
              </h3>
              <button
                type="button"
                onClick={() => setShowNfseModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Competência (YYYY-MM) *
              </label>
              <input
                type="month"
                required
                value={nfseMonth}
                onChange={(e) => setNfseMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número da Nota Fiscal (NFS-e) *
              </label>
              <input
                type="text"
                required
                value={nfseNumber}
                onChange={(e) => setNfseNumber(e.target.value)}
                placeholder="Ex.: 2026000419"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arquivo PDF ou XML da NFS-e *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.xml,.png,.jpg"
                onChange={(e) => setNfseFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNfseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!nfseFile || uploadingNfse}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploadingNfse ? 'Enviando...' : 'Protocolar NFS-e'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

