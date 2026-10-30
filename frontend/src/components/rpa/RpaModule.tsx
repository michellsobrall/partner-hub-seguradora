import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Play,
  Terminal,
  Filter,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  FileCode2,
  ArrowRight,
} from 'lucide-react';
import { RpaMigrationJobDto, RpaSummaryDto } from '@/types/rpa';
import {
  fetchRpaJobs,
  fetchRpaSummary,
  triggerRpaPipeline,
} from '@/services/rpaApi';

export const RpaModule: React.FC = () => {
  const [summary, setSummary] = useState<RpaSummaryDto | null>(null);
  const [jobs, setJobs] = useState<RpaMigrationJobDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, jobList] = await Promise.all([
        fetchRpaSummary(),
        fetchRpaJobs(),
      ]);
      setSummary(sumData);
      setJobs(jobList);
    } catch (err) {
      console.error('Erro ao carregar telemetria RPA:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunPipeline = async () => {
    setRunningPipeline(true);
    try {
      const job = await triggerRpaPipeline();
      showToast(
        `Job ${job.jobCode} concluído! ${job.brokersIngested} corretores e ${job.rulesIngested} regras ingeridos (${job.duplicatesRemoved} duplicatas removidas pelo Pandas).`
      );
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao executar pipeline RPA');
    } finally {
      setRunningPipeline(false);
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
            Sprint 04 • Interoperabilidade & Web Scraping
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Migração Automatizada RPA (Python + Playwright POM + Pandas)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Extração headless de portais legados, higienização de dados com Pandas e ingestão via POST na API Spring Boot.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunPipeline}
          disabled={runningPipeline}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all self-start lg:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {runningPipeline
            ? 'Executando Robô Playwright + Pandas...'
            : 'Executar Pipeline RPA de Migração Legada'}
        </button>
      </div>

      {/* 4-Stage Pipeline Architecture Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            step: '01. Playwright POM',
            title: 'Autenticação Headless',
            file: 'rpa/pages/login_page.py',
            desc: 'Sessão resiliente no portal legado SGP-Saúde com espera explícita do DOM.',
          },
          {
            step: '02. Web Scraping',
            title: 'Extração de Tabelas',
            file: 'rpa/pages/brokers_legacy_page.py',
            desc: 'Coleta bruta de corretores e tabelas de vigência de operadoras.',
          },
          {
            step: '03. Pandas ETL',
            title: 'Higienização & Deduplicação',
            file: 'rpa/scripts/sanitizer.py',
            desc: 'Remove duplicatas, normaliza CPF/CNPJ e converte strings monetárias.',
          },
          {
            step: '04. REST Ingestor',
            title: 'Ingestão Idempotente',
            file: 'POST /api/v1/rpa/ingest',
            desc: 'Persiste corretores, contas Pix, contratos e regras no PostgreSQL.',
          },
        ].map((stage, idx) => (
          <div
            key={stage.step}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-2 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-indigo-600">
                {stage.step}
              </span>
              {idx < 3 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden md:block" />
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900">{stage.title}</h3>
            <code className="block text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
              {stage.file}
            </code>
            <p className="text-xs text-slate-500 leading-relaxed">{stage.desc}</p>
          </div>
        ))}
      </div>

      {/* Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-medium text-slate-500">Execuções do Robô</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.totalJobsExecuted || 0}
          </p>
          <span className="text-[11px] text-slate-400">Pipelines finalizados</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-medium text-slate-500">Linhas Brutas Raspadas</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.totalRawExtracted || 0}
          </p>
          <span className="text-[11px] text-slate-400">DOM HTML SGP-Saúde</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-subtle">
          <span className="text-xs font-medium text-amber-700">Duplicatas Removidas (Pandas)</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {summary?.totalDuplicatesRemoved || 0}
          </p>
          <span className="text-[11px] text-slate-400">drop_duplicates + regex</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-subtle">
          <span className="text-xs font-medium text-emerald-700">Registros Ingeridos na API</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {(summary?.totalBrokersIngested || 0) + (summary?.totalRulesIngested || 0)}
          </p>
          <span className="text-[11px] text-slate-400">
            {summary?.totalBrokersIngested || 0} corretores • {summary?.totalRulesIngested || 0} regras
          </span>
        </div>
      </div>

      {/* Comparativo de Higienização Pandas (Antes vs. Depois) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4" />
              Dado Bruto no HTML Legado (Sujo / Duplicado)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              legacy_portal.html
            </span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 text-rose-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`[
  {
    "name": "   Atlas Corretora e Consultoria de Saúde S.A.  ",
    "documentNumber": "45.781.902/0001-63",
    "email": "FINANCEIRO@ATLASSAUDE.COM.BR",
    "phone": "(11) 99123-4567"
  },
  // LINHA DUPLICADA NO SISTEMA LEGADO:
  {
    "name": "Atlas Corretora e Consultoria de Saúde S.A.",
    "documentNumber": "45781902000163",
    "email": "financeiro@atlassaude.com.br"
  },
  // REGRA COM MOEDA E TEXTO MISTURADOS:
  {
    "ruleCode": " reg-porto-pro-05 ",
    "agencyPercentage": "R$ 220,00 %",
    "agencyInstallments": "1ª Parcela",
    "effectiveFrom": "01/01/2026"
  }
]`}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-emerald-200/80 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Filter className="w-4 h-4" />
              Payload Higienizado pelo Pandas (Pronto p/ API)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              rpa/scripts/sanitizer.py
            </span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`{
  "duplicatesRemoved": 2,
  "brokers": [
    {
      "personType": "PJ",
      "name": "Atlas Corretora e Consultoria de Saúde S.A.",
      "documentNumber": "45781902000163",
      "email": "financeiro@atlassaude.com.br",
      "phone": "11991234567"
    }
  ],
  "rules": [
    {
      "ruleCode": "REG-PORTO-PRO-05",
      "agencyPercentage": 220.00,
      "agencyInstallments": 1,
      "effectiveFrom": "2026-01-01"
    }
  ]
}`}
          </pre>
        </div>
      </div>

      {/* Histórico e Logs de Execução RPA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            Histórico de Execuções & Auditoria de Ingestão RPA ({jobs.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Carregando histórico de jobs RPA...
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {job.jobCode}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {job.sourcePortal}
                      </p>
                      <p className="text-xs text-slate-500">
                        Modo: <code className="font-mono">{job.triggerMode}</code> • Duração:{' '}
                        <strong className="font-mono">{job.durationMs} ms</strong> •{' '}
                        {new Date(job.executedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                      Brutos: {job.rawBrokersCount + job.rawRulesCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
                      Duplicatas Removidas: {job.duplicatesRemoved}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      +{job.brokersIngested} Corretores / +{job.rulesIngested} Regras
                    </span>
                  </div>
                </div>

                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {job.executionLog}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

