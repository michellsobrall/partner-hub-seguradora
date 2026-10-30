import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  Sliders,
  FileSpreadsheet,
  Play,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  Power,
  Users,
  TrendingUp,
  Layers,
} from 'lucide-react';
import {
  CommissionEntryDto,
  CommissionRuleDto,
  CommissionSummaryDto,
  CommissionType,
  CsvImportBatchDto,
} from '@/types/commission';
import {
  createCommissionRule,
  fetchCommissionEntries,
  fetchCommissionRules,
  fetchCommissionSummary,
  fetchCsvImportBatches,
  getCsvTemplateUrl,
  toggleCommissionRule,
  triggerCalculationEngine,
  uploadSalesCsv,
} from '@/services/commissionApi';

function formatBRL(value: number | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export const CommissionModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ENTRIES' | 'RULES' | 'IMPORTS'>('ENTRIES');

  // Data state
  const [summary, setSummary] = useState<CommissionSummaryDto | null>(null);
  const [entries, setEntries] = useState<CommissionEntryDto[]>([]);
  const [rules, setRules] = useState<CommissionRuleDto[]>([]);
  const [batches, setBatches] = useState<CsvImportBatchDto[]>([]);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<CommissionType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [runningEngine, setRunningEngine] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New Rule Form state
  const [ruleCode, setRuleCode] = useState('');
  const [operatorName, setOperatorName] = useState('Bradesco Saúde');
  const [productName, setProductName] = useState('');
  const [agencyPercentage, setAgencyPercentage] = useState('200');
  const [agencyInstallments, setAgencyInstallments] = useState('1');
  const [recurringPercentage, setRecurringPercentage] = useState('5.0');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-01-01');
  const [savingRule, setSavingRule] = useState(false);

  // CSV Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [referenceMonth, setReferenceMonth] = useState('2026-11');
  const [uploadingCsv, setUploadingCsv] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, entryData, rulesData, batchData] = await Promise.all([
        fetchCommissionSummary(),
        fetchCommissionEntries(typeFilter, searchQuery),
        fetchCommissionRules(),
        fetchCsvImportBatches(),
      ]);
      setSummary(sumData);
      setEntries(entryData);
      setRules(rulesData);
      setBatches(batchData);
    } catch (err) {
      console.error('Erro ao carregar dados do motor de comissões:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchQuery]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRunEngine = async () => {
    setRunningEngine(true);
    try {
      const res = await triggerCalculationEngine();
      showToast(
        `Motor executado: ${res.calculatedEntries} novas comissões calculadas (${formatBRL(
          res.generatedAmount
        )})!`
      );
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao executar motor');
    } finally {
      setRunningEngine(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRule(true);
    try {
      await createCommissionRule({
        ruleCode,
        operatorName,
        productName,
        agencyPercentage: Number(agencyPercentage),
        agencyInstallments: Number(agencyInstallments),
        recurringPercentage: Number(recurringPercentage),
        effectiveFrom,
      });
      setRuleCode('');
      setProductName('');
      showToast('Nova regra de remuneração cadastrada e aplicada!');
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cadastrar regra');
    } finally {
      setSavingRule(false);
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      const updated = await toggleCommissionRule(id);
      showToast(
        `Regra ${updated.ruleCode} ${updated.active ? 'ativada' : 'desativada'}!`
      );
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao alterar status da regra');
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setUploadingCsv(true);
    try {
      const batch = await uploadSalesCsv(csvFile, referenceMonth);
      setCsvFile(null);
      showToast(
        `Lote importado: ${batch.validRows} vendas válidas processadas pelo motor!`
      );
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao importar arquivo CSV');
    } finally {
      setUploadingCsv(false);
    }
  };

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Module Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
            Sprint 02 • O Core Financeiro
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Motor de Comissionamento (Agenciamento & Recorrência)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cruzamento automatizado em background entre vendas/vidas ativas importadas via CSV e regras por operadora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRunEngine}
            disabled={runningEngine}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {runningEngine ? 'Processando Lotes...' : 'Processar Apuração Agora'}
          </button>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveSubTab('ENTRIES')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'ENTRIES'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              Extrato Apurado
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('RULES')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'RULES'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              Regras ({summary?.activeRulesCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('IMPORTS')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'IMPORTS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              Importar CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Prêmio Base Apurado</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">
            {formatBRL(summary?.totalBasePremium)}
          </p>
          <span className="text-[11px] text-slate-400">
            {summary?.activeLivesCount || 0} vidas ativas processadas
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Total Comissões Geradas</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1.5">
            {formatBRL(summary?.totalCommissionAmount)}
          </p>
          <span className="text-[11px] text-slate-400">
            {summary?.totalEntries || 0} lançamentos no extrato
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700">Agenciamento (1ªs Parcelas)</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-1.5">
            {formatBRL(summary?.totalAgencyAmount)}
          </p>
          <span className="text-[11px] text-slate-400">Bônus de implantação comercial</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Recorrência Vitalícia</span>
            <Calculator className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">
            {formatBRL(summary?.totalRecurringAmount)}
          </p>
          <span className="text-[11px] text-slate-400">
            Pendentes na fila: {summary?.pendingSalesCount || 0}
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUB-TAB 1: EXTRATO ANALÍTICO DE COMISSÕES                         */}
      {/* ================================================================= */}
      {activeSubTab === 'ENTRIES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'ALL', label: 'Todos os Lançamentos' },
                  { id: 'AGENCY', label: 'Agenciamento (AGENCY)' },
                  { id: 'RECURRING', label: 'Recorrência (RECURRING)' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTypeFilter(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    typeFilter === item.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por proposta, corretor, cliente ou operadora..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">Proposta & Estipulante</th>
                    <th className="py-3.5 px-4">Corretor Parceiro</th>
                    <th className="py-3.5 px-4">Operadora & Plano</th>
                    <th className="py-3.5 px-4">Modalidade</th>
                    <th className="py-3.5 px-4">Prêmio Base</th>
                    <th className="py-3.5 px-4">% Regra</th>
                    <th className="py-3.5 px-6 text-right">Comissão Apurada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        Consultando lançamentos do motor...
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        Nenhuma comissão encontrada. Clique em &ldquo;Processar Apuração Agora&rdquo; ou importe um CSV.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs font-bold text-indigo-600 block">
                            {entry.proposalNumber} • Comp. {entry.referenceMonth}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {entry.beneficiaryName}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            {entry.livesCount} vidas ativas • Parcela #{entry.installmentNumber}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <p className="text-xs font-semibold text-slate-800">
                            {entry.brokerName}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {entry.brokerDocument}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <p className="text-xs font-semibold text-slate-800">
                            {entry.operatorName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {entry.productName} ({entry.ruleCode})
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          {entry.commissionType === 'AGENCY' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              Agenciamento
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              Recorrência
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 font-mono text-xs text-slate-700">
                          {formatBRL(entry.baseAmount)}
                        </td>

                        <td className="py-4 px-4 font-mono text-xs font-bold text-slate-800">
                          {entry.appliedPercentage.toFixed(2)}%
                        </td>

                        <td className="py-4 px-6 text-right">
                          <span className="font-mono text-sm font-bold text-emerald-600">
                            {formatBRL(entry.commissionAmount)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: PARAMETRIZAÇÃO DE REGRAS DE REMUNERAÇÃO                */}
      {/* ================================================================= */}
      {activeSubTab === 'RULES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Nova Regra */}
          <form
            onSubmit={handleCreateRule}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4 self-start"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Nova Regra de Remuneração
              </h3>
              <p className="text-[11px] text-slate-500">
                Defina os percentuais de agenciamento e vitalício por produto.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código da Regra *
              </label>
              <input
                type="text"
                required
                value={ruleCode}
                onChange={(e) => setRuleCode(e.target.value.toUpperCase())}
                placeholder="Ex.: REG-PORTO-PME-05"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operadora / Seguradora *
              </label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Ex.: Bradesco Saúde"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Produto / Plano *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex.: Saúde Top Nacional PME"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  % Agenciamento *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={agencyPercentage}
                  onChange={(e) => setAgencyPercentage(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qtd. Parcelas Agenc. *
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  required
                  value={agencyInstallments}
                  onChange={(e) => setAgencyInstallments(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  % Recorrência Vitalícia *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={recurringPercentage}
                  onChange={(e) => setRecurringPercentage(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Início Vigência *
                </label>
                <input
                  type="date"
                  required
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingRule}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingRule ? 'Salvando Regra...' : 'Salvar e Recalcular Pendências'}
            </button>
          </form>

          {/* Lista de Regras Cadastradas */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Catálogo de Regras de Comissionamento ({rules.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {rule.ruleCode}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {rule.operatorName} — {rule.productName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Agenciamento:{' '}
                      <strong className="text-slate-800">
                        {rule.agencyPercentage.toFixed(2)}%
                      </strong>{' '}
                      (até {rule.agencyInstallments}ª parcela) • Recorrência Vitalícia:{' '}
                      <strong className="text-emerald-700">
                        {rule.recurringPercentage.toFixed(2)}%
                      </strong>{' '}
                      mensal
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        rule.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rule.active ? 'Regra Ativa' : 'Inativa'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule.id)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                      title="Alternar Status"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: IMPORTADOR CSV DE VENDAS E VIDAS ATIVAS                */}
      {/* ================================================================= */}
      {activeSubTab === 'IMPORTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Upload CSV */}
          <form
            onSubmit={handleCsvUpload}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-5 self-start"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Importar Lote CSV de Vendas
                </h3>
                <p className="text-[11px] text-slate-500">
                  Validação automática de schema e cálculo imediato.
                </p>
              </div>
              <a
                href={getCsvTemplateUrl()}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Modelo .CSV
              </a>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Competência Padrão (YYYY-MM)
              </label>
              <input
                type="month"
                required
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
              />
            </div>

            <div className="p-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-center space-y-2">
              <Upload className="w-6 h-6 text-indigo-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Selecione a planilha CSV de vendas/vidas ativas
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                required
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
            </div>

            <button
              type="submit"
              disabled={!csvFile || uploadingCsv}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {uploadingCsv
                ? 'Validando e Calculando Comissões...'
                : 'Processar Arquivo CSV'}
            </button>
          </form>

          {/* Histórico de Lotes Importados */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Histórico de Lotes CSV Processados ({batches.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {batches.map((b) => (
                <div key={b.id} className="p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        {b.filename}
                      </span>
                      <span className="ml-2 font-mono text-xs text-slate-500">
                        (Comp. {b.referenceMonth})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                        {b.validRows} válidas
                      </span>
                      {b.invalidRows > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold">
                          {b.invalidRows} inconsistentes
                        </span>
                      )}
                    </div>
                  </div>
                  {b.errorReport && (
                    <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] font-mono text-slate-600 whitespace-pre-wrap">
                      {b.errorReport}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

