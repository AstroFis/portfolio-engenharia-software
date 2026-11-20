import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Kanban,
  List,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Camera,
  Lock,
  FileText,
  DollarSign,
  Play,
  PauseCircle,
  Check,
  UserCheck,
  Printer,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OSStatus } from '../types/schema';
import {
  formatCurrency,
  formatDateBR,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  calculateOSTotalValue,
} from '../utils/formatters';
import { INSTALLATION_PRICING_CATALOG } from '../data/seedData';

export const ServiceModule: React.FC = () => {
  const {
    activeTechId,
    setActiveTechId,
    users,
    clients,
    serviceOrders,
    tasks,
    changeOSStatus,
    toggleTask,
    createTask,
    addTechnicalNote,
    addAdditionalCost,
    removeAdditionalCost,
    addEvidence,
    setPrintingOS,
  } = useApp();

  const [viewMode, setViewMode] = useState<'MOBILE_EXECUTION' | 'KANBAN'>('MOBILE_EXECUTION');
  const [selectedOSId, setSelectedOSId] = useState<string | null>(null);

  const [noteText, setNoteText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const [costDesc, setCostDesc] = useState('');
  const [costQty, setCostQty] = useState<number>(1);
  const [costUnitVal, setCostUnitVal] = useState<number>(150);

  const [evTitle, setEvTitle] = useState('');
  const [evUrl, setEvUrl] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const currentTech = useMemo(
    () => users.find((u) => u.id === activeTechId) || users[2],
    [users, activeTechId]
  );

  const techUsers = useMemo(
    () => users.filter((u) => u.role === 'TECH' || u.role === 'ADMIN'),
    [users]
  );

  const myOrders = useMemo(() => {
    return serviceOrders
      .filter(
        (os) =>
          os.assignedTechIds.includes(activeTechId) &&
          os.status !== 'CANCELADO' &&
          os.status !== 'PENDENTE_ANALISE'
      )
      .sort((a, b) => {
        const pDiff =
          PRIORITY_CONFIG[b.priority].weight - PRIORITY_CONFIG[a.priority].weight;
        if (pDiff !== 0) return pDiff;
        return a.scheduledDate.localeCompare(b.scheduledDate);
      });
  }, [serviceOrders, activeTechId]);

  const myStandaloneTasks = useMemo(() => {
    return tasks.filter(
      (t) => !t.serviceOrderId && t.assignedToId === activeTechId
    );
  }, [tasks, activeTechId]);

  const activeOS = useMemo(() => {
    if (selectedOSId) {
      const found = myOrders.find((o) => o.id === selectedOSId);
      if (found) return found;
    }
    return (
      myOrders.find((o) => o.status === 'EM_EXECUCAO') ||
      myOrders[0] ||
      null
    );
  }, [myOrders, selectedOSId]);

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOS) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = String(evt.target?.result || '');
      addEvidence(
        activeOS.id,
        evTitle.trim() || `Foto de Campo (${file.name})`,
        'PHOTO',
        dataUrl,
        currentTech.name
      );
      setEvTitle('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-[calc(100vh-110px)] bg-[#f4f1ea] p-4 md:p-6">
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* Top Humanized Field Header */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#992a23] text-white font-extrabold text-base flex items-center justify-center shadow-sm">
              {currentTech.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#3b3b3b]">
                  Bom trabalho hoje, {currentTech.name}!
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#fdf3f2] text-[#992a23] border border-[#992a23]/20">
                  {myOrders.filter((o) => o.status !== 'CONCLUIDO').length} atendimento(s) na sua agenda
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {currentTech.jobTitle} • Selecione um cliente abaixo para ver endereço, checklist e registrar fotos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[#faf7f2] border border-stone-300 rounded-xl px-3 py-2 text-xs">
              <UserCheck className="w-4 h-4 text-[#992a23]" />
              <span className="text-stone-600 font-medium">Ver agenda de:</span>
              <select
                value={activeTechId}
                onChange={(e) => {
                  setActiveTechId(e.target.value);
                  setSelectedOSId(null);
                }}
                className="bg-transparent font-bold text-[#992a23] focus:outline-none cursor-pointer"
              >
                {techUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex bg-[#f4f1ea] p-1 rounded-xl border border-stone-300">
              <button
                onClick={() => setViewMode('MOBILE_EXECUTION')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'MOBILE_EXECUTION'
                    ? 'bg-[#992a23] text-white shadow-sm'
                    : 'text-[#454545] hover:text-[#992a23]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Minha Agenda do Dia
              </button>
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'KANBAN'
                    ? 'bg-[#992a23] text-white shadow-sm'
                    : 'text-[#454545] hover:text-[#992a23]'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                Quadro por Etapa
              </button>
            </div>
          </div>
        </div>

        {/* Standalone Internal Tasks Banner */}
        {myStandaloneTasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#992a23]/25 p-4 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23] mb-2.5 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#992a23]" />
              Lembretes de Compras e Tarefas na Rua ({myStandaloneTasks.filter((t) => !t.completed).length} em aberto)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {myStandaloneTasks.map((t) => (
                <label
                  key={t.id}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                    t.completed
                      ? 'bg-stone-50 border-stone-200 opacity-70'
                      : 'bg-[#fdf3f2]/60 border-[#992a23]/25 hover:bg-[#fdf3f2]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTask(t.id, currentTech.name)}
                    className="mt-0.5 w-4 h-4 rounded text-[#992a23]"
                  />
                  <div className="text-xs">
                    <div
                      className={`font-bold ${
                        t.completed ? 'line-through text-stone-400' : 'text-[#3b3b3b]'
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="text-[11px] text-[#454545] mt-0.5">
                      Local: <strong>{t.supplierOrLocation || 'Oficina'}</strong> • Prazo:{' '}
                      {formatDateBR(t.dueDate)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* VIEW MODE 1: KANBAN BOARD */}
        {viewMode === 'KANBAN' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                'AGUARDANDO_EXECUCAO',
                'EM_EXECUCAO',
                'AGUARDANDO_PECA',
                'CONCLUIDO',
              ] as OSStatus[]
            ).map((colStatus) => {
              const cfg = STATUS_CONFIG[colStatus];
              const colOrders = myOrders.filter((o) => o.status === colStatus);

              return (
                <div
                  key={colStatus}
                  className="bg-stone-200/80 rounded-2xl p-3.5 border border-stone-300 flex flex-col gap-3 min-h-[420px]"
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#3b3b3b]">
                        {cfg.label}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-[#3b3b3b] shadow-sm">
                      {colOrders.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {colOrders.map((os) => {
                      const client = clients.find((c) => c.id === os.clientId);
                      const prio = PRIORITY_CONFIG[os.priority];
                      const osTasks = tasks.filter((t) => t.serviceOrderId === os.id);
                      const doneCount = osTasks.filter((t) => t.completed).length;

                      return (
                        <div
                          key={os.id}
                          onClick={() => {
                            setSelectedOSId(os.id);
                            setViewMode('MOBILE_EXECUTION');
                          }}
                          className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm hover:shadow-md hover:border-[#992a23] cursor-pointer transition space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#992a23]">
                              {os.code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${prio.bgClass} ${prio.textClass} ${prio.borderClass}`}
                            >
                              {prio.label}
                            </span>
                          </div>

                          <div>
                            <div className="font-bold text-sm text-[#3b3b3b]">
                              {client?.name}
                            </div>
                            <div className="text-[11px] font-bold text-[#992a23] mt-0.5">
                              {os.serviceType}
                            </div>
                          </div>

                          <p className="text-xs text-stone-600 line-clamp-2">
                            {os.description}
                          </p>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                            <span>
                              {formatDateBR(os.scheduledDate)} • {os.scheduledTime}
                            </span>
                            <span className="font-bold text-emerald-700">
                              ✓ {doneCount}/{osTasks.length}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW MODE 2: LISTA DE FILA + PAINEL DE EXECUÇÃO EM CAMPO */}
        {viewMode === 'MOBILE_EXECUTION' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Queue Column (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#454545] px-1">
                Sua Fila Ordenada por Prioridade ({myOrders.length})
              </div>

              {myOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-500">
                  Nenhuma Ordem de Serviço atribuída a {currentTech.name} no momento.
                </div>
              ) : (
                myOrders.map((os) => {
                  const client = clients.find((c) => c.id === os.clientId);
                  const prio = PRIORITY_CONFIG[os.priority];
                  const st = STATUS_CONFIG[os.status];
                  const isSelected = activeOS?.id === os.id;
                  const osTasks = tasks.filter((t) => t.serviceOrderId === os.id);
                  const doneCount = osTasks.filter((t) => t.completed).length;

                  return (
                    <div
                      key={os.id}
                      onClick={() => setSelectedOSId(os.id)}
                      className={`rounded-2xl p-4 border transition cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-[#992a23] shadow-md ring-2 ring-[#992a23]/10'
                          : 'bg-white border-stone-200 hover:border-[#992a23]/50 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-[#992a23]">
                          {os.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${prio.bgClass} ${prio.textClass} ${prio.borderClass}`}
                          >
                            {prio.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${st.bgClass} ${st.textClass} ${st.borderClass}`}
                          >
                            {st.shortLabel}
                          </span>
                        </div>
                      </div>

                      <div className="font-bold text-sm text-[#3b3b3b] mt-1.5">
                        {client?.name}
                      </div>
                      <div className="text-xs font-bold text-[#992a23]">
                        {os.serviceType}
                      </div>

                      <div className="text-xs text-stone-500 mt-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{os.address}</span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-600 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#992a23]" />
                          {formatDateBR(os.scheduledDate)} ({os.scheduledTime})
                        </span>
                        <span className="font-bold text-[#3b3b3b]">
                          Checklist: {doneCount}/{osTasks.length}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Active OS Execution Workbench (8 cols) */}
            <div className="lg:col-span-8">
              {!activeOS ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
                  Selecione uma Ordem de Serviço ao lado para iniciar a execução técnica.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-6 p-5 md:p-6">
                  {/* OS Header & 1-Tap Status Controls */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-stone-200 pb-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-[#992a23] text-white text-xs font-extrabold">
                          {activeOS.code}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            STATUS_CONFIG[activeOS.status].bgClass
                          } ${STATUS_CONFIG[activeOS.status].textClass} ${
                            STATUS_CONFIG[activeOS.status].borderClass
                          }`}
                        >
                          ● {STATUS_CONFIG[activeOS.status].label}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            PRIORITY_CONFIG[activeOS.priority].bgClass
                          } ${PRIORITY_CONFIG[activeOS.priority].textClass}`}
                        >
                          Prioridade {PRIORITY_CONFIG[activeOS.priority].label}
                        </span>
                      </div>

                      <h2 className="text-xl font-extrabold text-[#3b3b3b] pt-1">
                        {clients.find((c) => c.id === activeOS.clientId)?.name}
                      </h2>
                      <p className="text-sm font-bold text-[#992a23]">
                        {activeOS.serviceType}
                      </p>
                      <div className="text-xs text-stone-600 space-y-1.5 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#992a23] shrink-0" />
                            <span>{activeOS.address}</span>
                          </span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              activeOS.address
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#fdf3f2] hover:bg-[#992a23] text-[#992a23] hover:text-white font-bold text-[11px] border border-[#992a23]/25 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Abrir no GPS / Maps
                          </a>
                        </div>
                        <p className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            Procurar no local: <strong>{activeOS.contactName}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            Janela prevista: <strong>{activeOS.scheduledTime}</strong>
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setPrintingOS(activeOS)}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-[#3b3b3b] text-xs font-bold flex items-center gap-1.5 self-start shrink-0"
                    >
                      <Printer className="w-4 h-4 text-[#992a23]" />
                      Ver Ordem de Serviço (PDF)
                    </button>
                  </div>

                  {/* Mobile-Friendly Status Action Buttons */}
                  <div className="bg-[#faf7f2] p-4 rounded-2xl border border-stone-200">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[#662215] mb-2.5">
                      Qual a situação deste atendimento agora? (Clique para avisar a Engenharia e o Cliente)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        onClick={() =>
                          changeOSStatus(
                            activeOS.id,
                            'AGUARDANDO_EXECUCAO',
                            'Atendimento programado aguardando deslocamento da equipe.',
                            `${currentTech.name} (Técnico)`,
                            'TECH'
                          )
                        }
                        className={`py-3 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                          activeOS.status === 'AGUARDANDO_EXECUCAO'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-sky-50'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        1. Na Agenda
                      </button>

                      <button
                        onClick={() =>
                          changeOSStatus(
                            activeOS.id,
                            'EM_EXECUCAO',
                            `Equipe liderada por ${currentTech.name} chegou ao local e iniciou os procedimentos.`,
                            `${currentTech.name} (Técnico)`,
                            'TECH'
                          )
                        }
                        className={`py-3 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                          activeOS.status === 'EM_EXECUCAO'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-blue-50'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        2. Cheguei / Iniciar
                      </button>

                      <button
                        onClick={() =>
                          changeOSStatus(
                            activeOS.id,
                            'AGUARDANDO_PECA',
                            `Atendimento pausado por ${currentTech.name}: aguardando peça/material ou aprovação complementar.`,
                            `${currentTech.name} (Técnico)`,
                            'TECH'
                          )
                        }
                        className={`py-3 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                          activeOS.status === 'AGUARDANDO_PECA'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-orange-50'
                        }`}
                      >
                        <PauseCircle className="w-4 h-4" />
                        3. Falta Peça
                      </button>

                      <button
                        onClick={() =>
                          changeOSStatus(
                            activeOS.id,
                            'CONCLUIDO',
                            `Serviço finalizado e testado em campo por ${currentTech.name}. Equipamentos operando normalmente.`,
                            `${currentTech.name} (Técnico)`,
                            'TECH'
                          )
                        }
                        className={`py-3 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                          activeOS.status === 'CONCLUIDO'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        4. Finalizar Serviço
                      </button>
                    </div>
                  </div>

                  {/* Scope & Internal Alert */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#454545] mb-1">
                        Descrição do Serviço (Planilha)
                      </h3>
                      <p className="text-sm text-stone-800 whitespace-pre-line">
                        {activeOS.description}
                      </p>
                    </div>

                    {activeOS.internalNotes && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          Instruções Internas da Equipe (Oculto para Cliente)
                        </h3>
                        <p className="text-xs text-amber-900 whitespace-pre-line leading-relaxed">
                          {activeOS.internalNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Interactive Checklist Section */}
                  <div className="border border-stone-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-[#992a23] flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Checklist de Execução da OS
                      </h3>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {
                          tasks.filter(
                            (t) => t.serviceOrderId === activeOS.id && t.completed
                          ).length
                        }{' '}
                        de {tasks.filter((t) => t.serviceOrderId === activeOS.id).length}{' '}
                        concluídas
                      </span>
                    </div>

                    <div className="space-y-2">
                      {tasks
                        .filter((t) => t.serviceOrderId === activeOS.id)
                        .map((task) => (
                          <label
                            key={task.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                              task.completed
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-white border-stone-200 hover:border-[#992a23]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTask(task.id, currentTech.name)}
                                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span
                                className={`text-sm font-medium ${
                                  task.completed
                                    ? 'line-through text-stone-400'
                                    : 'text-stone-800'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                            {task.completed && (
                              <span className="text-[11px] text-emerald-700 font-semibold shrink-0">
                                Feito por {task.completedBy}
                              </span>
                            )}
                          </label>
                        ))}
                    </div>

                    {/* Add Subtask in Field */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newSubtaskTitle.trim()) return;
                        createTask({
                          serviceOrderId: activeOS.id,
                          title: newSubtaskTitle.trim(),
                          category: 'CHECKLIST_OS',
                          assignedToId: currentTech.id,
                          dueDate: activeOS.scheduledDate,
                          priority: activeOS.priority,
                        });
                        setNewSubtaskTitle('');
                      }}
                      className="flex gap-2 pt-2"
                    >
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Adicionar etapa extra verificada em campo..."
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-[#3b3b3b] hover:bg-black text-white text-xs font-bold"
                      >
                        + Etapa
                      </button>
                    </form>
                  </div>

                  {/* Technical Notes & Internal Notes Section */}
                  <div className="border border-stone-200 rounded-2xl p-4 space-y-3">
                    <h3 className="text-sm font-extrabold text-[#992a23] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#992a23]" />
                      Apontamentos Técnicos & Observações Internas
                    </h3>

                    {activeOS.technicalNotes && (
                      <div className="p-3 rounded-xl bg-[#fdf3f2]/50 border border-[#992a23]/20 text-xs text-stone-700 whitespace-pre-line">
                        <strong className="block text-[#992a23] mb-1">
                          Histórico de Apontamentos Técnicos (Visível no Relatório):
                        </strong>
                        {activeOS.technicalNotes}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!noteText.trim()) return;
                        addTechnicalNote(
                          activeOS.id,
                          noteText,
                          isInternalNote,
                          currentTech.name
                        );
                        setNoteText('');
                      }}
                      className="space-y-2.5"
                    >
                      <textarea
                        rows={2}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder={
                          isInternalNote
                            ? 'Escreva uma observação interna (visível APENAS para a Gerência e Equipe Técnica)...'
                            : 'Descreva o diagnóstico técnico, pressões medidas (PSI), superaquecimento ou peças trocadas...'
                        }
                        className={`w-full p-3 rounded-xl border text-xs ${
                          isInternalNote
                            ? 'border-amber-300 bg-amber-50/40'
                            : 'border-stone-300 bg-white'
                        }`}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-600"
                          />
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            Marcar como Observação Interna (Ocultar do Portal do Cliente)
                          </span>
                        </label>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-[#992a23] hover:bg-[#662215] text-white text-xs font-bold"
                        >
                          Registrar Apontamento
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Additional Materials / Costs & Evidences Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-stone-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-[#992a23] flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          Materiais & Custos Adicionais
                        </h3>
                        <span className="text-xs font-extrabold text-[#992a23]">
                          Total OS: {formatCurrency(calculateOSTotalValue(activeOS))}
                        </span>
                      </div>

                      {activeOS.additionalCosts.length > 0 && (
                        <div className="divide-y divide-stone-100 text-xs">
                          {activeOS.additionalCosts.map((c) => (
                            <div
                              key={c.id}
                              className="py-1.5 flex items-center justify-between gap-2"
                            >
                              <span>
                                {c.quantity}x {c.description}
                              </span>
                              <div className="flex items-center gap-2">
                                <strong className="text-stone-900">
                                  {formatCurrency(c.totalValue)}
                                </strong>
                                <button
                                  onClick={() => removeAdditionalCost(activeOS.id, c.id)}
                                  className="text-stone-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <select
                          onChange={(e) => {
                            const item = INSTALLATION_PRICING_CATALOG.find(
                              (i) => i.id === e.target.value
                            );
                            if (item) {
                              setCostDesc(item.name);
                              setCostUnitVal(item.unitPrice);
                            }
                          }}
                          defaultValue=""
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-stone-50 mb-2"
                        >
                          <option value="" disabled>
                            Preencher da Tabela Pequim (Tubulação/Gás/Furos)...
                          </option>
                          {INSTALLATION_PRICING_CATALOG.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} — {formatCurrency(item.unitPrice)}/{item.unit}
                            </option>
                          ))}
                        </select>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!costDesc.trim()) return;
                            addAdditionalCost(
                              activeOS.id,
                              costDesc.trim(),
                              Number(costQty) || 1,
                              Number(costUnitVal) || 0,
                              currentTech.name
                            );
                            setCostDesc('');
                            setCostQty(1);
                          }}
                          className="grid grid-cols-4 gap-2"
                        >
                          <input
                            type="text"
                            required
                            placeholder="Material / Peça"
                            value={costDesc}
                            onChange={(e) => setCostDesc(e.target.value)}
                            className="col-span-2 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                          />
                          <input
                            type="number"
                            min={1}
                            placeholder="Qtd"
                            value={costQty}
                            onChange={(e) => setCostQty(Number(e.target.value))}
                            className="px-2 py-1.5 rounded-lg border border-stone-300 text-xs"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="R$ Unit"
                            value={costUnitVal}
                            onChange={(e) => setCostUnitVal(Number(e.target.value))}
                            className="px-2 py-1.5 rounded-lg border border-stone-300 text-xs"
                          />
                          <button
                            type="submit"
                            className="col-span-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            + Incluir Material / Adicional na OS
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Evidences / Photos Upload */}
                    <div className="border border-stone-200 rounded-2xl p-4 space-y-3">
                      <h3 className="text-sm font-extrabold text-[#992a23] flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#992a23]" />
                        Anexar Fotos & Evidências de Campo ({activeOS.evidences.length})
                      </h3>

                      {activeOS.evidences.length > 0 && (
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                          {activeOS.evidences.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {ev.url.startsWith('data:image') ||
                                ev.url.includes('unsplash') ? (
                                  <img
                                    src={ev.url}
                                    alt={ev.title}
                                    className="w-9 h-9 rounded object-cover border border-stone-300 shrink-0"
                                  />
                                ) : null}
                                <div className="truncate">
                                  <div className="font-semibold text-stone-800 truncate">
                                    {ev.title}
                                  </div>
                                  <div className="text-[10px] text-stone-400">
                                    Por {ev.uploadedBy}
                                  </div>
                                </div>
                              </div>
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#992a23] hover:underline shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Legenda da evidência (ex: Foto Manômetro 400 PSI)"
                          value={evTitle}
                          onChange={(e) => setEvTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                        />

                        <div className="flex flex-col sm:flex-row gap-2">
                          <label className="flex-1 py-1.5 px-3 rounded-lg bg-[#fdf3f2] hover:bg-red-100 text-[#992a23] border border-[#992a23]/25 text-xs font-bold text-center cursor-pointer transition">
                            📷 Enviar Foto / Arquivo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoFileSelect}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!evUrl.trim()) return;
                            addEvidence(
                              activeOS.id,
                              evTitle.trim() || 'Evidência Técnica (Link)',
                              'LINK',
                              evUrl.trim(),
                              currentTech.name
                            );
                            setEvTitle('');
                            setEvUrl('');
                          }}
                          className="flex gap-1.5"
                        >
                          <input
                            type="url"
                            placeholder="Ou cole link de foto/laudo..."
                            value={evUrl}
                            onChange={(e) => setEvUrl(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-[#992a23] text-white text-xs font-bold"
                          >
                            Anexar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
