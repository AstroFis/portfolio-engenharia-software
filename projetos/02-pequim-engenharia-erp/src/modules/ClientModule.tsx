import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  Printer,
  Star,
  Calendar,
  MapPin,
  UserCheck,
  ThumbsUp,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  X,
  Phone,
  FileText,
  Wrench,
  Award,
  MessageCircle,
  Check,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OSPriority } from '../types/schema';
import {
  formatCurrency,
  formatDateBR,
  formatDateTimeBR,
  STATUS_CONFIG,
  calculateOSTotalValue,
} from '../utils/formatters';
import { SERVICE_TYPES_CATALOG } from '../data/seedData';

export const ClientModule: React.FC = () => {
  const {
    activeClientId,
    setActiveClientId,
    clients,
    users,
    serviceOrders,
    tasks,
    statusLogs,
    createClientRequest,
    respondToBudget,
    submitClientFeedback,
    setPrintingOS,
  } = useApp();

  const [selectedOSId, setSelectedOSId] = useState<string | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  const [reqServiceType, setReqServiceType] = useState('CORRETIVA - AR CONDICIONADO');
  const [reqPriority, setReqPriority] = useState<OSPriority>('ALTA');
  const [reqDate, setReqDate] = useState('2026-10-19');
  const [reqTime, setReqTime] = useState('Período da Manhã (08h às 12h)');
  const [reqAddress, setReqAddress] = useState('');
  const [reqContact, setReqContact] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [requestSuccessBanner, setRequestSuccessBanner] = useState<string | null>(null);

  const [budgetComment, setBudgetComment] = useState('');
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');

  const currentClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || clients[0],
    [clients, activeClientId]
  );

  const clientOrders = useMemo(() => {
    return serviceOrders.filter((o) => o.clientId === currentClient.id);
  }, [serviceOrders, currentClient.id]);

  const activeOS = useMemo(() => {
    if (selectedOSId) {
      const found = clientOrders.find((o) => o.id === selectedOSId);
      if (found) return found;
    }
    return clientOrders[0] || null;
  }, [clientOrders, selectedOSId]);

  // Filter strictly public logs (NEVER show internal notes to the client!)
  const publicLogsForActiveOS = useMemo(() => {
    if (!activeOS) return [];
    return statusLogs.filter(
      (l) => l.serviceOrderId === activeOS.id && !l.isInternal
    );
  }, [statusLogs, activeOS]);

  const assignedTechsForActiveOS = useMemo(() => {
    if (!activeOS) return [];
    return activeOS.assignedTechIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean);
  }, [activeOS, users]);

  const pendingBudgetOrder = useMemo(
    () =>
      clientOrders.find(
        (o) =>
          o.status === 'AGUARDANDO_APROVACAO' ||
          (o.budgetApprovalStatus === 'PENDENTE' && o.serviceValue > 0)
      ),
    [clientOrders]
  );

  const openRequestModal = () => {
    setReqAddress(currentClient.address);
    setReqContact(currentClient.contactName);
    setReqDescription('');
    setShowNewRequestModal(true);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDescription.trim()) return;
    const created = createClientRequest({
      clientId: currentClient.id,
      serviceType: reqServiceType,
      priority: reqPriority,
      preferredDate: reqDate,
      preferredTime: reqTime,
      address: reqAddress || currentClient.address,
      contactName: reqContact || currentClient.contactName,
      description: reqDescription.trim(),
    });
    setShowNewRequestModal(false);
    setSelectedOSId(created.id);
    setRequestSuccessBanner(
      `Recebemos seu chamado (${created.code})! O Eng. André e nossa coordenação já foram avisados e estão analisando sua solicitação.`
    );
  };

  const steps = [
    {
      order: 1,
      label: 'Pedido Recebido',
      helper: 'Em análise pela nossa engenharia',
    },
    {
      order: 2,
      label: 'Orçamento & Aceite',
      helper: 'Transparência antes de iniciar',
    },
    {
      order: 3,
      label: 'Visita Agendada',
      helper: 'Técnicos escalados com horário',
    },
    {
      order: 4,
      label: 'Técnico no Local',
      helper: 'Serviço e checklist em andamento',
    },
    {
      order: 5,
      label: 'Serviço Entregue',
      helper: 'Testado e com laudo disponível',
    },
  ];

  const getStepExplanation = (status: string) => {
    switch (status) {
      case 'PENDENTE_ANALISE':
        return 'Sua solicitação foi recebida pela nossa coordenação. Estamos avaliando o escopo técnico para definir o melhor profissional e o horário de atendimento.';
      case 'AGUARDANDO_APROVACAO':
        return 'Preparamos a proposta comercial detalhada para este atendimento. Assim que você autorizar abaixo, nossa equipe já entra em programação de campo.';
      case 'AGUARDANDO_EXECUCAO':
        return 'Tudo certo! Sua manutenção está confirmada na agenda da nossa equipe técnica. No dia programado, nossos profissionais comparecerão uniformizados e identificados.';
      case 'EM_EXECUCAO':
        return 'Nossa equipe técnica está trabalhando neste atendimento e preenchendo o checklist de procedimentos em campo.';
      case 'AGUARDANDO_PECA':
        return 'O atendimento passou pela vistoria inicial e aguarda chegada de componente específico ou complemento técnico.';
      case 'CONCLUIDO':
        return 'Atendimento finalizado e equipamentos testados! Você pode baixar o Relatório / Ordem de Serviço em PDF e deixar sua avaliação sobre nossa equipe.';
      default:
        return 'Acompanhe abaixo todos os detalhes atualizados do seu atendimento.';
    }
  };

  const contractLabelMap: Record<string, string> = {
    AVULSO: 'Atendimento Sob Demanda',
    PMOC_MENSAL: 'Contrato PMOC Mensal Ativo',
    PMOC_TRIMESTRAL: 'Contrato PMOC Trimestral Ativo',
    PMOC_SEMESTRAL: 'Contrato PMOC Semestral Ativo',
  };

  return (
    <div className="min-h-[calc(100vh-110px)] bg-[#f4f1ea] p-4 md:p-6 lg:p-8">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Humanized High-Impact Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#662215] via-[#84261c] to-[#992a23] text-white rounded-3xl p-6 md:p-8 shadow-lg border border-[#992a23]/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left: Warm Personal Greeting & Primary CTA */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-300/20 border border-amber-200/30 text-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {contractLabelMap[currentClient.contractType] || 'Cliente Pequim Engenharia'}
                </span>
                <span className="text-xs text-stone-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-200" />
                  {currentClient.city} / MG
                </span>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold text-amber-200/95">
                  Seja bem-vindo(a), {currentClient.contactName}
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 leading-tight">
                  {currentClient.name}
                </h1>
                <p className="text-xs sm:text-sm text-stone-100/90 mt-2 max-w-2xl leading-relaxed">
                  Aqui você acompanha suas manutenções sem precisar ligar para pedir posição: veja quem é o técnico escalado para sua unidade, aprove orçamentos com transparência e baixe seus laudos prontos para auditoria.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={openRequestModal}
                  className="px-5 py-3.5 rounded-2xl bg-white hover:bg-stone-100 text-[#992a23] font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg transition transform hover:-translate-y-0.5"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Preciso de um Técnico / Abrir Chamado</span>
                </button>

                <div className="bg-black/25 hover:bg-black/35 border border-white/20 rounded-2xl px-4 py-2 text-xs transition">
                  <span className="text-amber-200 block text-[10px] font-bold uppercase tracking-wider">
                    Visualizando a unidade:
                  </span>
                  <select
                    value={activeClientId}
                    onChange={(e) => {
                      setActiveClientId(e.target.value);
                      setSelectedOSId(null);
                      setRequestSuccessBanner(null);
                    }}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-2"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} className="bg-stone-900 text-white">
                        {c.name} ({c.contactName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right: Human Engineering Support Card ("Quem cuida da sua conta") */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
                    Equipe Responsável pela sua Empresa
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Atendimento Ativo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3 border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-amber-300 text-[#662215] font-extrabold text-xs flex items-center justify-center shrink-0">
                      AN
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">
                        Eng. André
                      </div>
                      <div className="text-[11px] text-stone-200 truncate">
                        Coordenação Técnica
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3 border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-white text-[#992a23] font-extrabold text-xs flex items-center justify-center shrink-0">
                      CA
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">
                        Carol
                      </div>
                      <div className="text-[11px] text-stone-200 truncate">
                        Comercial & Financeiro
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-white/15">
                  <span className="text-stone-200">
                    Dúvida urgente sobre equipamento ou nota fiscal?
                  </span>
                  <a
                    href="https://wa.me/5531980000000"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-sm transition shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Falar no WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Row: 3 Human-Friendly Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                pendingBudgetOrder
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {pendingBudgetOrder ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Situação do Atendimento
              </span>
              {pendingBudgetOrder ? (
                <>
                  <h3 className="text-sm font-extrabold text-amber-900 mt-0.5">
                    1 Orçamento aguardando seu "De Acordo"
                  </h3>
                  <button
                    onClick={() => setSelectedOSId(pendingBudgetOrder.id)}
                    className="text-xs font-extrabold text-[#992a23] hover:underline mt-1 inline-block"
                  >
                    Revisar proposta {pendingBudgetOrder.proposalNumber} agora →
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-extrabold text-[#3b3b3b] mt-0.5">
                    Atendimentos em dia
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Nenhuma pendência de aprovação no momento.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fdf3f2] text-[#992a23] flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Profissionais Designados
              </span>
              <h3 className="text-sm font-extrabold text-[#3b3b3b] mt-0.5 truncate">
                {assignedTechsForActiveOS.length > 0
                  ? assignedTechsForActiveOS.map((t) => t?.name).join(' & ')
                  : 'Em escalação pela Engenharia'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {activeOS
                  ? `Programado para ${formatDateBR(activeOS.scheduledDate)} (${activeOS.scheduledTime})`
                  : 'Equipe própria uniformizada Pequim'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-[#3b3b3b] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[#992a23]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Documentação & Relatórios
              </span>
              <h3 className="text-sm font-extrabold text-[#3b3b3b] mt-0.5">
                {clientOrders.length} Ordem(ns) de Serviço registrada(s)
              </h3>
              {activeOS && (
                <button
                  onClick={() => setPrintingOS(activeOS)}
                  className="text-xs font-extrabold text-[#992a23] hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Baixar / Imprimir PDF da {activeOS.code}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {requestSuccessBanner && (
          <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{requestSuccessBanner}</span>
            </div>
            <button
              onClick={() => setRequestSuccessBanner(null)}
              className="text-xs text-emerald-800 hover:underline font-extrabold shrink-0"
            >
              Entendi
            </button>
          </div>
        )}

        {/* Main Content Grid: Left Client Orders List | Right Detailed Story & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Client's Service Orders */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
                Seus Atendimentos e Solicitações ({clientOrders.length})
              </span>
              <button
                onClick={openRequestModal}
                className="text-xs font-extrabold text-[#992a23] hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Novo Chamado
              </button>
            </div>

            {clientOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
                <p className="text-sm text-stone-600">
                  Sua empresa ainda não possui atendimentos registrados nesta visualização.
                </p>
                <button
                  onClick={openRequestModal}
                  className="px-4 py-2.5 rounded-xl bg-[#992a23] text-white text-xs font-bold"
                >
                  Solicitar Primeiro Atendimento
                </button>
              </div>
            ) : (
              clientOrders.map((os) => {
                const st = STATUS_CONFIG[os.status];
                const isSelected = activeOS?.id === os.id;
                const total = calculateOSTotalValue(os);
                const needsBudgetApproval =
                  os.status === 'AGUARDANDO_APROVACAO' ||
                  (os.budgetApprovalStatus === 'PENDENTE' && os.serviceValue > 0);

                return (
                  <div
                    key={os.id}
                    onClick={() => setSelectedOSId(os.id)}
                    className={`rounded-2xl p-5 border transition cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#992a23] shadow-md'
                        : 'bg-white border-stone-200/90 hover:border-[#992a23]/50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#992a23]">
                        {os.code}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${st.bgClass} ${st.textClass} ${st.borderClass}`}
                      >
                        ● {st.label}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-[#3b3b3b] mt-2">
                      {os.serviceType}
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                      {os.description}
                    </p>

                    {needsBudgetApproval && (
                      <div className="mt-3 px-3 py-2 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Proposta pronta para sua aprovação</span>
                      </div>
                    )}

                    <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#992a23]" />
                        <strong>{formatDateBR(os.scheduledDate)}</strong>
                      </span>
                      <span className="font-extrabold text-[#992a23]">
                        {total > 0 ? formatCurrency(total) : 'Em análise técnica'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Service Story, Technician Card, Proposal & Timeline */}
          <div className="lg:col-span-8">
            {!activeOS ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-stone-500">
                Selecione um atendimento ao lado para ver os detalhes.
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 md:p-8 space-y-6">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-200 pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-[#992a23] text-white text-xs font-extrabold">
                        {activeOS.code}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          STATUS_CONFIG[activeOS.status].bgClass
                        } ${STATUS_CONFIG[activeOS.status].textClass} ${
                          STATUS_CONFIG[activeOS.status].borderClass
                        }`}
                      >
                        ● {STATUS_CONFIG[activeOS.status].label}
                      </span>
                      <span className="text-xs text-stone-500">
                        Proposta: <strong>{activeOS.proposalNumber}</strong>
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#3b3b3b] mt-2.5">
                      {activeOS.serviceType}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#992a23] shrink-0" />
                      <span>{activeOS.address}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setPrintingOS(activeOS)}
                    className="px-4 py-2.5 rounded-xl border-2 border-[#992a23]/25 bg-[#fdf3f2] hover:bg-[#992a23] text-[#992a23] hover:text-white text-xs font-extrabold flex items-center gap-2 shrink-0 self-start shadow-sm transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Ver Documento / PDF da OS</span>
                  </button>
                </div>

                {/* Humanized Step-by-Step Progress with Contextual Explanation */}
                {activeOS.status !== 'CANCELADO' && (
                  <div className="bg-[#faf7f2] rounded-2xl p-5 border border-stone-200/90 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#662215]">
                        Em que etapa está o seu atendimento
                      </h3>
                      <span className="text-xs text-stone-500">
                        Atualizado diretamente pela nossa equipe
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {steps.map((step) => {
                        const currentStepOrder =
                          STATUS_CONFIG[activeOS.status].stepOrder;
                        const completed = step.order <= currentStepOrder;
                        const isCurrent = step.order === currentStepOrder;

                        return (
                          <div
                            key={step.order}
                            className={`rounded-xl p-3 border transition flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5 ${
                              isCurrent
                                ? 'bg-white border-2 border-[#992a23] shadow-sm'
                                : completed
                                  ? 'bg-white/80 border-stone-200'
                                  : 'bg-stone-100/60 border-stone-200/60 opacity-60'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                                completed
                                  ? 'bg-[#992a23] text-white'
                                  : 'bg-stone-200 text-stone-500'
                              }`}
                            >
                              {completed ? <Check className="w-4 h-4" /> : step.order}
                            </div>
                            <div>
                              <div className="text-xs font-extrabold text-[#3b3b3b]">
                                {step.label}
                              </div>
                              <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
                                {step.helper}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 text-xs sm:text-sm text-stone-700 leading-relaxed flex items-start gap-2.5">
                      <Award className="w-4 h-4 text-[#992a23] shrink-0 mt-0.5" />
                      <span>{getStepExplanation(activeOS.status)}</span>
                    </div>
                  </div>
                )}

                {/* Action Card 1: High-Impact Commercial Proposal Approval Widget */}
                {(activeOS.status === 'AGUARDANDO_APROVACAO' ||
                  (activeOS.budgetApprovalStatus === 'PENDENTE' &&
                    activeOS.serviceValue > 0)) && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border-2 border-amber-300 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full">
                          Proposta Comercial Pronta para Aprovação
                        </span>
                        <h3 className="text-lg font-extrabold text-[#3b3b3b] mt-2">
                          Proposta {activeOS.proposalNumber} — Investimento Total:{' '}
                          <span className="text-[#992a23]">
                            {formatCurrency(calculateOSTotalValue(activeOS))}
                          </span>
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      Confira o escopo técnico abaixo. Ao clicar em{' '}
                      <strong>"Autorizar Execução do Serviço"</strong>, nossa engenharia libera imediatamente a equipe para realizar o atendimento na data combinada.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        value={budgetComment}
                        onChange={(e) => setBudgetComment(e.target.value)}
                        placeholder="Observação opcional (ex: Aprovado! Podem procurar o Sr. Marcos na portaria)..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-xs sm:text-sm"
                      />
                      <button
                        onClick={() => {
                          respondToBudget(activeOS.id, true, budgetComment);
                          setBudgetComment('');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Autorizar Execução do Serviço</span>
                      </button>
                      <button
                        onClick={() => {
                          respondToBudget(activeOS.id, false, budgetComment);
                          setBudgetComment('');
                        }}
                        className="px-4 py-2.5 rounded-xl border border-amber-400 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold transition"
                      >
                        Pedir Ajuste no Orçamento
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Card 2: Service Rating & Feedback */}
                {activeOS.status === 'CONCLUIDO' && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      {activeOS.feedback
                        ? 'Obrigado pela sua avaliação sobre nossa equipe!'
                        : 'Como foi o atendimento da equipe Pequim Engenharia?'}
                    </h3>

                    {activeOS.feedback ? (
                      <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-1">
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                          {'★'.repeat(activeOS.feedback.rating)}
                          {'☆'.repeat(5 - activeOS.feedback.rating)}
                          <span className="text-xs text-stone-600 ml-2">
                            ({activeOS.feedback.rating} de 5 estrelas)
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700 italic">
                          "{activeOS.feedback.comment}"
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitClientFeedback(
                            activeOS.id,
                            ratingValue,
                            ratingComment.trim() || 'Atendimento pontual e serviço muito bem executado!'
                          );
                          setRatingComment('');
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-700">
                            Sua nota para o atendimento:
                          </span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setRatingValue(star)}
                              className={`text-xl transition ${
                                star <= ratingValue
                                  ? 'text-amber-400 scale-110'
                                  : 'text-stone-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            required
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            placeholder="Deixe um elogio ou comentário sobre a visita dos técnicos..."
                            className="flex-1 px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-xs sm:text-sm"
                          />
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
                          >
                            Enviar Avaliação
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Humanized Technician Badge & Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card: Quem vai atender sua empresa */}
                  <div className="p-5 rounded-2xl bg-[#faf7f2] border border-stone-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#662215]">
                        Quem Vai Atender Sua Empresa
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Equipe Identificada
                      </span>
                    </div>

                    {assignedTechsForActiveOS.length > 0 ? (
                      <div className="space-y-2">
                        {assignedTechsForActiveOS.map((tech) => (
                          <div
                            key={tech!.id}
                            className="bg-white rounded-xl p-3 border border-stone-200 flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#992a23] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                              {tech!.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-extrabold text-[#3b3b3b]">
                                {tech!.name}
                              </div>
                              <div className="text-[11px] text-stone-500">
                                {tech!.jobTitle} • Pequim Engenharia
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-3.5 border border-stone-200 text-xs text-stone-600">
                        Nossa coordenação está escalando a dupla técnica ideal para este atendimento.
                      </div>
                    )}

                    <div className="pt-1 text-xs text-stone-700 space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#992a23]" />
                        <span>
                          Data Programada: <strong>{formatDateBR(activeOS.scheduledDate)}</strong> ({activeOS.scheduledTime})
                        </span>
                      </p>
                      <p className="text-stone-600 pt-1 leading-relaxed">
                        <strong>O que será feito:</strong> {activeOS.description}
                      </p>
                    </div>
                  </div>

                  {/* Card: Resumo de Valores e Condições */}
                  <div className="p-5 rounded-2xl bg-[#faf7f2] border border-stone-200/90 flex flex-col justify-between space-y-3 text-xs">
                    <div className="space-y-2.5">
                      <div className="font-extrabold uppercase tracking-wider text-[#662215]">
                        Demonstrativo de Valores
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-200/70">
                        <span className="text-stone-600">Serviço Principal ({activeOS.serviceType}):</span>
                        <strong className="text-stone-900">
                          {activeOS.serviceValue > 0
                            ? formatCurrency(activeOS.serviceValue)
                            : 'Sob avaliação'}
                        </strong>
                      </div>
                      {activeOS.additionalCosts.map((c) => (
                        <div key={c.id} className="flex justify-between text-stone-600 py-0.5">
                          <span>
                            + {c.quantity}x {c.description}:
                          </span>
                          <strong>{formatCurrency(c.totalValue)}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-3 border-t border-stone-200">
                      <div className="flex justify-between items-center text-sm font-extrabold text-[#992a23]">
                        <span>Valor Total da OS:</span>
                        <span className="text-base">
                          {calculateOSTotalValue(activeOS) > 0
                            ? formatCurrency(calculateOSTotalValue(activeOS))
                            : 'Em elaboração'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center justify-between">
                        <span>Forma de Pagamento: <strong>{activeOS.paymentMethod}</strong></span>
                        <span>Nota Fiscal: <strong>{activeOS.invoiceEmailSent === 'Sim' ? 'Emitida' : 'Após conclusão'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Public Checklist Progress */}
                {tasks.filter((t) => t.serviceOrderId === activeOS.id).length > 0 && (
                  <div className="border border-stone-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23] flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#992a23]" />
                        O que foi verificado e executado nos equipamentos
                      </h3>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {
                          tasks.filter(
                            (t) => t.serviceOrderId === activeOS.id && t.completed
                          ).length
                        }{' '}
                        de {tasks.filter((t) => t.serviceOrderId === activeOS.id).length}{' '}
                        etapas concluídas
                      </span>
                    </div>
                    <div className="space-y-2">
                      {tasks
                        .filter((t) => t.serviceOrderId === activeOS.id)
                        .map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-stone-100 last:border-0"
                          >
                            <span
                              className={`flex items-center gap-2.5 ${
                                t.completed
                                  ? 'text-emerald-900 font-semibold'
                                  : 'text-stone-600'
                              }`}
                            >
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 ${
                                  t.completed ? 'text-emerald-600' : 'text-stone-300'
                                }`}
                              />
                              {t.title}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                t.completed
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {t.completed ? 'Realizado' : 'Programado'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Public Technical Notes & Evidences */}
                {(activeOS.technicalNotes || activeOS.evidences.length > 0) && (
                  <div className="border border-[#992a23]/25 rounded-2xl p-5 space-y-3 bg-[#fdf3f2]/40">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#992a23]" />
                      Laudo Técnico de Campo & Fotos do Serviço
                    </h3>
                    {activeOS.technicalNotes && (
                      <p className="text-xs sm:text-sm text-stone-700 whitespace-pre-line leading-relaxed bg-white p-3.5 rounded-xl border border-stone-200/80">
                        {activeOS.technicalNotes}
                      </p>
                    )}
                    {activeOS.evidences.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {activeOS.evidences.map((ev) => (
                          <a
                            key={ev.id}
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 rounded-xl bg-white border border-stone-200 hover:border-[#992a23] flex items-center gap-3 transition shadow-sm"
                          >
                            {ev.url.startsWith('data:image') ||
                            ev.url.includes('unsplash') ? (
                              <img
                                src={ev.url}
                                alt={ev.title}
                                className="w-14 h-14 rounded-lg object-cover border border-stone-200 shrink-0"
                              />
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#992a23] truncate">
                                {ev.title}
                              </div>
                              <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                                <span>Registrado por {ev.uploadedBy}</span>
                                <ExternalLink className="w-3 h-3" />
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Clean Public History */}
                <div className="border border-stone-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#662215] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#992a23]" />
                      Histórico Completo deste Atendimento
                    </h3>
                  </div>

                  <div className="relative pl-5 space-y-3.5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#992a23]/25">
                    {publicLogsForActiveOS.map((log) => (
                      <div key={log.id} className="relative">
                        <span className="absolute -left-[17px] top-1.5 w-3 h-3 rounded-full bg-[#992a23] border-2 border-white shadow" />
                        <div className="bg-[#faf7f2] rounded-xl p-3.5 border border-stone-200/80 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#992a23]">
                              {log.title}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              {formatDateTimeBR(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-stone-700 mt-1 leading-relaxed">
                            {log.description}
                          </p>
                          <span className="text-[11px] text-stone-400 mt-1 block">
                            Por: {log.authorName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: NEW SERVICE REQUEST BY CLIENT */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-[#992a23] text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  Como podemos ajudar sua empresa hoje?
                </h3>
                <p className="text-xs text-red-100 mt-0.5">
                  Preencha abaixo e o Eng. André receberá seu pedido imediatamente na Coordenação
                </p>
              </div>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Qual o tipo de necessidade? *
                  </label>
                  <select
                    value={reqServiceType}
                    onChange={(e) => setReqServiceType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white font-semibold"
                  >
                    {SERVICE_TYPES_CATALOG.filter((s) => s !== 'BUSCAR MATERIAIS').map(
                      (st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Qual a urgência para sua operação?
                  </label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as OSPriority)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white font-semibold"
                  >
                    <option value="BAIXA">Programada — Manutenção Preventiva</option>
                    <option value="MEDIA">Normal — Agendar nos próximos dias</option>
                    <option value="ALTA">Alta — Equipamento parou de gelar</option>
                    <option value="URGENTE">Urgente — Vazamento d'água / Sala crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Melhor dia para receber o técnico
                  </label>
                  <input
                    type="date"
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Melhor horário / turno
                  </label>
                  <input
                    type="text"
                    value={reqTime}
                    onChange={(e) => setReqTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Endereço ou Setor do Atendimento
                  </label>
                  <input
                    type="text"
                    value={reqAddress}
                    onChange={(e) => setReqAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Quem vai receber nossa equipe no local?
                  </label>
                  <input
                    type="text"
                    value={reqContact}
                    onChange={(e) => setReqContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Conte-nos o que está acontecendo com o equipamento *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  placeholder="Ex: O ar-condicionado da recepção está pingando água e fazendo ruído na turbina..."
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#992a23] hover:bg-[#662215] text-white text-xs font-extrabold shadow-sm transition"
                >
                  Enviar Solicitação para a Pequim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
