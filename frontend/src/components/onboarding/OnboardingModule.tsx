import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  ShieldCheck,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Building2,
  User,
  Landmark,
  Upload,
  Fingerprint,
  Eye,
  ArrowRight,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  AccountType,
  BrokerDto,
  BrokerStatsDto,
  DocumentType,
  OnboardingStatus,
  PersonType,
  PixKeyType,
} from '@/types/onboarding';
import {
  createBrokerOnboarding,
  fetchBrokers,
  fetchBrokerStats,
  getContractPdfUrl,
  getDocumentDownloadUrl,
  signBrokerContract,
  updateBrokerStatus,
  uploadBrokerDocument,
} from '@/services/onboardingApi';

const COMMON_BANKS = [
  { code: '341', name: 'Itaú Unibanco' },
  { code: '033', name: 'Banco Santander' },
  { code: '237', name: 'Bradesco' },
  { code: '001', name: 'Banco do Brasil' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '260', name: 'Nu Pagamentos (Nubank)' },
  { code: '077', name: 'Banco Inter' },
  { code: '336', name: 'Banco C6' },
  { code: '208', name: 'BTG Pactual' },
];

function formatDocument(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

function getStatusBadge(status: OnboardingStatus) {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Aprovado
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          Em Análise
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejeitado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pendente
        </span>
      );
  }
}

export const OnboardingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BACKOFFICE' | 'WIZARD'>('BACKOFFICE');

  // Backoffice state
  const [brokers, setBrokers] = useState<BrokerDto[]>([]);
  const [stats, setStats] = useState<BrokerStatsDto>({
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
  });
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerDto | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [personType, setPersonType] = useState<PersonType>('PJ');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [susepCode, setSusepCode] = useState('');

  // Bank state
  const [bankCode, setBankCode] = useState('341');
  const [bankName, setBankName] = useState('Itaú Unibanco');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CNPJ');
  const [pixKey, setPixKey] = useState('');

  // Document files for upload
  const [docRgCnh, setDocRgCnh] = useState<File | null>(null);
  const [docAddress, setDocAddress] = useState<File | null>(null);
  const [docSocialContract, setDocSocialContract] = useState<File | null>(null);

  // Active onboarding broker (Step 2 & Step 3)
  const [createdBroker, setCreatedBroker] = useState<BrokerDto | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submittingWizard, setSubmittingWizard] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadBackofficeData = useCallback(async () => {
    setLoadingList(true);
    try {
      const [brokerList, statsData] = await Promise.all([
        fetchBrokers(statusFilter, searchQuery),
        fetchBrokerStats(),
      ]);
      setBrokers(brokerList);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar corretores:', err);
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadBackofficeData();
  }, [loadBackofficeData]);

  const handleBankPresetChange = (code: string) => {
    setBankCode(code);
    const found = COMMON_BANKS.find((b) => b.code === code);
    if (found) {
      setBankName(found.name);
    }
  };

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);
    setSubmittingWizard(true);

    try {
      const created = await createBrokerOnboarding({
        personType,
        name,
        tradeName: personType === 'PJ' ? tradeName : undefined,
        documentNumber,
        email,
        phone,
        susepCode,
        bankAccount: {
          bankCode,
          bankName,
          agency,
          accountNumber,
          accountType,
          pixKeyType: pixKey ? pixKeyType : undefined,
          pixKey: pixKey || undefined,
        },
      });

      // Upload attached documents if selected
      const uploads: Promise<unknown>[] = [];
      if (docRgCnh) {
        uploads.push(uploadBrokerDocument(created.id, 'RG_CNH', docRgCnh));
      }
      if (docAddress) {
        uploads.push(uploadBrokerDocument(created.id, 'ADDRESS_PROOF', docAddress));
      }
      if (docSocialContract && personType === 'PJ') {
        uploads.push(uploadBrokerDocument(created.id, 'SOCIAL_CONTRACT', docSocialContract));
      }
      if (uploads.length > 0) {
        await Promise.all(uploads);
      }

      setCreatedBroker(created);
      setSignerName(created.name);
      setSignerDocument(formatDocument(created.documentNumber));
      setWizardStep(2);
      showToast('Cadastro registrado e minuta contratual gerada com sucesso!');
      loadBackofficeData();
    } catch (err) {
      setWizardError(
        err instanceof Error ? err.message : 'Erro ao registrar cadastro do corretor.'
      );
    } finally {
      setSubmittingWizard(false);
    }
  };

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdBroker) return;

    setWizardError(null);
    setSubmittingWizard(true);
    try {
      const signedBroker = await signBrokerContract(createdBroker.id, {
        acceptedTerms,
        signerName,
        signerDocument,
      });
      setCreatedBroker(signedBroker);
      setWizardStep(3);
      showToast('Contrato assinado digitalmente com registro SHA-256 e IP!');
      loadBackofficeData();
    } catch (err) {
      setWizardError(
        err instanceof Error ? err.message : 'Falha ao assinar eletronicamente o contrato.'
      );
    } finally {
      setSubmittingWizard(false);
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setName('');
    setTradeName('');
    setDocumentNumber('');
    setEmail('');
    setPhone('');
    setSusepCode('');
    setAgency('');
    setAccountNumber('');
    setPixKey('');
    setDocRgCnh(null);
    setDocAddress(null);
    setDocSocialContract(null);
    setCreatedBroker(null);
    setAcceptedTerms(false);
    setWizardError(null);
  };

  const handleWorkflowAction = async (newStatus: OnboardingStatus) => {
    if (!selectedBroker) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateBrokerStatus(
        selectedBroker.id,
        newStatus,
        reviewNotesInput
      );
      setSelectedBroker(updated);
      showToast(`Status do corretor atualizado para ${newStatus}!`);
      await loadBackofficeData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleInspectBroker = (broker: BrokerDto) => {
    setSelectedBroker(broker);
    setReviewNotesInput(broker.reviewNotes || '');
  };

  const handleUploadInModal = async (docType: DocumentType, file: File) => {
    if (!selectedBroker) return;
    try {
      await uploadBrokerDocument(selectedBroker.id, docType, file);
      const updatedList = await fetchBrokers(statusFilter, searchQuery);
      setBrokers(updatedList);
      const refreshed = updatedList.find((b) => b.id === selectedBroker.id);
      if (refreshed) setSelectedBroker(refreshed);
      showToast('Documento anexado e hash SHA-256 calculado com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro no upload do documento');
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Top Navigation Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
            Sprint 01 • Módulo Operacional
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Onboarding de Corretores & Contratos Digitais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Credenciamento PF/PJ, domicílio bancário Pix, geração de contrato PDF e assinatura eletrônica SHA-256.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('BACKOFFICE')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'BACKOFFICE'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Mesa de Aprovação ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => {
              resetWizard();
              setActiveTab('WIZARD');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'WIZARD'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Novo Credenciamento
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: BACKOFFICE / WORKFLOW DE APROVAÇÃO                         */}
      {/* ================================================================= */}
      {activeTab === 'BACKOFFICE' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-medium text-slate-500">Total Cadastrados</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              <span className="text-[11px] text-slate-400">Base geral PF + PJ</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-200/70 shadow-subtle">
              <span className="text-xs font-medium text-amber-700">Pendentes de Aceite</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              <span className="text-[11px] text-slate-400">Aguardando Click-to-Sign</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-indigo-200/70 shadow-subtle">
              <span className="text-xs font-medium text-indigo-700">Em Análise Compliance</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.underReview}</p>
              <span className="text-[11px] text-slate-400">Prontos para homologação</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200/70 shadow-subtle">
              <span className="text-xs font-medium text-emerald-700">Parceiros Aprovados</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
              <span className="text-[11px] text-slate-400">Aptos a receber comissões</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'ALL', label: 'Todos' },
                  { id: 'PENDING', label: 'Pendentes' },
                  { id: 'UNDER_REVIEW', label: 'Em Análise' },
                  { id: 'APPROVED', label: 'Aprovados' },
                  { id: 'REJECTED', label: 'Rejeitados' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === item.id
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
                placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Brokers Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">Corretor / Parceiro</th>
                    <th className="py-3.5 px-4">CPF / CNPJ</th>
                    <th className="py-3.5 px-4">Domicílio Bancário & Pix</th>
                    <th className="py-3.5 px-4">Contrato Click-to-Sign</th>
                    <th className="py-3.5 px-4">Status Workflow</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingList ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        Carregando base de corretores...
                      </td>
                    </tr>
                  ) : brokers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        Nenhum corretor encontrado para o filtro selecionado.
                      </td>
                    </tr>
                  ) : (
                    brokers.map((broker) => (
                      <tr
                        key={broker.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                broker.personType === 'PJ'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {broker.personType}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">
                                {broker.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {broker.email} • {formatPhone(broker.phone)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-mono text-xs text-slate-700 font-medium block">
                            {formatDocument(broker.documentNumber)}
                          </span>
                          {broker.susepCode && (
                            <span className="text-[11px] text-slate-400">
                              SUSEP: {broker.susepCode}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {broker.bankAccount ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {broker.bankAccount.bankCode} - {broker.bankAccount.bankName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Ag {broker.bankAccount.agency} • CC {broker.bankAccount.accountNumber}
                              </p>
                              {broker.bankAccount.pixKey && (
                                <span className="inline-block mt-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  Pix ({broker.bankAccount.pixKeyType}): {broker.bankAccount.pixKey}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Não informado</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {broker.contract?.signed ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                                Assinado Digitalmente
                              </span>
                              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                {broker.contract.contractNumber} • IP {broker.contract.signerIp}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs font-medium text-amber-700">
                                Minuta Gerada (Não Assinada)
                              </span>
                              <p className="text-[11px] font-mono text-slate-400">
                                {broker.contract?.contractNumber}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">{getStatusBadge(broker.status)}</td>

                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <a
                              href={getContractPdfUrl(broker.id)}
                              target="_blank"
                              rel="noreferrer"
                              title="Baixar Contrato em PDF"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/70 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              PDF
                            </a>
                            <button
                              type="button"
                              onClick={() => handleInspectBroker(broker)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Analisar
                            </button>
                          </div>
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
      {/* TAB 2: WIZARD DE CREDENCIAMENTO & ASSINATURA DIGITAL              */}
      {/* ================================================================= */}
      {activeTab === 'WIZARD' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stepper Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  title: '1. Dados & Documentos',
                  desc: 'Qualificação PF/PJ, Banco/Pix e Anexos',
                },
                {
                  step: 2,
                  title: '2. Contrato PDF & Aceite',
                  desc: 'Revisão da minuta e Click-to-Sign SHA-256',
                },
                {
                  step: 3,
                  title: '3. Protocolo Emitido',
                  desc: 'Certificado de auditoria e envio à mesa',
                },
              ].map((item) => {
                const isCurrent = wizardStep === item.step;
                const isDone = wizardStep > item.step;
                return (
                  <div
                    key={item.step}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/40'
                        : isDone
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-200/70 bg-slate-50/50 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : item.step}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {wizardError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-2xl flex items-center gap-3 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{wizardError}</span>
            </div>
          )}

          {/* STEP 1: FORMULÁRIO COMPLETO */}
          {wizardStep === 1 && (
            <form onSubmit={handleSubmitStep1} className="space-y-6">
              {/* Bloco 1: Qualificação Cadastral */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-subtle space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Dados Cadastrais do Corretor Parceiro
                    </h3>
                  </div>

                  <div className="inline-flex p-1 rounded-xl bg-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setPersonType('PJ');
                        setPixKeyType('CNPJ');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        personType === 'PJ'
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Pessoa Jurídica (PJ)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPersonType('PF');
                        setPixKeyType('CPF');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        personType === 'PF'
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Pessoa Física (PF)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={personType === 'PF' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {personType === 'PJ' ? 'Razão Social Completa *' : 'Nome Completo *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        personType === 'PJ'
                          ? 'Ex.: Alpha Corretora de Planos de Saúde Ltda'
                          : 'Ex.: Carlos Eduardo Mendes'
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {personType === 'PJ' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nome Fantasia
                      </label>
                      <input
                        type="text"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        placeholder="Ex.: Alpha Benefícios"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {personType === 'PJ' ? 'CNPJ *' : 'CPF *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(formatDocument(e.target.value))}
                      placeholder={
                        personType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'
                      }
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Registro SUSEP (Opcional)
                    </label>
                    <input
                      type="text"
                      value={susepCode}
                      onChange={(e) => setSusepCode(e.target.value)}
                      placeholder="Ex.: 202031948"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      E-mail Oficial para Faturas & Contratos *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="financeiro@corretora.com.br"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(11) 99999-0000"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Domicílio Bancário & Pix */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-subtle space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <Landmark className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Dados Bancários para Liquidação de Comissões (Asaas Pix/TED)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      A conta bancária deve pertencer à mesma titularidade ({personType}) informada acima.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Banco *
                    </label>
                    <select
                      value={bankCode}
                      onChange={(e) => handleBankPresetChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {COMMON_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Agência (sem dígito) *
                    </label>
                    <input
                      type="text"
                      required
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      placeholder="0001"
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Conta com Dígito *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="123456-7"
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Modalidade da Conta *
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as AccountType)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="CHECKING">Conta Corrente</option>
                      <option value="SAVINGS">Conta Poupança</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tipo de Chave Pix
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="PHONE">Celular</option>
                      <option value="RANDOM">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Chave Pix para Recebimento
                    </label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Informe a chave Pix..."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 3: Upload de Documentos Comprobatórios */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-subtle space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Dossiê Documental (KYC & Compliance)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Anexe documentos em PDF, PNG ou JPG. Cada arquivo recebe verificação de integridade SHA-256.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      1. RG ou CNH do Responsável
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setDocRgCnh(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      2. Comprovante de Endereço
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setDocAddress(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>

                  {personType === 'PJ' && (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        3. Contrato Social / Cartão CNPJ
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => setDocSocialContract(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('BACKOFFICE')}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingWizard}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                >
                  {submittingWizard
                    ? 'Gerando Minuta Contratual...'
                    : 'Avançar para Contrato & Assinatura Digital'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: REVISÃO DE CONTRATO E CLICK-TO-SIGN */}
          {wizardStep === 2 && createdBroker && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    MINUTA Nº {createdBroker.contract?.contractNumber}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Contrato de Parceria Comercial & Comissionamento
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confira os termos gerados dinamicamente e realize o aceite eletrônico Click-to-Sign.
                  </p>
                </div>

                <a
                  href={getContractPdfUrl(createdBroker.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shrink-0"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  Visualizar / Baixar PDF Oficial
                </a>
              </div>

              {/* Caixa de Texto do Contrato */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/80 max-h-80 overflow-y-auto font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {createdBroker.contract?.termsText}
              </div>

              {/* Hash SHA-256 Preview */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                  <Fingerprint className="w-4 h-4 text-indigo-600 shrink-0" />
                  Resumo Criptográfico SHA-256 da Minuta:
                </div>
                <code className="text-[11px] font-mono text-indigo-700 break-all">
                  {createdBroker.contract?.documentHashSha256}
                </code>
              </div>

              {/* Formulário de Assinatura Eletrônica */}
              <form onSubmit={handleSignContract} className="space-y-5 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nome Completo do Signatário Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      CPF / CNPJ do Signatário *
                    </label>
                    <input
                      type="text"
                      required
                      value={signerDocument}
                      onChange={(e) => setSignerDocument(formatDocument(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    Declaro que li e concordo integralmente com as cláusulas do{' '}
                    <strong>Contrato de Parceria Comercial ({createdBroker.contract?.contractNumber})</strong>,
                    reconhecendo esta assinatura eletrônica (Click-to-Sign) com registro de IP,
                    User-Agent, Carimbo de Tempo UTC e Hash SHA-256 como juridicamente válida.
                  </span>
                </label>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={!acceptedTerms || submittingWizard}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                  >
                    <Fingerprint className="w-4 h-4" />
                    {submittingWizard
                      ? 'Registrando Assinatura Digital...'
                      : 'Assinar Contrato Digitalmente (Click-to-Sign)'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: CERTIFICADO DE ASSINATURA CONCLUÍDA */}
          {wizardStep === 3 && createdBroker && (
            <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-card space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    Credenciamento Concluído • Em Análise de Compliance
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Contrato Assinado Eletronicamente com Sucesso!
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block">Número do Contrato</span>
                  <span className="font-mono font-bold text-slate-900">
                    {createdBroker.contract?.contractNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Signatário Autenticado</span>
                  <span className="font-semibold text-slate-900">
                    {createdBroker.contract?.signerName} ({createdBroker.contract?.signerDocument})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Endereço IP Capturado</span>
                  <span className="font-mono text-slate-800">
                    {createdBroker.contract?.signerIp}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Carimbo de Tempo (UTC)</span>
                  <span className="font-mono text-slate-800">
                    {createdBroker.contract?.signedAt}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-400 block">Hash Criptográfico SHA-256 Definitivo</span>
                  <code className="font-mono text-[11px] text-emerald-700 break-all">
                    {createdBroker.contract?.documentHashSha256}
                  </code>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <a
                  href={getContractPdfUrl(createdBroker.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Baixar Contrato Assinado em PDF
                </a>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetWizard}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Cadastrar Outro Corretor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('BACKOFFICE')}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Ir para Mesa de Aprovação
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL DE INSPEÇÃO E DELIBERAÇÃO DE WORKFLOW (BACKOFFICE)          */}
      {/* ================================================================= */}
      {selectedBroker && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {selectedBroker.personType}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedBroker.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatDocument(selectedBroker.documentNumber)} •{' '}
                    {selectedBroker.contract?.contractNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedBroker.status)}
                <button
                  type="button"
                  onClick={() => setSelectedBroker(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2 py-1"
                >
                  Fechar ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
              {/* Dados Cadastrais & Bancários */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    Qualificação & Contato
                  </span>
                  <p>
                    <span className="text-slate-400">E-mail:</span>{' '}
                    <span className="font-medium text-slate-800">{selectedBroker.email}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Telefone:</span>{' '}
                    <span className="font-medium text-slate-800">
                      {formatPhone(selectedBroker.phone)}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">SUSEP:</span>{' '}
                    <span className="font-medium text-slate-800">
                      {selectedBroker.susepCode || 'Não informado'}
                    </span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                    Domicílio Bancário & Pix
                  </span>
                  {selectedBroker.bankAccount ? (
                    <>
                      <p>
                        <span className="text-slate-400">Instituição:</span>{' '}
                        <span className="font-semibold text-slate-800">
                          {selectedBroker.bankAccount.bankCode} -{' '}
                          {selectedBroker.bankAccount.bankName}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Agência / Conta:</span>{' '}
                        <span className="font-mono text-slate-800">
                          Ag {selectedBroker.bankAccount.agency} • CC{' '}
                          {selectedBroker.bankAccount.accountNumber} (
                          {selectedBroker.bankAccount.accountType})
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Chave Pix:</span>{' '}
                        <span className="font-mono text-indigo-700 font-medium">
                          {selectedBroker.bankAccount.pixKey
                            ? `${selectedBroker.bankAccount.pixKeyType}: ${selectedBroker.bankAccount.pixKey}`
                            : 'Não cadastrada'}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-400">Sem conta vinculada</p>
                  )}
                </div>
              </div>

              {/* Trilha de Auditoria do Contrato Digital */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-indigo-600" />
                    Auditoria do Contrato Digital ({selectedBroker.contract?.contractNumber})
                  </span>
                  <a
                    href={getContractPdfUrl(selectedBroker.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    Abrir Contrato PDF
                  </a>
                </div>

                {selectedBroker.contract?.signed ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/70">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Signatário</span>
                      <span className="font-semibold text-slate-800">
                        {selectedBroker.contract.signerName} (
                        {formatDocument(selectedBroker.contract.signerDocument || '')})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">IP / Data UTC</span>
                      <span className="font-mono text-slate-800">
                        {selectedBroker.contract.signerIp} •{' '}
                        {selectedBroker.contract.signedAt
                          ? new Date(selectedBroker.contract.signedAt).toLocaleString('pt-BR')
                          : ''}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Hash SHA-256</span>
                      <code className="font-mono text-[11px] text-emerald-800 break-all">
                        {selectedBroker.contract.documentHashSha256}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-between">
                    <span className="text-xs text-amber-800">
                      Este contrato ainda aguarda o aceite eletrônico (Click-to-Sign).
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedBroker(selectedBroker);
                        setSignerName(selectedBroker.name);
                        setSignerDocument(formatDocument(selectedBroker.documentNumber));
                        setSelectedBroker(null);
                        setActiveTab('WIZARD');
                        setWizardStep(2);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700"
                    >
                      Coletar Assinatura Agora
                    </button>
                  </div>
                )}
              </div>

              {/* Documentos Comprobatórios Anexados */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-900 block">
                  Dossiê de Documentos Enviados ({selectedBroker.documents.length})
                </span>

                {selectedBroker.documents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhum documento anexado até o momento. Você pode anexar abaixo:
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedBroker.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-indigo-700 mr-2">
                            [{doc.documentType}]
                          </span>
                          <span className="font-medium text-slate-800">
                            {doc.originalFilename}
                          </span>
                          <span className="text-slate-400 ml-2">
                            ({(doc.fileSize / 1024).toFixed(1)} KB)
                          </span>
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                            SHA-256: {doc.sha256Hash}
                          </p>
                        </div>
                        <a
                          href={getDocumentDownloadUrl(selectedBroker.id, doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Visualizar
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload rápido complementar no Backoffice */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {(
                    [
                      { type: 'RG_CNH', label: '+ Anexar RG/CNH' },
                      { type: 'ADDRESS_PROOF', label: '+ Comprovante Endereço' },
                      { type: 'SOCIAL_CONTRACT', label: '+ Contrato Social' },
                    ] as const
                  ).map((btn) => (
                    <label
                      key={btn.type}
                      className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {btn.label}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadInModal(btn.type, f);
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Parecer e Deliberação de Compliance */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-900">
                  Parecer da Mesa de Compliance / Observações Internas
                </label>
                <textarea
                  rows={2}
                  value={reviewNotesInput}
                  onChange={(e) => setReviewNotesInput(e.target.value)}
                  placeholder="Registre o parecer de conferência documental, SUSEP e titularidade bancária..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleWorkflowAction('UNDER_REVIEW')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    Mover para Em Análise
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleWorkflowAction('REJECTED')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Rejeitar Cadastro
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleWorkflowAction('APPROVED')}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                    >
                      Aprovar & Homologar Corretor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

