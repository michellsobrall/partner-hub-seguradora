import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  FileCheck2,
  RotateCcw,
  Send,
  CheckCircle2,
  Clock,
  Lock,
  AlertOctagon,
  Sparkles,
  Upload,
  Check,
  X,
  Webhook,
  PlusCircle,
  Mail,
  BellRing,
} from 'lucide-react';
import {
  BrokerInvoiceDto,
  ClawbackResponseDto,
  EmailNotificationDto,
  FinanceSummaryDto,
  IntegrationStatusDto,
  PayoutSettlementDto,
} from '@/types/finance';
import { BrokerDto } from '@/types/onboarding';
import { fetchBrokers } from '@/services/onboardingApi';
import {
  cancelClawback,
  createClawback,
  fetchClawbacks,
  fetchEmailNotifications,
  fetchFinanceSummary,
  fetchIntegrationStatus,
  fetchInvoices,
  fetchSettlements,
  getInvoiceDownloadUrl,
  reviewBrokerInvoice,
  simulateAsaasWebhook,
  triggerBatchPayout,
  triggerNfseEmailReminders,
  triggerSinglePayout,
  uploadBrokerInvoice,
} from '@/services/financeApi';

function formatBRL(val: number | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

export const FinanceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'SETTLEMENTS' | 'INVOICES' | 'CLAWBACKS' | 'EMAILS'
  >('SETTLEMENTS');

  // Data state
  const [summary, setSummary] = useState<FinanceSummaryDto | null>(null);
  const [settlements, setSettlements] = useState<PayoutSettlementDto[]>([]);
  const [invoices, setInvoices] = useState<BrokerInvoiceDto[]>([]);
  const [clawbacks, setClawbacks] = useState<ClawbackResponseDto[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailNotificationDto[]>([]);
  const [integrationStatus, setIntegrationStatus] =
    useState<IntegrationStatusDto | null>(null);
  const [brokers, setBrokers] = useState<BrokerDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // NFS-e Upload Form state
  const [invBrokerId, setInvBrokerId] = useState('');
  const [invMonth, setInvMonth] = useState('2026-10');
  const [invNumber, setInvNumber] = useState('');
  const [invCode, setInvCode] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invFile, setInvFile] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  // Clawback Form state
  const [cbBrokerId, setCbBrokerId] = useState('');
  const [cbProposal, setCbProposal] = useState('');
  const [cbBeneficiary, setCbBeneficiary] = useState('');
  const [cbMonth, setCbMonth] = useState('2026-10');
  const [cbAmount, setCbAmount] = useState('');
  const [cbReason, setCbReason] = useState(
    'Inadimplência / Cancelamento de vidas em período de carência (90 dias).'
  );
  const [savingClawback, setSavingClawback] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, setList, invList, cbList, brokerList, intStatus, mailList] =
        await Promise.all([
          fetchFinanceSummary(),
          fetchSettlements(),
          fetchInvoices(),
          fetchClawbacks(),
          fetchBrokers('ALL'),
          fetchIntegrationStatus(),
          fetchEmailNotifications(),
        ]);
      setSummary(sumData);
      setSettlements(setList);
      setInvoices(invList);
      setClawbacks(cbList);
      setBrokers(brokerList);
      setIntegrationStatus(intStatus);
      setEmailLogs(mailList);

      if (!invBrokerId && brokerList.length > 0) {
        const firstPj = brokerList.find((b) => b.personType === 'PJ') || brokerList[0];
        setInvBrokerId(firstPj.id);
        setCbBrokerId(firstPj.id);
      }
    } catch (err) {
      console.error('Erro ao carregar módulo financeiro:', err);
    } finally {
      setLoading(false);
    }
  }, [invBrokerId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleBatchPayout = async () => {
    setProcessingAction(true);
    try {
      const res = await triggerBatchPayout();
      showToast(
        `${res.length} transferência(s) Pix/TED disparada(s) para a API do Asaas!`
      );
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao processar lote Asaas');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSinglePayout = async (settlementId: string) => {
    setProcessingAction(true);
    try {
      const res = await triggerSinglePayout(settlementId);
      showToast(`Ordem ${res.transferMethod} enviada ao Asaas (${res.asaasTransferId})!`);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar pagamento');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleWebhookConfirm = async (asaasTransferId: string) => {
    setProcessingAction(true);
    try {
      await simulateAsaasWebhook(asaasTransferId, 'TRANSFER_COMPLETED');
      showToast(
        `Webhook Asaas (TRANSFER_COMPLETED) processado! Liquidação concluída.`
      );
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao simular webhook');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUploadInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invFile || !invBrokerId) return;

    setUploadingInvoice(true);
    try {
      await uploadBrokerInvoice({
        brokerId: invBrokerId,
        referenceMonth: invMonth,
        invoiceNumber: invNumber,
        verificationCode: invCode,
        grossAmount: Number(invAmount),
        file: invFile,
      });
      setInvNumber('');
      setInvCode('');
      setInvFile(null);
      showToast('NFS-e enviada com sucesso! Aprove na lista ao lado para liberar o lote.');
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar NFS-e');
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleReviewInvoice = async (
    invoiceId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      await reviewBrokerInvoice(
        invoiceId,
        status,
        status === 'APPROVED'
          ? 'NFS-e conferida e validada. Pagamento liberado para o Asaas.'
          : 'NFS-e divergente do valor apurado.'
      );
      showToast(
        status === 'APPROVED'
          ? 'NFS-e Aprovada! Trava fiscal desbloqueada (READY_TO_PAY).'
          : 'NFS-e rejeitada.'
      );
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao avaliar NFS-e');
    }
  };

  const handleCreateClawback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClawback(true);
    try {
      await createClawback({
        brokerId: cbBrokerId,
        proposalNumber: cbProposal,
        beneficiaryName: cbBeneficiary,
        referenceMonth: cbMonth,
        debitAmount: Number(cbAmount),
        reason: cbReason,
      });
      setCbProposal('');
      setCbBeneficiary('');
      setCbAmount('');
      showToast('Débito de Clawback lançado e abatido automaticamente no lote!');
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao lançar estorno');
    } finally {
      setSavingClawback(false);
    }
  };

  const handleCancelClawback = async (id: string) => {
    try {
      await cancelClawback(id);
      showToast('Estorno cancelado e saldo recomputado no fechamento!');
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar estorno');
    }
  };

  const handleTriggerNfseEmails = async () => {
    setProcessingAction(true);
    try {
      const sent = await triggerNfseEmailReminders('2026-10');
      showToast(
        sent.length > 0
          ? `${sent.length} e-mail(s) de alerta de prazo de NFS-e (3 dias) disparado(s) com sucesso!`
          : 'Todas as corretoras PJ com saldo apurado já enviaram a NFS-e da competência!'
      );
      await loadAll();
      setActiveTab('EMAILS');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao disparar lembretes de NFS-e');
    } finally {
      setProcessingAction(false);
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
            Sprint 03 • Liquidação & Compliance Fiscal
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Gestão Financeira, Asaas (Pix/TED), NFS-e & Clawback
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trava fiscal automática para PJ sem NFS-e, abatimento de estornos por inadimplência e disparo em lote Asaas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBatchPayout}
            disabled={processingAction || (summary?.readyToPayCount || 0) === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Liquidar Lote Liberado via Asaas ({summary?.readyToPayCount || 0})
          </button>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('SETTLEMENTS')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'SETTLEMENTS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-600" />
              Fechamentos & Asaas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INVOICES')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'INVOICES'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              Notas Fiscais NFS-e ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CLAWBACKS')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'CLAWBACKS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              Estornos / Clawback ({clawbacks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('EMAILS')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'EMAILS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              E-mails & Alertas ({emailLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-medium text-slate-500">Comissão Bruta Consolidada</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatBRL(summary?.totalGrossCommission)}
          </p>
          <span className="text-[11px] text-slate-400">
            {summary?.awaitingInvoiceCount || 0} lote(s) retido(s) aguardando NFS-e PJ
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-subtle">
          <span className="text-xs font-medium text-rose-700">Retenções Clawback / Estornos</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            - {formatBRL(summary?.totalClawbackDeductions)}
          </p>
          <span className="text-[11px] text-slate-400">
            Abatimento automático por inadimplência
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-subtle">
          <span className="text-xs font-medium text-indigo-700">Líquido Liberado p/ Pagamento</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {formatBRL(summary?.totalReadyToPayNet)}
          </p>
          <span className="text-[11px] text-slate-400">
            {summary?.readyToPayCount || 0} corretor(es) apto(s) para Pix/TED
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-subtle">
          <span className="text-xs font-medium text-emerald-700">Total Liquidado (Asaas API)</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatBRL(summary?.totalPaidViaAsaas)}
          </p>
          <span className="text-[11px] text-slate-400">
            {summary?.paidSettlementsCount || 0} transferência(s) processada(s)
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUB-TAB 1: FECHAMENTOS E LIQUIDAÇÃO EM LOTE ASAAS                 */}
      {/* ================================================================= */}
      {activeTab === 'SETTLEMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Folha de Fechamento Mensal de Comissões & Liquidação Asaas
              </h3>
              <p className="text-xs text-slate-500">
                Corretores PJ permanecem bloqueados com Trava Fiscal até que a NFS-e da competência seja enviada e aprovada.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Corretor & Domicílio Pix/TED</th>
                  <th className="py-3.5 px-4">Comp.</th>
                  <th className="py-3.5 px-4">Bruto Apurado</th>
                  <th className="py-3.5 px-4">Clawback</th>
                  <th className="py-3.5 px-4">Líquido a Pagar</th>
                  <th className="py-3.5 px-4">Validação Fiscal NFS-e</th>
                  <th className="py-3.5 px-4">Status Asaas</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      Consolidando fechamentos financeiros...
                    </td>
                  </tr>
                ) : settlements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      Nenhum fechamento disponível.
                    </td>
                  </tr>
                ) : (
                  settlements.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.personType === 'PJ'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.personType}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {item.brokerName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.bankSummary} • <span className="font-mono">{item.pixSummary}</span>
                        </p>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-700">
                        {item.referenceMonth}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-slate-700">
                        {formatBRL(item.grossCommission)}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs font-semibold text-rose-600">
                        {item.clawbackDeduction > 0
                          ? `- ${formatBRL(item.clawbackDeduction)}`
                          : 'R$ 0,00'}
                      </td>

                      <td className="py-4 px-4 font-mono text-sm font-bold text-slate-900">
                        {formatBRL(item.netPayoutAmount)}
                      </td>

                      <td className="py-4 px-4">
                        {item.personType === 'PF' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            PF Isento de NFS-e
                          </span>
                        ) : item.invoiceStatus === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            NF #{item.invoiceNumber} Aprovada
                          </span>
                        ) : item.invoiceStatus === 'PENDING_REVIEW' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            NF #{item.invoiceNumber} em Análise
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                            <Lock className="w-3.5 h-3.5 text-rose-600" />
                            Trava PJ: Sem NFS-e
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {item.status === 'PAID' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              <CheckCircle2 className="w-3 h-3" />
                              Liquidado ({item.transferMethod})
                            </span>
                            <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                              {item.asaasTransferId}
                            </span>
                          </div>
                        ) : item.status === 'PROCESSING_ASAAS' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                              <Clock className="w-3 h-3" />
                              Processando Asaas
                            </span>
                            <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                              {item.asaasTransferId}
                            </span>
                          </div>
                        ) : item.status === 'READY_TO_PAY' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                            Pronto p/ Asaas ({item.transferMethod})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                            Bloqueado (Falta NF)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {item.status === 'AWAITING_INVOICE' && (
                          <button
                            type="button"
                            onClick={() => {
                              setInvBrokerId(item.brokerId);
                              setInvMonth(item.referenceMonth);
                              setInvAmount(String(item.netPayoutAmount));
                              setActiveTab('INVOICES');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Enviar/Aprovar NF
                          </button>
                        )}

                        {item.status === 'READY_TO_PAY' && (
                          <button
                            type="button"
                            disabled={processingAction}
                            onClick={() => handleSinglePayout(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Disparar {item.transferMethod}
                          </button>
                        )}

                        {item.status === 'PROCESSING_ASAAS' && item.asaasTransferId && (
                          <button
                            type="button"
                            disabled={processingAction}
                            onClick={() => handleWebhookConfirm(item.asaasTransferId!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Simular recebimento do Webhook TRANSFER_COMPLETED do Asaas"
                          >
                            <Webhook className="w-3.5 h-3.5" />
                            Confirmar Webhook
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: PORTAL DE ENVIO E VALIDAÇÃO DE NFS-e (PJ)              */}
      {/* ================================================================= */}
      {activeTab === 'INVOICES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload de NFS-e */}
          <form
            onSubmit={handleUploadInvoice}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4 self-start"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Portal de Envio de NFS-e (Corretor PJ)
              </h3>
              <p className="text-[11px] text-slate-500">
                Envie o PDF ou XML da Nota Fiscal para liberar o pagamento do lote.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corretora Parceira (PJ) *
              </label>
              <select
                value={invBrokerId}
                onChange={(e) => setInvBrokerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.personType}] {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Competência *
                </label>
                <input
                  type="month"
                  required
                  value={invMonth}
                  onChange={(e) => setInvMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nº da NFS-e *
                </label>
                <input
                  type="text"
                  required
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  placeholder="Ex.: 2026000184"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cód. Verificação
                </label>
                <input
                  type="text"
                  value={invCode}
                  onChange={(e) => setInvCode(e.target.value)}
                  placeholder="Ex.: A9F2-881B"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor da Nota (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  placeholder="29812.50"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arquivo da NFS-e (PDF ou XML) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.xml,.png,.jpg"
                onChange={(e) => setInvFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
              />
            </div>

            <button
              type="submit"
              disabled={!invFile || uploadingInvoice}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploadingInvoice ? 'Enviando NFS-e...' : 'Protocolar NFS-e no Portal'}
            </button>
          </form>

          {/* Mesa de Conferência Fiscal de NFS-e */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Mesa de Validação Fiscal de NFS-e ({invoices.length})
              </h3>
            </div>

            {invoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Nenhuma Nota Fiscal enviada ainda. Envie uma NFS-e no formulário ao lado para desbloquear o lote PJ!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          NFS-e #{inv.invoiceNumber}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {inv.brokerName}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          (Comp. {inv.referenceMonth})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Valor Declarado:{' '}
                        <strong className="font-mono text-slate-900">
                          {formatBRL(inv.grossAmount)}
                        </strong>{' '}
                        • Arquivo: {inv.originalFilename}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        SHA-256: {inv.sha256Hash}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getInvoiceDownloadUrl(inv.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Abrir Arquivo
                      </a>

                      {inv.status === 'PENDING_REVIEW' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReviewInvoice(inv.id, 'APPROVED')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aprovar & Liberar Lote
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewInvoice(inv.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            inv.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {inv.status === 'APPROVED' ? 'NFS-e Aprovada' : 'Glosada'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: CONTROLE DE ESTORNOS / CLAWBACK                        */}
      {/* ================================================================= */}
      {activeTab === 'CLAWBACKS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lançamento de Clawback */}
          <form
            onSubmit={handleCreateClawback}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4 self-start"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-rose-600" />
                Lançar Débito de Estorno (Clawback)
              </h3>
              <p className="text-[11px] text-slate-500">
                Registra glosa por inadimplência ou cancelamento em carência, descontando automaticamente do lote.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corretor Parceiro *
              </label>
              <select
                value={cbBrokerId}
                onChange={(e) => setCbBrokerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.documentNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nº Proposta *
                </label>
                <input
                  type="text"
                  required
                  value={cbProposal}
                  onChange={(e) => setCbProposal(e.target.value)}
                  placeholder="PROP-2026-9001"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Competência *
                </label>
                <input
                  type="month"
                  required
                  value={cbMonth}
                  onChange={(e) => setCbMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Beneficiário / Empresa Cancelada *
              </label>
              <input
                type="text"
                required
                value={cbBeneficiary}
                onChange={(e) => setCbBeneficiary(e.target.value)}
                placeholder="Ex.: Metalúrgica Alvorada Ltda"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor do Estorno a Descontar (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={cbAmount}
                onChange={(e) => setCbAmount(e.target.value)}
                placeholder="850.00"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo / Justificativa *
              </label>
              <textarea
                rows={2}
                required
                value={cbReason}
                onChange={(e) => setCbReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={savingClawback}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {savingClawback ? 'Registrando Débito...' : 'Aplicar Clawback no Fechamento'}
            </button>
          </form>

          {/* Histórico de Estornos / Clawbacks */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Registros de Clawback / Glosas por Inadimplência ({clawbacks.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {clawbacks.map((cb) => (
                <div
                  key={cb.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {cb.proposalNumber} • Comp. {cb.referenceMonth}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {cb.brokerName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Estipulante: {cb.beneficiaryName}
                    </p>
                    <p className="text-xs text-slate-500">{cb.reason}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-bold text-rose-600">
                      - {formatBRL(cb.debitAmount)}
                    </span>

                    {cb.status === 'PENDING_DEDUCTION' ? (
                      <button
                        type="button"
                        onClick={() => handleCancelClawback(cb.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        Anular Glosa
                      </button>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                        {cb.status === 'DEDUCTED' ? 'Descontado no Lote' : 'Cancelado'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: MOTOR DE E-MAILS (SMTP / SENDGRID) & STATUS ASAAS LIVE     */}
      {/* ================================================================= */}
      {activeTab === 'EMAILS' && (
        <div className="space-y-6">
          {/* Status das Chaves Reais (.env) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Gateway de Pagamentos Asaas v3 (ASAAS_API_KEY)
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    integrationStatus?.asaasLiveKeyConfigured
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {integrationStatus?.asaasLiveKeyConfigured
                    ? 'Chave Real Ativa (.env)'
                    : 'Modo Sandbox Inteligente'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Endpoint configurado:{' '}
                <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                  {integrationStatus?.asaasApiUrl || 'https://sandbox.asaas.com/api/v3'}
                </code>
              </p>
              <p className="text-[11px] text-slate-500">
                Para disparar Pix/TED reais na sua conta Asaas, basta preencher a variável{' '}
                <code className="font-mono font-semibold text-slate-700">ASAAS_API_KEY</code> no arquivo{' '}
                <code className="font-mono font-semibold text-slate-700">.env</code> da raiz.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Motor de E-mails Transacionais (SMTP / SendGrid)
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    integrationStatus?.emailLiveConfigured
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {integrationStatus?.emailProvider || 'SMTP_SANDBOX_OUTBOX'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Remetente oficial:{' '}
                <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                  {integrationStatus?.emailFromAddress || 'no-reply@partnerhub.com.br'}
                </code>{' '}
                • Prazo limite NFS-e: <strong>Dia 0{integrationStatus?.nfseDeadlineDay || 5}</strong>
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Gatilhos ativos: <strong>Contrato Aprovado</strong> &{' '}
                  <strong>Faltam 3 dias p/ NFS-e</strong>
                </span>
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={handleTriggerNfseEmails}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 shadow-sm transition-all"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  Disparar Alerta NFS-e (Prazo 3 Dias)
                </button>
              </div>
            </div>
          </div>

          {/* Lista Auditável de E-mails Disparados */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Fila & Histórico de E-mails Automáticos Disparados ({emailLogs.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de todas as notificações automáticas de homologação de contrato, lembrete de 3 dias de NFS-e e comprovantes Pix.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {emailLogs.map((item) => (
                <div
                  key={item.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.templateCode === 'CONTRACT_APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.templateCode === 'NFSE_DEADLINE_3_DAYS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {item.templateCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {item.subject}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.bodyPreview}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Destinatário:{' '}
                      <strong className="text-slate-700">{item.recipientName}</strong> (
                      <code className="font-mono text-indigo-600">{item.recipientEmail}</code>)
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 shrink-0 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.deliveryStatus} ({item.provider})
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(item.sentAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

