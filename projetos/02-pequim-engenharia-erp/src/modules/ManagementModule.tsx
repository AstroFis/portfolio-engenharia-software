import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Wrench,
  CheckSquare,
  Users,
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  Edit3,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  UserCheck,
  Download,
  Upload,
  Calculator,
  ArrowRight,
  Lock,
  Star,
  Building2,
  Phone,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ServiceOrder,
  OSStatus,
  OSPriority,
  TaskCategory,
  ClientType,
} from '../types/schema';
import {
  formatCurrency,
  formatDateBR,
  formatDateTimeBR,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  calculateOSTotalValue,
  generateSpreadsheetCSV,
  getSampleCSVTemplate,
} from '../utils/formatters';
import {
  SERVICE_TYPES_CATALOG,
  INSTALLATION_PRICING_CATALOG,
} from '../data/seedData';

type AdminTab = 'DASHBOARD' | 'ORDERS' | 'TASKS' | 'CLIENTS_TEAM' | 'IMPORT_EXPORT';

const TODAY_STR = '2026-10-17';

export const ManagementModule: React.FC = () => {
  const {
    serviceOrders,
    tasks,
    clients,
    users,
    statusLogs,
    setPrintingOS,
    createServiceOrder,
    updateServiceOrder,
    deleteServiceOrder,
    changeOSStatus,
    approveAndAssignOS,
    toggleTask,
    createTask,
    deleteTask,
    createClient,
    createUser,
    importCSVData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');

  // Filters for Service Orders
  const [statusFilter, setStatusFilter] = useState<OSStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<OSPriority | 'ALL'>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [techFilter, setTechFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [showOSModal, setShowOSModal] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [approvingOS, setApprovingOS] = useState<ServiceOrder | null>(null);

  // OS Form State
  const [formClientId, setFormClientId] = useState(clients[0]?.id || '');
  const [formServiceType, setFormServiceType] = useState(SERVICE_TYPES_CATALOG[0]);
  const [formPriority, setFormPriority] = useState<OSPriority>('ALTA');
  const [formStatus, setFormStatus] = useState<OSStatus>('AGUARDANDO_EXECUCAO');
  const [formDate, setFormDate] = useState('2026-10-18');
  const [formTime, setFormTime] = useState('08:00 às 17:00');
  const [formWeek, setFormWeek] = useState('SEMANA 1');
  const [formAddress, setFormAddress] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formValue, setFormValue] = useState<number>(1200);
  const [formProposal, setFormProposal] = useState('');
  const [formReport, setFormReport] = useState('-');
  const [formInvoiceSent, setFormInvoiceSent] = useState<'Sim' | 'Não' | '-'>('Não');
  const [formPaymentMethod, setFormPaymentMethod] = useState<
    'BOLETO' | 'TRANSFERÊNCIA' | 'DEPÓSITO' | 'PIX' | 'A DEFINIR'
  >('BOLETO');
  const [formTechIds, setFormTechIds] = useState<string[]>(['user-higor']);
  const [formInternalNotes, setFormInternalNotes] = useState('');
  const [formChecklistText, setFormChecklistText] = useState(
    'Inspeção inicial e segurança do local\nExecução do procedimento técnico principal\nTeste de operação e limpeza da área'
  );
  const [showPricingCalc, setShowPricingCalc] = useState(false);

  // Quick Approval Modal State
  const [approveTechIds, setApproveTechIds] = useState<string[]>(['user-higor']);
  const [approvePriority, setApprovePriority] = useState<OSPriority>('URGENTE');
  const [approveValue, setApproveValue] = useState<number>(850);
  const [approveDate, setApproveDate] = useState<string>('2026-10-18');
  const [approveTime, setApproveTime] = useState<string>('08:00 às 12:00');
  const [approveRequireBudget, setApproveRequireBudget] = useState<boolean>(false);
  const [approveChecklist, setApproveChecklist] = useState<string>(
    'Vistoria técnica e diagnóstico do equipamento\nDesobstrução da bomba de dreno e limpeza da bandeja\nTeste de funcionamento e estanqueidade'
  );

  // Tasks Filter & New Task State
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'AVULSAS' | 'OS_CHECKLIST' | 'OVERDUE'>('ALL');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory] = useState<TaskCategory>('COMPRAS_MATERIAIS');
  const [newTaskTechId, setNewTaskTechId] = useState('user-andre');
  const [newTaskOSId, setNewTaskOSId] = useState<string>('NONE');
  const [newTaskSupplier, setNewTaskSupplier] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-10-18');
  const [newTaskPriority] = useState<OSPriority>('ALTA');

  // New Client / New Team Member State
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [cName, setCName] = useState('');
  const [cType] = useState<ClientType>('PJ');
  const [cContact, setCContact] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cCity] = useState('Belo Horizonte');
  const [cContract, setCContract] = useState<
    'AVULSO' | 'PMOC_MENSAL' | 'PMOC_TRIMESTRAL' | 'PMOC_SEMESTRAL'
  >('AVULSO');

  const [showNewTechForm, setShowNewTechForm] = useState(false);
  const [tName, setTName] = useState('');
  const [tTitle, setTTitle] = useState('Técnico de Climatização');
  const [tPhone, setTPhone] = useState('');
  const [tEmail] = useState('');

  // CSV Import State
  const [csvInputText, setCsvInputText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const techUsers = useMemo(
    () => users.filter((u) => u.role === 'TECH' || u.role === 'ADMIN'),
    [users]
  );

  // Real-time KPIs computation
  const kpis = useMemo(() => {
    const openOrPending = serviceOrders.filter(
      (o) =>
        o.status === 'PENDENTE_ANALISE' ||
        o.status === 'AGUARDANDO_APROVACAO' ||
        o.status === 'AGUARDANDO_EXECUCAO'
    ).length;

    const inProgress = serviceOrders.filter(
      (o) => o.status === 'EM_EXECUCAO' || o.status === 'AGUARDANDO_PECA'
    ).length;

    const completed = serviceOrders.filter((o) => o.status === 'CONCLUIDO').length;

    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.dueDate < TODAY_STR
    ).length;

    const totalEstimatedRevenue = serviceOrders
      .filter((o) => o.status !== 'CANCELADO')
      .reduce((sum, o) => sum + calculateOSTotalValue(o), 0);

    const confirmedRevenue = serviceOrders
      .filter((o) => o.status === 'CONCLUIDO' || o.status === 'EM_EXECUCAO')
      .reduce((sum, o) => sum + calculateOSTotalValue(o), 0);

    const pendingClientRequests = serviceOrders.filter(
      (o) => o.status === 'PENDENTE_ANALISE'
    );

    return {
      openOrPending,
      inProgress,
      completed,
      overdueTasks,
      totalEstimatedRevenue,
      confirmedRevenue,
      pendingClientRequests,
    };
  }, [serviceOrders, tasks]);

  // Filtered Service Orders
  const filteredOrders = useMemo(() => {
    return serviceOrders.filter((os) => {
      if (statusFilter !== 'ALL' && os.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && os.priority !== priorityFilter) return false;
      if (clientFilter !== 'ALL' && os.clientId !== clientFilter) return false;
      if (techFilter !== 'ALL' && !os.assignedTechIds.includes(techFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const client = clients.find((c) => c.id === os.clientId);
        const matchCode = os.code.toLowerCase().includes(q);
        const matchProposal = (os.proposalNumber || '').toLowerCase().includes(q);
        const matchClient = (client?.name || '').toLowerCase().includes(q);
        const matchDesc = os.description.toLowerCase().includes(q);
        const matchType = os.serviceType.toLowerCase().includes(q);
        const matchAddress = (os.address || '').toLowerCase().includes(q);
        if (!matchCode && !matchProposal && !matchClient && !matchDesc && !matchType && !matchAddress) {
          return false;
        }
      }
      return true;
    });
  }, [serviceOrders, statusFilter, priorityFilter, clientFilter, techFilter, searchQuery, clients]);

  const openCreateOSModal = () => {
    setEditingOS(null);
    const defaultClient = clients[0];
    setFormClientId(defaultClient?.id || '');
    setFormServiceType(SERVICE_TYPES_CATALOG[0]);
    setFormPriority('ALTA');
    setFormStatus('AGUARDANDO_EXECUCAO');
    setFormDate('2026-10-18');
    setFormTime('08:00 às 17:00');
    setFormWeek('SEMANA 1');
    setFormAddress(defaultClient?.address || '');
    setFormContact(defaultClient?.contactName || '');
    setFormDescription('');
    setFormValue(1500);
    setFormProposal(`PE260${serviceOrders.length + 535}`);
    setFormReport('-');
    setFormInvoiceSent('Não');
    setFormPaymentMethod('BOLETO');
    setFormTechIds(['user-higor']);
    setFormInternalNotes('');
    setFormChecklistText(
      'Inspeção técnica e aferição inicial\nExecução do serviço conforme escopo\nLimpeza e teste final com o cliente'
    );
    setShowOSModal(true);
  };

  const openEditOSModal = (os: ServiceOrder) => {
    setEditingOS(os);
    setFormClientId(os.clientId);
    setFormServiceType(os.serviceType);
    setFormPriority(os.priority);
    setFormStatus(os.status);
    setFormDate(os.scheduledDate);
    setFormTime(os.scheduledTime);
    setFormWeek(os.weekLabel || 'SEMANA 1');
    setFormAddress(os.address);
    setFormContact(os.contactName);
    setFormDescription(os.description);
    setFormValue(os.serviceValue);
    setFormProposal(os.proposalNumber);
    setFormReport(os.reportNumber);
    setFormInvoiceSent(os.invoiceEmailSent);
    setFormPaymentMethod(os.paymentMethod);
    setFormTechIds(os.assignedTechIds);
    setFormInternalNotes(os.internalNotes);
    setShowOSModal(true);
  };

  const handleSaveOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOS) {
      updateServiceOrder(
        editingOS.id,
        {
          clientId: formClientId,
          serviceType: formServiceType,
          priority: formPriority,
          status: formStatus,
          scheduledDate: formDate,
          scheduledTime: formTime,
          weekLabel: formWeek,
          address: formAddress,
          contactName: formContact,
          description: formDescription,
          serviceValue: Number(formValue) || 0,
          proposalNumber: formProposal,
          reportNumber: formReport,
          invoiceEmailSent: formInvoiceSent,
          paymentMethod: formPaymentMethod,
          assignedTechIds: formTechIds,
          internalNotes: formInternalNotes,
          budgetApprovalStatus:
            formStatus === 'AGUARDANDO_APROVACAO' ? 'PENDENTE' : 'APROVADO',
        },
        `Ordem de Serviço ${editingOS.code} editada pela Gerência.`
      );
    } else {
      const checklistLines = formChecklistText
        .split('\n')
        .map((l) => l.replace(/^\*\s*/, '').trim())
        .filter(Boolean);

      createServiceOrder(
        {
          proposalNumber: formProposal,
          reportNumber: formReport,
          clientId: formClientId,
          assignedTechIds: formTechIds,
          serviceType: formServiceType,
          priority: formPriority,
          status: formStatus,
          weekLabel: formWeek,
          scheduledDate: formDate,
          scheduledTime: formTime,
          address: formAddress,
          contactName: formContact,
          description: formDescription,
          serviceValue: Number(formValue) || 0,
          invoiceEmailSent: formInvoiceSent,
          paymentMethod: formPaymentMethod,
          sendMethod: 'Zap',
          technicalNotes: '',
          internalNotes: formInternalNotes,
          budgetApprovalStatus:
            formStatus === 'AGUARDANDO_APROVACAO' ? 'PENDENTE' : 'APROVADO',
          origin: 'GERENCIA',
        },
        checklistLines
      );
    }
    setShowOSModal(false);
  };

  const openApprovalModal = (os: ServiceOrder) => {
    setApprovingOS(os);
    setApproveTechIds(os.assignedTechIds.length > 0 ? os.assignedTechIds : ['user-higor']);
    setApprovePriority(os.priority);
    setApproveValue(os.serviceValue > 0 ? os.serviceValue : 850);
    setApproveDate(os.scheduledDate || '2026-10-18');
    setApproveTime(
      os.scheduledTime && os.scheduledTime !== 'A definir'
        ? os.scheduledTime
        : '08:00 às 12:00'
    );
    setApproveRequireBudget(false);
    setApproveChecklist(
      'Vistoria técnica e diagnóstico do equipamento\nExecução do reparo / manutenção corretiva\nTeste de drenagem, rendimento térmico e limpeza'
    );
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingOS) return;
    const items = approveChecklist
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    approveAndAssignOS(approvingOS.id, {
      assignedTechIds: approveTechIds,
      priority: approvePriority,
      serviceValue: Number(approveValue) || 0,
      scheduledDate: approveDate,
      scheduledTime: approveTime,
      requireClientBudgetApproval: approveRequireBudget,
      checklistItems: items,
    });
    setApprovingOS(null);
  };

  const toggleTechInList = (techId: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(techId)) {
      if (list.length > 1) setter(list.filter((id) => id !== techId));
    } else {
      setter([...list, techId]);
    }
  };

  const handleExportCSV = () => {
    const csv = generateSpreadsheetCSV(filteredOrders, clients, users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AGENDA_PEQUIM_EXPORT_${TODAY_STR}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplateCSV = () => {
    const csv = getSampleCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MODELO_IMPORTACAO_AGENDA_PEQUIM.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      setCsvInputText(content);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleProcessCSVImport = () => {
    if (!csvInputText.trim()) return;
    const res = importCSVData(csvInputText);
    setImportFeedback(
      `Importação concluída! ${res.importedCount} Ordens de Serviço e ${res.newClientsCount} novos clientes foram adicionados em tempo real.`
    );
    setCsvInputText('');
  };

  return (
    <div className="min-h-[calc(100vh-110px)] flex flex-col lg:flex-row bg-[#f4f1ea]">
      {/* Left Sidebar in Pequim Deep Burgundy/Crimson (#662215 -> #47150c) */}
      <aside className="w-full lg:w-64 bg-gradient-to-b from-[#662215] to-[#47150c] text-white shrink-0 flex flex-col justify-between border-r border-[#992a23]/40 shadow-lg">
        <div>
          {/* Company Header Card with Official Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-md">
              <img
                src="/pequim-engenharia-logo.webp"
                alt="Pequim Engenharia"
                className="h-11 w-auto object-contain shrink-0"
              />
              <div className="min-w-0">
                <h2 className="font-extrabold text-xs text-[#3b3b3b] truncate">
                  PEQUIM ENGENHARIA
                </h2>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-[#992a23] text-white rounded-md mt-0.5">
                  Coordenação & Obras
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80 px-3 mb-2">
              Dia a Dia da Empresa
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('DASHBOARD')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-[#992a23] text-white shadow-sm ring-1 ring-white/20'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Visão do Dia & Triagem
                </span>
                {kpis.pendingClientRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-stone-950">
                    {kpis.pendingClientRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('ORDERS')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'ORDERS'
                    ? 'bg-[#992a23] text-white shadow-sm ring-1 ring-white/20'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4" />
                  Ordens de Serviço (OS)
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 text-amber-200">
                  {serviceOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('TASKS')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'TASKS'
                    ? 'bg-[#992a23] text-white shadow-sm ring-1 ring-white/20'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4" />
                  Compras & Tarefas
                </span>
                {kpis.overdueTasks > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                    {kpis.overdueTasks} atr.
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('CLIENTS_TEAM')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'CLIENTS_TEAM'
                    ? 'bg-[#992a23] text-white shadow-sm ring-1 ring-white/20'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  Clientes & Equipe
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 text-amber-200">
                  {clients.length}
                </span>
              </button>

              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80 px-3 pt-4 mb-2">
                Planilha & Relatórios
              </div>

              <button
                onClick={() => setActiveTab('IMPORT_EXPORT')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'IMPORT_EXPORT'
                    ? 'bg-[#992a23] text-white shadow-sm ring-1 ring-white/20'
                    : 'text-stone-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  Planilha Agenda (Excel)
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Quick Action Card */}
        <div className="p-4 border-t border-white/10 hidden lg:block">
          <div className="bg-black/25 border border-white/15 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Atendimento Rápido
              </span>
            </div>
            <p className="text-[11px] text-stone-200 leading-relaxed">
              Qualquer alteração feita aqui avisa o técnico no celular e atualiza a página do cliente.
            </p>
            <button
              onClick={openCreateOSModal}
              className="w-full py-2 px-3 bg-white text-[#992a23] hover:bg-stone-100 font-extrabold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Agendar Nova OS
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-[1440px]">
        {/* TAB 1: DASHBOARD PRINCIPAL */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Header with website's decorative style */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-1 rounded-full bg-[#992a23]"></span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#992a23]">
                    Coordenação Técnica & Comercial — Eng. André e Carol
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-[#3b3b3b] tracking-tight mt-0.5">
                  Resumo do Dia e Fila de Atendimento
                </h1>
                <p className="text-xs text-[#454545]">
                  Acompanhe os chamados recém-abertos pelos clientes, a agenda da equipe de rua e o faturamento de Notas Fiscais
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-[#3b3b3b] text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Download className="w-4 h-4 text-[#992a23]" />
                  Baixar Planilha Excel (CSV)
                </button>
                <button
                  onClick={openCreateOSModal}
                  className="px-4 py-2.5 rounded-xl bg-[#992a23] hover:bg-[#662215] text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  Agendar Nova Manutenção
                </button>
              </div>
            </div>

            {/* 5 Real-time KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div
                onClick={() => {
                  setStatusFilter('PENDENTE_ANALISE');
                  setActiveTab('ORDERS');
                }}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#454545]">
                    OS Abertas / Fila
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-[#3b3b3b] mt-2">
                  {kpis.openOrPending}
                </div>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  {kpis.pendingClientRequests.length} pendente(s) de análise
                </p>
              </div>

              <div
                onClick={() => {
                  setStatusFilter('EM_EXECUCAO');
                  setActiveTab('ORDERS');
                }}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#454545]">
                    Em Andamento
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-blue-700 mt-2">
                  {kpis.inProgress}
                </div>
                <p className="text-[11px] text-[#454545] mt-1">
                  Equipes ativas em campo hoje
                </p>
              </div>

              <div
                onClick={() => {
                  setStatusFilter('CONCLUIDO');
                  setActiveTab('ORDERS');
                }}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#454545]">
                    OS Concluídas
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-emerald-700 mt-2">
                  {kpis.completed}
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Prontas para faturamento N.F
                </p>
              </div>

              <div
                onClick={() => {
                  setTaskFilter('OVERDUE');
                  setActiveTab('TASKS');
                }}
                className="bg-white rounded-2xl p-4 border border-red-200 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700">
                    Tarefas Atrasadas
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-red-600 mt-2">
                  {kpis.overdueTasks}
                </div>
                <p className="text-[11px] text-red-600 font-semibold mt-1">
                  Compras e pendências vencidas
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#992a23] to-[#662215] text-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-100">
                    Receita Estimada (OS)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-white/15 text-amber-200 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xl font-extrabold mt-2">
                  {formatCurrency(kpis.totalEstimatedRevenue)}
                </div>
                <p className="text-[11px] text-red-100 mt-1">
                  Em execução/concluído: {formatCurrency(kpis.confirmedRevenue)}
                </p>
              </div>
            </div>

            {/* Alert Banner: Pending Client Requests (Business Rule #1 -> #2) */}
            {kpis.pendingClientRequests.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-amber-950 uppercase tracking-wide">
                        Fila de Triagem — Solicitações Pendentes de Análise ({kpis.pendingClientRequests.length})
                      </h2>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Chamados abertos pelo Portal do Cliente ou orçamentos aguardando conversão em OS e atribuição de equipe técnica.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {kpis.pendingClientRequests.map((req) => {
                    const client = clients.find((c) => c.id === req.clientId);
                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-xl p-4 border border-amber-200 flex flex-col justify-between gap-3 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#992a23]">
                              {req.code} • {client?.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                PRIORITY_CONFIG[req.priority].bgClass
                              } ${PRIORITY_CONFIG[req.priority].textClass} ${
                                PRIORITY_CONFIG[req.priority].borderClass
                              }`}
                            >
                              {PRIORITY_CONFIG[req.priority].label}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#3b3b3b] mt-1">
                            {req.serviceType}
                          </p>
                          <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                            {req.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                          <span className="text-[11px] text-stone-500">
                            Contato: <strong>{req.contactName}</strong> • Data:{' '}
                            {formatDateBR(req.scheduledDate)}
                          </span>
                          <button
                            onClick={() => openApprovalModal(req)}
                            className="px-3 py-1.5 rounded-lg bg-[#992a23] hover:bg-[#662215] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                          >
                            <span>Aprovar e Atribuir Equipe</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Middle Grid: Team Workload & Live Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Workload by Technician */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#3b3b3b]">
                      Alocação da Equipe Técnica em Campo
                    </h2>
                    <p className="text-xs text-[#454545]">
                      Distribuição de Ordens de Serviço e tarefas por responsável (Agenda Pequim)
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('CLIENTS_TEAM')}
                    className="text-xs text-[#992a23] hover:underline font-bold"
                  >
                    Gerenciar Equipe
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {techUsers.map((tech) => {
                    const techOrders = serviceOrders.filter(
                      (o) =>
                        o.assignedTechIds.includes(tech.id) &&
                        o.status !== 'CANCELADO'
                    );
                    const activeOrders = techOrders.filter(
                      (o) =>
                        o.status === 'AGUARDANDO_EXECUCAO' ||
                        o.status === 'EM_EXECUCAO' ||
                        o.status === 'AGUARDANDO_PECA'
                    );
                    const pendingTasks = tasks.filter(
                      (t) => t.assignedToId === tech.id && !t.completed
                    );

                    return (
                      <div
                        key={tech.id}
                        className="p-3.5 rounded-xl border border-stone-200 hover:border-[#992a23]/50 bg-stone-50/60 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#992a23] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {tech.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-[#3b3b3b] truncate">
                              {tech.name}
                            </div>
                            <div className="text-[11px] text-[#454545] truncate">
                              {tech.jobTitle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-right">
                          <div className="px-2.5 py-1 rounded-lg bg-[#fdf3f2] text-[#992a23] border border-[#992a23]/20 text-xs font-bold">
                            {activeOrders.length} OS ativas
                          </div>
                          <div className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                            {pendingTasks.length} tarefas
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Activity Log */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col">
                <h2 className="text-base font-extrabold text-[#3b3b3b] mb-1">
                  Linha do Tempo Global (Ao Vivo)
                </h2>
                <p className="text-xs text-[#454545] mb-4">
                  Últimos eventos registrados entre Gerência, Campo e Cliente
                </p>

                <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
                  {statusLogs.slice(0, 8).map((log) => {
                    const os = serviceOrders.find((o) => o.id === log.serviceOrderId);
                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border text-xs ${
                          log.isInternal
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-stone-50 border-stone-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#992a23] flex items-center gap-1">
                            {log.isInternal && <Lock className="w-3 h-3 text-amber-600" />}
                            {os?.code || 'OS'} — {log.title}
                          </span>
                          <span className="text-[10px] text-stone-400 shrink-0">
                            {formatDateTimeBR(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-stone-600 mt-1">{log.description}</p>
                        <div className="text-[10px] text-stone-400 mt-1 font-medium">
                          Por: {log.authorName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GESTÃO DE ORDENS DE SERVIÇO (CRUD COMPLETO) */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-5">
            {/* Header & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#3b3b3b] tracking-tight">
                  Manutenções & Ordens de Serviço
                </h1>
                <p className="text-sm text-[#454545]">
                  Controle completo de OS, propostas de orçamento, alocação de equipe e impressão comercial
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={openCreateOSModal}
                  className="px-4 py-2.5 rounded-xl bg-[#992a23] hover:bg-[#662215] text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  + Nova Manutenção
                </button>
              </div>
            </div>

            {/* Search & Dropdown Filters */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar manutenções por código (OS-PE26...), cliente, loja ou endereço..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#992a23]"
                  />
                </div>

                <div>
                  <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#992a23]"
                  >
                    <option value="ALL">Cliente: Todas ({clients.length})</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={techFilter}
                    onChange={(e) => setTechFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#992a23]"
                  >
                    <option value="ALL">Funcionário: Todos</option>
                    {techUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Pill Filters */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-[#454545] mr-1">Status:</span>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    statusFilter === 'ALL'
                      ? 'bg-[#992a23] text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Todas ({serviceOrders.length})
                </button>
                {(Object.keys(STATUS_CONFIG) as OSStatus[]).map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  const count = serviceOrders.filter((o) => o.status === st).length;
                  const active = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border ${
                        active
                          ? 'bg-[#992a23] text-white border-[#992a23] shadow-sm'
                          : `${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} hover:opacity-90`
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          active ? 'bg-white' : cfg.dotClass
                        }`}
                      />
                      <span>{cfg.label}</span>
                      <span className="opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Orders List */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                  <p className="text-stone-500 font-medium">
                    Nenhuma Ordem de Serviço encontrada para os filtros selecionados.
                  </p>
                </div>
              ) : (
                filteredOrders.map((os) => {
                  const client = clients.find((c) => c.id === os.clientId);
                  const statusCfg = STATUS_CONFIG[os.status];
                  const prioCfg = PRIORITY_CONFIG[os.priority];
                  const osTasks = tasks.filter((t) => t.serviceOrderId === os.id);
                  const doneTasks = osTasks.filter((t) => t.completed).length;
                  const progressPct =
                    osTasks.length > 0 ? Math.round((doneTasks / osTasks.length) * 100) : 0;
                  const totalVal = calculateOSTotalValue(os);
                  const techNames = os.assignedTechIds
                    .map((id) => users.find((u) => u.id === id)?.name)
                    .filter(Boolean);

                  return (
                    <div
                      key={os.id}
                      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left Column: Code, Client & Address */}
                        <div className="space-y-1.5 min-w-[240px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-[#992a23]">
                              {os.code}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${prioCfg.bgClass} ${prioCfg.textClass} ${prioCfg.borderClass}`}
                            >
                              {prioCfg.label}
                            </span>
                            {os.origin === 'PORTAL_CLIENTE' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                                Portal do Cliente
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-[#3b3b3b]">
                            <Building2 className="w-4 h-4 text-[#992a23] shrink-0" />
                            <span>{client?.name || 'Cliente'}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 rounded text-stone-600 font-semibold">
                              {client?.type || 'PJ'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-stone-500">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate max-w-md">{os.address}</span>
                          </div>
                        </div>

                        {/* Middle Column: Service Type, Schedule, Techs & Checklist Bar */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100">
                          <div>
                            <div className="text-[11px] text-stone-400 font-medium">
                              Tipo Manutenção / Escopo
                            </div>
                            <div className="text-xs font-extrabold text-[#3b3b3b] mt-0.5">
                              {os.serviceType}
                            </div>
                            <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                              {os.description}
                            </p>
                          </div>

                          <div>
                            <div className="text-[11px] text-stone-400 font-medium">
                              Data Execução Funcionário
                            </div>
                            <div className="text-xs font-bold text-[#3b3b3b] mt-0.5 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#992a23]" />
                              {formatDateBR(os.scheduledDate)} ({os.scheduledTime})
                            </div>
                            <div className="text-xs text-stone-600 mt-1 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-semibold">
                                {techNames.length > 0
                                  ? techNames.join(' / ')
                                  : 'Sem técnico atribuído'}
                              </span>
                            </div>
                            {osTasks.length > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between text-[10px] font-semibold text-stone-500 mb-1">
                                  <span>Checklist Técnico</span>
                                  <span>
                                    {doneTasks}/{osTasks.length} ({progressPct}%)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 transition-all"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="text-[11px] text-stone-400 font-medium">
                              Valor Total & Status
                            </div>
                            <div className="text-sm font-extrabold text-[#992a23] mt-0.5">
                              {formatCurrency(totalVal)}
                            </div>
                            <div className="mt-1">
                              <select
                                value={os.status}
                                onChange={(e) =>
                                  changeOSStatus(
                                    os.id,
                                    e.target.value as OSStatus,
                                    undefined,
                                    'André (Gerência)',
                                    'ADMIN'
                                  )
                                }
                                className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                              >
                                {(Object.keys(STATUS_CONFIG) as OSStatus[]).map((st) => (
                                  <option key={st} value={st} className="bg-white text-stone-800">
                                    ● {STATUS_CONFIG[st].label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {os.feedback && (
                              <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                <span>Avaliação Cliente: {os.feedback.rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100">
                          {os.status === 'PENDENTE_ANALISE' && (
                            <button
                              onClick={() => openApprovalModal(os)}
                              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition"
                            >
                              Aprovar / Atribuir
                            </button>
                          )}

                          <button
                            onClick={() => setPrintingOS(os)}
                            className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-[#3b3b3b] transition"
                            title="Imprimir / Gerar PDF da OS"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditOSModal(os)}
                            className="p-2.5 rounded-xl border border-stone-200 hover:bg-[#fdf3f2] text-[#992a23] transition"
                            title="Editar Ordem de Serviço"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (
                                window.confirm(`Deseja realmente excluir a ${os.code}?`)
                              ) {
                                deleteServiceOrder(os.id);
                              }
                            }}
                            className="p-2.5 rounded-xl border border-stone-200 hover:bg-red-50 text-red-600 transition"
                            title="Excluir OS"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GESTÃO DE TAREFAS INTERNAS & CHECKLISTS */}
        {activeTab === 'TASKS' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-[#3b3b3b] tracking-tight">
                Gestão de Tarefas Internas & Checklists de OS
              </h1>
              <p className="text-sm text-[#454545]">
                Controle de compras de materiais (Distribuidora Frigorífica Central, Distribuidora Térmica Nacional, Loja Elétrica), tarefas administrativas e subtarefas técnicas das OS
              </p>
            </div>

            {/* Quick Task Creation Form */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#992a23] mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#992a23]" />
                Adicionar Nova Tarefa ou Item de Checklist
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTaskTitle.trim()) return;
                  createTask({
                    title: newTaskTitle.trim(),
                    category: newTaskOSId !== 'NONE' ? 'CHECKLIST_OS' : newTaskCategory,
                    serviceOrderId: newTaskOSId === 'NONE' ? null : newTaskOSId,
                    assignedToId: newTaskTechId,
                    supplierOrLocation: newTaskSupplier || undefined,
                    dueDate: newTaskDueDate,
                    priority: newTaskPriority,
                  });
                  setNewTaskTitle('');
                  setNewTaskSupplier('');
                }}
                className="grid grid-cols-1 md:grid-cols-6 gap-3"
              >
                <div className="md:col-span-2">
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ex: Comprar capacitor 25uF e refil turbo tocha..."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <select
                    value={newTaskOSId}
                    onChange={(e) => setNewTaskOSId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option value="NONE">Tarefa Avulsa (Sem OS)</option>
                    {serviceOrders.map((os) => (
                      <option key={os.id} value={os.id}>
                        Vincular à {os.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={newTaskTechId}
                    onChange={(e) => setNewTaskTechId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {techUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        Resp: {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-xl bg-[#992a23] hover:bg-[#662215] text-white font-bold text-xs h-full transition"
                  >
                    + Criar Tarefa
                  </button>
                </div>
              </form>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTaskFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                  taskFilter === 'ALL'
                    ? 'bg-[#992a23] text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                Todas as Tarefas ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('AVULSAS')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                  taskFilter === 'AVULSAS'
                    ? 'bg-[#992a23] text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                Tarefas Internas / Compras ({tasks.filter((t) => !t.serviceOrderId).length})
              </button>
              <button
                onClick={() => setTaskFilter('OS_CHECKLIST')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                  taskFilter === 'OS_CHECKLIST'
                    ? 'bg-[#992a23] text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                Subtarefas de OS ({tasks.filter((t) => t.serviceOrderId).length})
              </button>
              <button
                onClick={() => setTaskFilter('OVERDUE')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                  taskFilter === 'OVERDUE'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                Atrasadas ({kpis.overdueTasks})
              </button>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-sm">
              {tasks
                .filter((t) => {
                  if (taskFilter === 'AVULSAS') return !t.serviceOrderId;
                  if (taskFilter === 'OS_CHECKLIST') return Boolean(t.serviceOrderId);
                  if (taskFilter === 'OVERDUE') return !t.completed && t.dueDate < TODAY_STR;
                  return true;
                })
                .map((task) => {
                  const assignee = users.find((u) => u.id === task.assignedToId);
                  const linkedOS = serviceOrders.find((o) => o.id === task.serviceOrderId);
                  const isOverdue = !task.completed && task.dueDate < TODAY_STR;

                  return (
                    <div
                      key={task.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id, 'André (Gerência)')}
                          className="mt-1 w-4 h-4 rounded border-stone-300 text-[#992a23] focus:ring-[#992a23] cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-semibold ${
                                task.completed
                                  ? 'line-through text-stone-400'
                                  : 'text-stone-900'
                              }`}
                            >
                              {task.title}
                            </span>
                            {linkedOS ? (
                              <span className="px-2 py-0.5 rounded bg-[#fdf3f2] text-[#992a23] border border-[#992a23]/20 text-[10px] font-bold">
                                Checklist {linkedOS.code}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold">
                                Tarefa Avulsa ({task.supplierOrLocation || 'Interna'})
                              </span>
                            )}
                            {isOverdue && (
                              <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-extrabold">
                                ATRASADA
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 mt-1 flex items-center gap-3">
                            <span>
                              Responsável: <strong>{assignee?.name || 'Equipe'}</strong>
                            </span>
                            <span>•</span>
                            <span>Prazo: {formatDateBR(task.dueDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            PRIORITY_CONFIG[task.priority].bgClass
                          } ${PRIORITY_CONFIG[task.priority].textClass} ${
                            PRIORITY_CONFIG[task.priority].borderClass
                          }`}
                        >
                          {PRIORITY_CONFIG[task.priority].label}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg"
                          title="Remover tarefa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: GESTÃO DE CLIENTES E EQUIPE */}
        {activeTab === 'CLIENTS_TEAM' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#3b3b3b]">
                    Carteira de Clientes ({clients.length})
                  </h2>
                  <p className="text-xs text-[#454545]">
                    Empresas contratantes de PMOC, obras de instalação VRF e manutenções corretivas
                  </p>
                </div>
                <button
                  onClick={() => setShowNewClientForm((v) => !v)}
                  className="px-4 py-2 rounded-xl bg-[#992a23] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Novo Cliente
                </button>
              </div>

              {showNewClientForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!cName.trim()) return;
                    createClient({
                      name: cName.trim(),
                      type: cType,
                      contactName: cContact.trim() || 'Responsável',
                      phone: cPhone.trim() || '(31) 3000-0000',
                      email: cEmail.trim() || 'contato@empresa.com.br',
                      address: cAddress.trim() || 'Belo Horizonte - MG',
                      neighborhood: 'Centro',
                      city: cCity.trim() || 'Belo Horizonte',
                      contractType: cContract,
                    });
                    setCName('');
                    setCContact('');
                    setCAddress('');
                    setCPhone('');
                    setCEmail('');
                    setShowNewClientForm(false);
                  }}
                  className="bg-white p-5 rounded-2xl border border-[#992a23]/30 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <input
                    type="text"
                    required
                    placeholder="Razão Social / Nome do Cliente"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nome do Contato (ex: Eng. Felipe)"
                    value={cContact}
                    onChange={(e) => setCContact(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Telefone / WhatsApp"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Endereço Completo"
                    value={cAddress}
                    onChange={(e) => setCAddress(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm sm:col-span-2"
                  />
                  <select
                    value={cContract}
                    onChange={(e) => setCContract(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option value="AVULSO">Atendimento Avulso</option>
                    <option value="PMOC_MENSAL">Contrato PMOC Mensal</option>
                    <option value="PMOC_TRIMESTRAL">Contrato PMOC Trimestral</option>
                    <option value="PMOC_SEMESTRAL">Contrato PMOC Semestral</option>
                  </select>
                  <div className="sm:col-span-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewClientForm(false)}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#992a23] text-white text-xs font-bold"
                    >
                      Salvar Cliente
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => {
                  const clientOSCount = serviceOrders.filter(
                    (o) => o.clientId === client.id
                  ).length;
                  return (
                    <div
                      key={client.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-[#992a23] truncate">
                            {client.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {client.type}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">
                            {client.address} — {client.city}
                          </span>
                        </p>
                        <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>
                            Contato: <strong>{client.contactName}</strong> ({client.phone})
                          </span>
                        </p>
                      </div>
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#992a23] bg-[#fdf3f2] px-2 py-0.5 rounded">
                          {client.contractType.replace('_', ' ')}
                        </span>
                        <span className="text-stone-500 font-medium">
                          {clientOSCount} OS vinculada(s)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#3b3b3b]">
                    Funcionários & Equipe Técnica ({techUsers.length})
                  </h2>
                  <p className="text-xs text-[#454545]">
                    Profissionais habilitados para atribuição nas Ordens de Serviço da Pequim Engenharia
                  </p>
                </div>
                <button
                  onClick={() => setShowNewTechForm((v) => !v)}
                  className="px-4 py-2 rounded-xl bg-[#992a23] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Profissional
                </button>
              </div>

              {showNewTechForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!tName.trim()) return;
                    createUser({
                      name: tName.trim(),
                      role: 'TECH',
                      jobTitle: tTitle.trim(),
                      phone: tPhone.trim() || '(31) 99000-0000',
                      email: tEmail.trim() || 'tecnico@empresa-demo.com.br',
                      avatarInitials: tName.trim().slice(0, 2).toUpperCase(),
                      active: true,
                    });
                    setTName('');
                    setShowNewTechForm(false);
                  }}
                  className="bg-white p-5 rounded-2xl border border-[#992a23]/30 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3"
                >
                  <input
                    type="text"
                    required
                    placeholder="Nome do Técnico (ex: Jonas)"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Cargo / Especialidade"
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#992a23] text-white text-xs font-bold"
                  >
                    Cadastrar Técnico
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {techUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex items-center gap-3.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#992a23] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                      {u.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#3b3b3b] truncate">
                        {u.name}
                      </div>
                      <div className="text-xs text-stone-500 truncate">{u.jobTitle}</div>
                      <div className="text-[11px] text-[#992a23] font-semibold mt-0.5">
                        {u.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: IMPORTAÇÃO / EXPORTAÇÃO CSV */}
        {activeTab === 'IMPORT_EXPORT' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-[#3b3b3b] tracking-tight">
                Importação & Exportação — Planilha AGENDA PEQUIM
              </h1>
              <p className="text-sm text-[#454545]">
                Integração direta com o layout da planilha <code>AGENDA - GESTÃO OPERACIONAL.xlsx</code>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Export Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#3b3b3b]">
                  Exportar Relatório Completo em CSV (Excel)
                </h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Gera arquivo CSV separado por ponto-e-vírgula (<code>;</code>) com codificação UTF-8 BOM para abertura direta no Microsoft Excel mantendo todas as colunas originais:
                  <strong> SEMANA, DATA, HORÁRIO, CLIENTE, ENDEREÇO, DESCRIÇÃO DO SERVIÇO, CONTATO, RESPONSÁVEL PELO SERVIÇO, TIPOS DE CLIENTES, TIPOS DE SERVIÇOS, Nº RELATÓRIO, VALOR DO SERVIÇO, EMAIL ENVIADO PARA EMITIR N.F</strong>.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Relatório Atual ({serviceOrders.length} OS)
                  </button>
                  <button
                    onClick={handleDownloadTemplateCSV}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#992a23]" />
                    Baixar Modelo CSV de Exemplo
                  </button>
                </div>
              </div>

              {/* Import Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-xl bg-[#fdf3f2] text-[#992a23] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#3b3b3b]">
                  Importar Dados da Planilha via CSV
                </h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Selecione um arquivo <code>.csv</code> exportado do Excel ou cole as linhas abaixo. O sistema normaliza automaticamente os clientes, identifica os técnicos pelo nome (ex: <code>WARLESON / ALEXANDRE</code>) e transforma itens com <code>*</code> em checklists!
                </p>

                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUploadCSV}
                    className="block w-full text-xs text-stone-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#fdf3f2] file:text-[#992a23] hover:file:bg-red-100"
                  />

                  <textarea
                    rows={5}
                    value={csvInputText}
                    onChange={(e) => setCsvInputText(e.target.value)}
                    placeholder={`Cole aqui o CSV ou clique em "Preencher com 2 linhas de exemplo prontas"...\nSEMANA;DATA;HORÁRIO;CLIENTE;ENDEREÇO;DESCRIÇÃO DO SERVIÇO;CONTATO;RESPONSÁVEL PELO SERVIÇO;TIPOS DE CLIENTES;TIPOS DE SERVIÇOS;Nº RELATÓRIO;VALOR DO SERVIÇO;EMAIL ENVIADO PARA EMITIR N.F`}
                    className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono"
                  />

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCsvInputText(getSampleCSVTemplate())}
                      className="text-xs text-[#992a23] hover:underline font-bold"
                    >
                      Preencher com 2 linhas de exemplo prontas
                    </button>

                    <button
                      type="button"
                      onClick={handleProcessCSVImport}
                      disabled={!csvInputText.trim()}
                      className="px-4 py-2 rounded-xl bg-[#992a23] disabled:opacity-40 hover:bg-[#662215] text-white text-xs font-bold transition"
                    >
                      Processar e Importar OS
                    </button>
                  </div>

                  {importFeedback && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      {importFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: CREATE / EDIT SERVICE ORDER + INSTALLATION PRICING CALCULATOR */}
      {showOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8">
            <div className="bg-[#992a23] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingOS
                    ? `Editar Ordem de Serviço — ${editingOS.code}`
                    : 'Nova Ordem de Serviço / Manutenção'}
                </h3>
                <p className="text-xs text-red-100">
                  Preencha os campos da planilha e atribua a equipe técnica responsável
                </p>
              </div>
              <button
                onClick={() => setShowOSModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOS} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={formClientId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setFormClientId(cid);
                      const cl = clients.find((c) => c.id === cid);
                      if (cl) {
                        setFormAddress(cl.address);
                        setFormContact(cl.contactName);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tipo de Serviço (Aba Tabelas) *
                  </label>
                  <select
                    value={formServiceType}
                    onChange={(e) => setFormServiceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {SERVICE_TYPES_CATALOG.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Data de Execução
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Horário (Agenda)
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="07:00 às 17:00"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as OSPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Status da OS
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as OSStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {(Object.keys(STATUS_CONFIG) as OSStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {STATUS_CONFIG[st].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Endereço do Atendimento
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Contato no Local
                  </label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Responsável pelo Serviço (Técnicos Alocados)
                </label>
                <div className="flex flex-wrap gap-2">
                  {techUsers.map((tech) => {
                    const selected = formTechIds.includes(tech.id);
                    return (
                      <button
                        type="button"
                        key={tech.id}
                        onClick={() =>
                          toggleTechInList(tech.id, formTechIds, setFormTechIds)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          selected
                            ? 'bg-[#992a23] text-white border-[#992a23] shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {tech.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope Description + Calculator Helper */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    Descrição Detalhada do Serviço *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPricingCalc((v) => !v)}
                    className="text-xs font-bold text-[#992a23] hover:underline flex items-center gap-1"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    {showPricingCalc
                      ? 'Ocultar Tabela de Preços de Instalação'
                      : 'Usar Tabela de Preços da Planilha (Splits/Tubulação/PMOC)'}
                  </button>
                </div>

                {showPricingCalc && (
                  <div className="mb-3 p-3.5 rounded-xl bg-[#fdf3f2] border border-[#992a23]/25 space-y-2">
                    <div className="text-xs font-bold text-[#992a23]">
                      Catálogo Oficial Pequim Engenharia (Aba "Orçamento instalação" — clique para somar ao valor e escopo):
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {INSTALLATION_PRICING_CATALOG.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => {
                            setFormValue((prev) => Number(prev) + item.unitPrice);
                            setFormDescription((prev) =>
                              prev
                                ? `${prev}\n* ${item.name} (${formatCurrency(item.unitPrice)})`
                                : `* ${item.name} (${formatCurrency(item.unitPrice)})`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#992a23] hover:text-white text-stone-700 border border-[#992a23]/25 text-[11px] font-semibold transition"
                        >
                          + {item.name} ({formatCurrency(item.unitPrice)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva os serviços a executar..."
                  className="w-full p-3 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              {!editingOS && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Checklist Inicial para o Técnico (1 subtarefa por linha)
                  </label>
                  <textarea
                    rows={3}
                    value={formChecklistText}
                    onChange={(e) => setFormChecklistText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Valor do Serviço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-[#992a23]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nº Proposta (Orçamento)
                  </label>
                  <input
                    type="text"
                    value={formProposal}
                    onChange={(e) => setFormProposal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nº Relatório
                  </label>
                  <input
                    type="text"
                    value={formReport}
                    onChange={(e) => setFormReport(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    E-mail Emitir N.F Enviado
                  </label>
                  <select
                    value={formInvoiceSent}
                    onChange={(e) => setFormInvoiceSent(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                    <option value="-">-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Observações Internas da Equipe (Oculto para o Cliente)
                </label>
                <input
                  type="text"
                  value={formInternalNotes}
                  onChange={(e) => setFormInternalNotes(e.target.value)}
                  placeholder="Ex: Levar cilindro de nitrogênio extra; chave na portaria..."
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/40 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowOSModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#992a23] hover:bg-[#662215] text-white text-xs font-bold shadow-sm transition"
                >
                  {editingOS ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVE CLIENT REQUEST & ASSIGN TECH TEAM */}
      {approvingOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-[#992a23] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">
                  Aprovar Solicitação & Atribuir Equipe — {approvingOS.code}
                </h3>
                <p className="text-xs font-medium text-red-100">
                  Ao confirmar, a OS entra imediatamente na fila do Técnico e atualiza o Portal do Cliente
                </p>
              </div>
              <button
                onClick={() => setApprovingOS(null)}
                className="p-1 rounded-lg hover:bg-black/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                <div className="font-bold text-[#992a23]">
                  Solicitação do Cliente: {approvingOS.serviceType}
                </div>
                <p className="text-stone-600">{approvingOS.description}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  1. Selecionar Técnico(s) Responsável(is) *
                </label>
                <div className="flex flex-wrap gap-2">
                  {techUsers.map((tech) => {
                    const selected = approveTechIds.includes(tech.id);
                    return (
                      <button
                        type="button"
                        key={tech.id}
                        onClick={() =>
                          toggleTechInList(tech.id, approveTechIds, setApproveTechIds)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          selected
                            ? 'bg-[#992a23] text-white border-[#992a23]'
                            : 'bg-stone-50 text-stone-700 border-stone-300'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {tech.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Data Agendada
                  </label>
                  <input
                    type="date"
                    value={approveDate}
                    onChange={(e) => setApproveDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="text"
                    value={approveTime}
                    onChange={(e) => setApproveTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={approveValue}
                    onChange={(e) => setApproveValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Checklist de Atividades para o Técnico (1 item por linha)
                </label>
                <textarea
                  rows={3}
                  value={approveChecklist}
                  onChange={(e) => setApproveChecklist(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer bg-amber-50 p-3 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  checked={approveRequireBudget}
                  onChange={(e) => setApproveRequireBudget(e.target.checked)}
                  className="w-4 h-4 rounded text-[#992a23]"
                />
                <span>
                  Exigir aprovação prévia do orçamento pelo Cliente no Portal antes de liberar execução
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setApprovingOS(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#992a23] hover:bg-[#662215] text-white text-xs font-bold shadow-sm"
                >
                  Confirmar e Enviar para Fila Técnica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
