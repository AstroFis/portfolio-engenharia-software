import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  Client,
  ServiceOrder,
  Task,
  StatusLog,
  OSStatus,
  OSPriority,
  RealtimeNotification,
  TaskCategory,
} from '../types/schema';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_SERVICE_ORDERS,
  INITIAL_TASKS,
  INITIAL_STATUS_LOGS,
} from '../data/seedData';
import { STATUS_CONFIG } from '../utils/formatters';

const STORAGE_KEY = 'pequim_engenharia_mvp_v1';

interface PersistedState {
  users: User[];
  clients: Client[];
  serviceOrders: ServiceOrder[];
  tasks: Task[];
  statusLogs: StatusLog[];
  notifications: RealtimeNotification[];
}

interface AppContextType {
  // Active Role & Persona Switcher
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTechId: string;
  setActiveTechId: (id: string) => void;
  activeClientId: string;
  setActiveClientId: (id: string) => void;

  // Normalized Database Entities
  users: User[];
  clients: Client[];
  serviceOrders: ServiceOrder[];
  tasks: Task[];
  statusLogs: StatusLog[];
  notifications: RealtimeNotification[];

  // Print / PDF Modal Trigger
  printingOS: ServiceOrder | null;
  setPrintingOS: (os: ServiceOrder | null) => void;

  // Onboarding Tour & Guided UX State
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showGuidedBar: boolean;
  setShowGuidedBar: (show: boolean) => void;

  // CRUD & Business Flow Actions
  createServiceOrder: (
    data: Omit<ServiceOrder, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'additionalCosts' | 'evidences'>,
    checklistItems?: string[]
  ) => ServiceOrder;
  updateServiceOrder: (id: string, updates: Partial<ServiceOrder>, logMessage?: string) => void;
  deleteServiceOrder: (id: string) => void;
  changeOSStatus: (
    osId: string,
    newStatus: OSStatus,
    note?: string,
    authorName?: string,
    authorRole?: UserRole
  ) => void;
  approveAndAssignOS: (
    osId: string,
    params: {
      assignedTechIds: string[];
      priority: OSPriority;
      serviceValue: number;
      scheduledDate: string;
      scheduledTime: string;
      requireClientBudgetApproval: boolean;
      checklistItems: string[];
    }
  ) => void;

  // Tech Execution Actions
  toggleTask: (taskId: string, actorName?: string) => void;
  createTask: (data: Omit<Task, 'id' | 'completed'>) => void;
  deleteTask: (taskId: string) => void;
  addTechnicalNote: (osId: string, note: string, isInternal: boolean, authorName: string) => void;
  addAdditionalCost: (
    osId: string,
    description: string,
    quantity: number,
    unitValue: number,
    addedBy: string
  ) => void;
  removeAdditionalCost: (osId: string, costId: string) => void;
  addEvidence: (
    osId: string,
    title: string,
    type: 'PHOTO' | 'DOCUMENT' | 'LINK',
    url: string,
    uploadedBy: string
  ) => void;

  // Client Portal Actions
  createClientRequest: (params: {
    clientId: string;
    serviceType: string;
    priority: OSPriority;
    preferredDate: string;
    preferredTime: string;
    address: string;
    contactName: string;
    description: string;
  }) => ServiceOrder;
  respondToBudget: (osId: string, approved: boolean, clientComment?: string) => void;
  submitClientFeedback: (osId: string, rating: number, comment: string) => void;

  // Clients & Team Management
  createClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  createUser: (user: Omit<User, 'id'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;

  // Spreadsheet CSV Import & Reset
  importCSVData: (csvText: string) => { importedCount: number; newClientsCount: number };
  markNotificationsRead: () => void;
  resetToSeedData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.serviceOrders) && parsed.serviceOrders.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao carregar estado salvo:', e);
  }
  return {
    users: INITIAL_USERS,
    clients: INITIAL_CLIENTS,
    serviceOrders: INITIAL_SERVICE_ORDERS,
    tasks: INITIAL_TASKS,
    statusLogs: INITIAL_STATUS_LOGS,
    notifications: [
      {
        id: 'notif-init-1',
        title: 'Novo Chamado no Portal do Cliente',
        message: 'SATEL Safar abriu solicitação urgente (OS-PE2603007) — Pendente de Análise.',
        targetRoles: ['ADMIN'],
        serviceOrderId: 'os-9',
        createdAt: '2026-10-17T13:45:00',
        read: false,
      },
      {
        id: 'notif-init-2',
        title: 'Orçamento Pendente de Aprovação',
        message: 'Proposta PE2602533 (R$ 84.500,00) aguarda aceite de Nona Empreendimentos.',
        targetRoles: ['CLIENT', 'ADMIN'],
        serviceOrderId: 'os-2',
        createdAt: '2026-10-16T09:10:00',
        read: false,
      },
    ],
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeRole, setActiveRole] = useState<UserRole>('CLIENT');
  const [activeTechId, setActiveTechId] = useState<string>('user-higor');
  const [activeClientId, setActiveClientId] = useState<string>('client-satelita');
  const [printingOS, setPrintingOS] = useState<ServiceOrder | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pequim_onboarding_seen_v1') !== 'true';
    } catch {
      return true;
    }
  });
  const [showGuidedBar, setShowGuidedBar] = useState<boolean>(true);

  const handleSetShowOnboarding = useCallback((show: boolean) => {
    setShowOnboarding(show);
    if (!show) {
      try {
        localStorage.setItem('pequim_onboarding_seen_v1', 'true');
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  // Save to localStorage and sync across tabs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Erro ao salvar estado no localStorage:', e);
    }
  }, [state]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          setState(JSON.parse(event.newValue));
        } catch (e) {
          console.error('Erro ao sincronizar abas:', e);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const pushNotification = useCallback(
    (
      title: string,
      message: string,
      targetRoles: UserRole[],
      serviceOrderId?: string
    ): RealtimeNotification => ({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      targetRoles,
      serviceOrderId,
      createdAt: new Date().toISOString(),
      read: false,
    }),
    []
  );

  const createServiceOrder = useCallback(
    (
      data: Omit<ServiceOrder, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'additionalCosts' | 'evidences'>,
      checklistItems: string[] = []
    ): ServiceOrder => {
      const now = new Date().toISOString();
      const seq = state.serviceOrders.length + 534;
      const code = `OS-PE260${seq}`;
      const newOS: ServiceOrder = {
        ...data,
        id: `os-${Date.now()}`,
        code,
        proposalNumber: data.proposalNumber || `PE260${seq}`,
        additionalCosts: [],
        evidences: [],
        createdAt: now,
        updatedAt: now,
      };

      const newTasks: Task[] = checklistItems
        .map((t) => t.trim())
        .filter(Boolean)
        .map((title, idx) => ({
          id: `task-${Date.now()}-${idx}`,
          serviceOrderId: newOS.id,
          title,
          category: 'CHECKLIST_OS' as TaskCategory,
          assignedToId: data.assignedTechIds[0] || 'user-higor',
          dueDate: data.scheduledDate,
          dueTime: data.scheduledTime,
          priority: data.priority,
          completed: false,
        }));

      const newLog: StatusLog = {
        id: `log-${Date.now()}`,
        serviceOrderId: newOS.id,
        newStatus: newOS.status,
        title: `Ordem de Serviço ${code} Criada`,
        description: `OS registrada para ${data.serviceType} (${STATUS_CONFIG[newOS.status].label}).`,
        authorName: 'André (Gerência)',
        authorRole: 'ADMIN',
        isInternal: false,
        createdAt: now,
      };

      const notif = pushNotification(
        `Nova ${code} Criada`,
        `Serviço "${data.serviceType}" agendado para ${data.scheduledDate}.`,
        ['ADMIN', 'TECH', 'CLIENT'],
        newOS.id
      );

      setState((prev) => ({
        ...prev,
        serviceOrders: [newOS, ...prev.serviceOrders],
        tasks: [...newTasks, ...prev.tasks],
        statusLogs: [newLog, ...prev.statusLogs],
        notifications: [notif, ...prev.notifications],
      }));

      return newOS;
    },
    [state.serviceOrders.length, pushNotification]
  );

  const updateServiceOrder = useCallback(
    (id: string, updates: Partial<ServiceOrder>, logMessage?: string) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const target = prev.serviceOrders.find((o) => o.id === id);
        if (!target) return prev;

        const updatedOS: ServiceOrder = {
          ...target,
          ...updates,
          updatedAt: now,
        };

        const logs = [...prev.statusLogs];
        if (logMessage || (updates.status && updates.status !== target.status)) {
          logs.unshift({
            id: `log-${Date.now()}`,
            serviceOrderId: id,
            previousStatus: target.status,
            newStatus: updatedOS.status,
            title:
              updates.status && updates.status !== target.status
                ? `Status alterado para ${STATUS_CONFIG[updatedOS.status].label}`
                : 'Ordem de Serviço Atualizada',
            description:
              logMessage ||
              `Dados operacionais da ${target.code} atualizados pela Gerência.`,
            authorName: 'Gerência Pequim',
            authorRole: 'ADMIN',
            isInternal: false,
            createdAt: now,
          });
        }

        return {
          ...prev,
          serviceOrders: prev.serviceOrders.map((o) => (o.id === id ? updatedOS : o)),
          statusLogs: logs,
        };
      });
    },
    []
  );

  const deleteServiceOrder = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      serviceOrders: prev.serviceOrders.filter((o) => o.id !== id),
      tasks: prev.tasks.filter((t) => t.serviceOrderId !== id),
      statusLogs: prev.statusLogs.filter((l) => l.serviceOrderId !== id),
    }));
  }, []);

  const changeOSStatus = useCallback(
    (
      osId: string,
      newStatus: OSStatus,
      note?: string,
      authorName: string = 'Equipe Técnica',
      authorRole: UserRole = 'TECH'
    ) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const os = prev.serviceOrders.find((o) => o.id === osId);
        if (!os) return prev;

        const updatedOS: ServiceOrder = {
          ...os,
          status: newStatus,
          updatedAt: now,
        };

        const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
        const newLog: StatusLog = {
          id: `log-${Date.now()}`,
          serviceOrderId: osId,
          previousStatus: os.status,
          newStatus,
          title: `Status atualizado: ${statusLabel}`,
          description:
            note ||
            `A Ordem de Serviço ${os.code} avançou para a etapa "${statusLabel}".`,
          authorName,
          authorRole,
          isInternal: false,
          createdAt: now,
        };

        const notif = pushNotification(
          `${os.code} • ${statusLabel}`,
          `${authorName} alterou o status da ${os.code} para ${statusLabel}.`,
          ['ADMIN', 'TECH', 'CLIENT'],
          osId
        );

        return {
          ...prev,
          serviceOrders: prev.serviceOrders.map((o) => (o.id === osId ? updatedOS : o)),
          statusLogs: [newLog, ...prev.statusLogs],
          notifications: [notif, ...prev.notifications],
        };
      });
    },
    [pushNotification]
  );

  const approveAndAssignOS = useCallback(
    (
      osId: string,
      params: {
        assignedTechIds: string[];
        priority: OSPriority;
        serviceValue: number;
        scheduledDate: string;
        scheduledTime: string;
        requireClientBudgetApproval: boolean;
        checklistItems: string[];
      }
    ) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const os = prev.serviceOrders.find((o) => o.id === osId);
        if (!os) return prev;

        const nextStatus: OSStatus = params.requireClientBudgetApproval
          ? 'AGUARDANDO_APROVACAO'
          : 'AGUARDANDO_EXECUCAO';

        const updatedOS: ServiceOrder = {
          ...os,
          assignedTechIds: params.assignedTechIds,
          priority: params.priority,
          serviceValue: params.serviceValue,
          scheduledDate: params.scheduledDate,
          scheduledTime: params.scheduledTime,
          status: nextStatus,
          budgetApprovalStatus: params.requireClientBudgetApproval ? 'PENDENTE' : 'APROVADO',
          updatedAt: now,
        };

        const techNames = params.assignedTechIds
          .map((tid) => prev.users.find((u) => u.id === tid)?.name)
          .filter(Boolean)
          .join(', ');

        const newTasks: Task[] = params.checklistItems
          .map((item) => item.trim())
          .filter(Boolean)
          .map((title, idx) => ({
            id: `task-${Date.now()}-${idx}`,
            serviceOrderId: osId,
            title,
            category: 'CHECKLIST_OS' as TaskCategory,
            assignedToId: params.assignedTechIds[0] || 'user-higor',
            dueDate: params.scheduledDate,
            dueTime: params.scheduledTime,
            priority: params.priority,
            completed: false,
          }));

        const newLog: StatusLog = {
          id: `log-${Date.now()}`,
          serviceOrderId: osId,
          previousStatus: os.status,
          newStatus: nextStatus,
          title: params.requireClientBudgetApproval
            ? 'Solicitação Analisada — Orçamento Enviado ao Cliente'
            : 'Solicitação Aprovada e Convertida em OS na Fila Técnica',
          description: params.requireClientBudgetApproval
            ? `Gerência definiu orçamento de R$ ${params.serviceValue.toFixed(2)} e equipe técnica (${techNames || 'A definir'}). Aguardando aceite do cliente.`
            : `OS aprovada pela Gerência e atribuída para ${techNames || 'Equipe Técnica'} em ${params.scheduledDate} (${params.scheduledTime}).`,
          authorName: 'André (Gerência)',
          authorRole: 'ADMIN',
          isInternal: false,
          createdAt: now,
        };

        const notif = pushNotification(
          `${os.code} Aprovada pela Gerência`,
          params.requireClientBudgetApproval
            ? `Orçamento enviado ao cliente para aprovação.`
            : `Atribuída para ${techNames} — já disponível na Fila de Trabalho!`,
          ['TECH', 'CLIENT', 'ADMIN'],
          osId
        );

        return {
          ...prev,
          serviceOrders: prev.serviceOrders.map((o) => (o.id === osId ? updatedOS : o)),
          tasks: [...newTasks, ...prev.tasks],
          statusLogs: [newLog, ...prev.statusLogs],
          notifications: [notif, ...prev.notifications],
        };
      });
    },
    [pushNotification]
  );

  const toggleTask = useCallback(
    (taskId: string, actorName: string = 'Equipe Técnica') => {
      const now = new Date().toISOString();
      setState((prev) => {
        const target = prev.tasks.find((t) => t.id === taskId);
        if (!target) return prev;

        const nextCompleted = !target.completed;
        const updatedTasks = prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: nextCompleted,
                completedAt: nextCompleted ? now : undefined,
                completedBy: nextCompleted ? actorName : undefined,
              }
            : t
        );

        const logs = [...prev.statusLogs];
        const notifs = [...prev.notifications];

        if (target.serviceOrderId) {
          const os = prev.serviceOrders.find((o) => o.id === target.serviceOrderId);
          if (os) {
            const osTasks = updatedTasks.filter((t) => t.serviceOrderId === os.id);
            const doneCount = osTasks.filter((t) => t.completed).length;
            const pct = osTasks.length > 0 ? Math.round((doneCount / osTasks.length) * 100) : 0;

            logs.unshift({
              id: `log-${Date.now()}`,
              serviceOrderId: os.id,
              previousStatus: os.status,
              newStatus: os.status,
              title: nextCompleted
                ? `Etapa Concluída (${pct}% do Checklist)`
                : `Etapa Reaberta (${pct}% do Checklist)`,
              description: `${actorName} ${nextCompleted ? 'concluiu' : 'reabriu'} o item: "${target.title}".`,
              authorName: actorName,
              authorRole: 'TECH',
              isInternal: false,
              createdAt: now,
            });

            notifs.unshift(
              pushNotification(
                `Checklist ${os.code}: ${pct}%`,
                `${actorName} ${nextCompleted ? 'marcou como concluído' : 'reabriu'}: "${target.title}"`,
                ['ADMIN', 'CLIENT'],
                os.id
              )
            );
          }
        }

        return {
          ...prev,
          tasks: updatedTasks,
          statusLogs: logs,
          notifications: notifs,
        };
      });
    },
    [pushNotification]
  );

  const createTask = useCallback((data: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      completed: false,
    };
    setState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  }, []);

  const addTechnicalNote = useCallback(
    (osId: string, note: string, isInternal: boolean, authorName: string) => {
      if (!note.trim()) return;
      const now = new Date().toISOString();
      setState((prev) => {
        const os = prev.serviceOrders.find((o) => o.id === osId);
        if (!os) return prev;

        const formattedEntry = `[${new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${authorName}]: ${note.trim()}`;

        const updatedOS: ServiceOrder = {
          ...os,
          technicalNotes: isInternal
            ? os.technicalNotes
            : os.technicalNotes
              ? `${os.technicalNotes}\n${formattedEntry}`
              : formattedEntry,
          internalNotes: isInternal
            ? os.internalNotes
              ? `${os.internalNotes}\n${formattedEntry}`
              : formattedEntry
            : os.internalNotes,
          updatedAt: now,
        };

        const newLog: StatusLog = {
          id: `log-${Date.now()}`,
          serviceOrderId: osId,
          previousStatus: os.status,
          newStatus: os.status,
          title: isInternal
            ? 'Observação Interna da Equipe (Confidencial)'
            : 'Apontamento Técnico Registrado',
          description: note.trim(),
          authorName,
          authorRole: 'TECH',
          isInternal,
          createdAt: now,
        };

        const notif = pushNotification(
          isInternal ? `Nota Interna • ${os.code}` : `Apontamento Técnico • ${os.code}`,
          `${authorName}: "${note.trim().slice(0, 60)}..."`,
          isInternal ? ['ADMIN', 'TECH'] : ['ADMIN', 'TECH', 'CLIENT'],
          osId
        );

        return {
          ...prev,
          serviceOrders: prev.serviceOrders.map((o) => (o.id === osId ? updatedOS : o)),
          statusLogs: [newLog, ...prev.statusLogs],
          notifications: [notif, ...prev.notifications],
        };
      });
    },
    [pushNotification]
  );

  const addAdditionalCost = useCallback(
    (
      osId: string,
      description: string,
      quantity: number,
      unitValue: number,
      addedBy: string
    ) => {
      const now = new Date().toISOString();
      const totalValue = quantity * unitValue;
      setState((prev) => {
        const os = prev.serviceOrders.find((o) => o.id === osId);
        if (!os) return prev;

        const newCost = {
          id: `cost-${Date.now()}`,
          description,
          quantity,
          unitValue,
          totalValue,
          addedBy,
          createdAt: now,
        };

        const updatedOS: ServiceOrder = {
          ...os,
          additionalCosts: [...os.additionalCosts, newCost],
          updatedAt: now,
        };

        const newLog: StatusLog = {
          id: `log-${Date.now()}`,
          serviceOrderId: osId,
          previousStatus: os.status,
          newStatus: os.status,
          title: 'Material / Custo Adicional Apontado',
          description: `Adicionado: ${quantity}x ${description} (Total: R$ ${totalValue.toFixed(2)}).`,
          authorName: addedBy,
          authorRole: 'TECH',
          isInternal: false,
          createdAt: now,
        };

        return {
          ...prev,
          serviceOrders: prev.serviceOrders.map((o) => (o.id === osId ? updatedOS : o)),
          statusLogs: [newLog, ...prev.statusLogs],
        };
      });
    },
    []
  );

  const removeAdditionalCost = useCallback((osId: string, costId: string) => {
    setState((prev) => ({
      ...prev,
      serviceOrders: prev.serviceOrders.map((o) =>
        o.id === osId
          ? {
              ...o,
              additionalCosts: o.additionalCosts.filter((c) => c.id !== costId),
            }
          : o
      ),
    }));
  }, []);

  const addEvidence = useCallback(
    (
      osId: string,
      title: string,
      type: 'PHOTO' | 'DOCUMENT' | 'LINK',
      url: string,
      uploadedBy: string
    ) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const os = prev.serviceOrders.find((o) => o.id === osId);
        if (!os) return prev;

        const newEv = {
          id: `ev-${Date.now()}`,
          title,
          type,
          url,
          uploadedBy,
          createdAt: now,
        };

        const updatedOS: ServiceOrder = {
          ...os,
          evidences: [...os.evidences, newEv],
          updatedAt: now,
        };

        const newLog: StatusLog = {
          id: `log-${Date.now()}`,
          serviceOrderId: osId,
          previousStatus: os.status,
          newStatus: os.status,
          title: 'Evidência Técnica Anexada',
          description: `${uploadedBy} anexou evidência: "${title}".`,
          authorName: uploadedBy,
          authorRole: 'TECH',
          isInternal: false,
          createdAt: now,
        };

        return {
          ...prev,
          serviceOrders: prev.serviceOrders.map((o) => (o.id === osId ? updatedOS : o)),
          statusLogs: [newLog, ...prev.statusLogs],
        };
      });
    },
    []
  );

  // Regra 1: Quando o Cliente abre uma solicitação -> Aparece como "Pendente de Análise" para a Gerência
  const createClientRequest = useCallback(
    (params: {
      clientId: string;
      serviceType: string;
      priority: OSPriority;
      preferredDate: string;
      preferredTime: string;
      address: string;
      contactName: string;
      description: string;
    }): ServiceOrder => {
      const now = new Date().toISOString();
      const seq = state.serviceOrders.length + 535;
      const code = `OS-PE260${seq}`;
      const client = state.clients.find((c) => c.id === params.clientId);

      const newOS: ServiceOrder = {
        id: `os-${Date.now()}`,
        code,
        proposalNumber: `SOL-${seq}`,
        reportNumber: '-',
        clientId: params.clientId,
        assignedTechIds: [],
        serviceType: params.serviceType,
        priority: params.priority,
        status: 'PENDENTE_ANALISE',
        weekLabel: 'SEMANA ATUAL',
        scheduledDate: params.preferredDate,
        scheduledTime: params.preferredTime || 'Horário Comercial',
        address: params.address || client?.address || '',
        contactName: params.contactName || client?.contactName || '',
        description: params.description,
        serviceValue: 0,
        additionalCosts: [],
        invoiceEmailSent: '-',
        paymentMethod: 'A DEFINIR',
        sendMethod: 'Portal',
        technicalNotes: '',
        internalNotes: 'Chamado aberto diretamente pelo cliente no Portal. Pendente de análise e atribuição de técnico pela Gerência.',
        evidences: [],
        budgetApprovalStatus: 'PENDENTE',
        origin: 'PORTAL_CLIENTE',
        createdAt: now,
        updatedAt: now,
      };

      const newLog: StatusLog = {
        id: `log-${Date.now()}`,
        serviceOrderId: newOS.id,
        newStatus: 'PENDENTE_ANALISE',
        title: 'Solicitação de Serviço Aberta pelo Cliente',
        description: `${client?.name || 'Cliente'} abriu solicitação para "${params.serviceType}": ${params.description}`,
        authorName: `${params.contactName || client?.contactName || 'Cliente'}`,
        authorRole: 'CLIENT',
        isInternal: false,
        createdAt: now,
      };

      const notif = pushNotification(
        `Nova Solicitação de Cliente (${code})`,
        `${client?.name || 'Cliente'} solicitou "${params.serviceType}" — Pendente de Análise da Gerência.`,
        ['ADMIN'],
        newOS.id
      );

      setState((prev) => ({
        ...prev,
        serviceOrders: [newOS, ...prev.serviceOrders],
        statusLogs: [newLog, ...prev.statusLogs],
        notifications: [notif, ...prev.notifications],
      }));

      return newOS;
    },
    [state.serviceOrders.length, state.clients, pushNotification]
  );

  // Aprovação ou revisão de orçamento pelo Cliente no Portal
  const respondToBudget = useCallback(
    (osId: string, approved: boolean, clientComment?: string) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const os = prev.serviceOrders.find((o) => o.id === osId);
        if (!os) return prev;
        const client = prev.clients.find((c) => c.id === os.clientId);

        const nextStatus: OSStatus = approved
          ? os.assignedTechIds.length > 0
            ? 'AGUARDANDO_EXECUCAO'
            : 'PENDENTE_ANALISE'
          : 'PENDENTE_ANALISE';

        const updatedOS: ServiceOrder = {
          ...os,
          budgetApprovalStatus: approved ? 'APROVADO' : 'REJEITADO',
          status: nextStatus,
          updatedAt: now,
        };

        const newLog: StatusLog = {
          id: `log-${Date.now()}`,
          serviceOrderId: osId,
          previousStatus: os.status,
          newStatus: nextStatus,
          title: approved
            ? 'Orçamento Aprovado pelo Cliente!'
            : 'Cliente Solicitou Revisão do Orçamento',
          description: approved
            ? `O cliente (${client?.contactName || client?.name}) aprovou formalmente o orçamento pelo Portal. ${clientComment ? `Obs: "${clientComment}"` : 'Liberado para execução técnica.'}`
            : `O cliente pediu revisão comercial do orçamento. ${clientComment ? `Motivo: "${clientComment}"` : ''}`,
          authorName: client?.contactName || client?.name || 'Cliente',
          authorRole: 'CLIENT',
          isInternal: false,
          createdAt: now,
        };

        const notif = pushNotification(
          approved ? `Orçamento ${os.code} APROVADO!` : `Revisão solicitada em ${os.code}`,
          `${client?.name} ${approved ? 'aprovou o orçamento e liberou a execução' : 'solicitou revisão de valores'}.`,
          ['ADMIN', 'TECH'],
          osId
        );

        return {
          ...prev,
          serviceOrders: prev.serviceOrders.map((o) => (o.id === osId ? updatedOS : o)),
          statusLogs: [newLog, ...prev.statusLogs],
          notifications: [notif, ...prev.notifications],
        };
      });
    },
    [pushNotification]
  );

  // Avaliação do serviço pelo Cliente após conclusão
  const submitClientFeedback = useCallback(
    (osId: string, rating: number, comment: string) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const os = prev.serviceOrders.find((o) => o.id === osId);
        if (!os) return prev;
        const client = prev.clients.find((c) => c.id === os.clientId);

        const updatedOS: ServiceOrder = {
          ...os,
          feedback: {
            rating,
            comment,
            submittedAt: now,
          },
          updatedAt: now,
        };

        const newLog: StatusLog = {
          id: `log-${Date.now()}`,
          serviceOrderId: osId,
          previousStatus: os.status,
          newStatus: os.status,
          title: `Avaliação do Cliente Registrada (${rating}/5 Estrelas)`,
          description: comment || 'Cliente avaliou positivamente a execução do serviço.',
          authorName: client?.contactName || client?.name || 'Cliente',
          authorRole: 'CLIENT',
          isInternal: false,
          createdAt: now,
        };

        const notif = pushNotification(
          `Nova Avaliação ${rating}★ em ${os.code}`,
          `${client?.name} avaliou o atendimento: "${comment.slice(0, 60)}"`,
          ['ADMIN', 'TECH'],
          osId
        );

        return {
          ...prev,
          serviceOrders: prev.serviceOrders.map((o) => (o.id === osId ? updatedOS : o)),
          statusLogs: [newLog, ...prev.statusLogs],
          notifications: [notif, ...prev.notifications],
        };
      });
    },
    [pushNotification]
  );

  const createClient = useCallback((clientData: Omit<Client, 'id'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      clients: [newClient, ...prev.clients],
    }));
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setState((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const createUser = useCallback((userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
    return newUser;
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }));
  }, []);

  // Importação CSV compatível com as colunas da planilha AGENDA - GESTÃO OPERACIONAL.xlsx
  const importCSVData = useCallback(
    (csvText: string): { importedCount: number; newClientsCount: number } => {
      const lines = csvText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        return { importedCount: 0, newClientsCount: 0 };
      }

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const parseLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += ch;
          }
        }
        result.push(current.trim());
        return result;
      };

      const dataLines = lines.slice(1);
      let importedCount = 0;
      let newClientsCount = 0;

      setState((prev) => {
        const updatedClients = [...prev.clients];
        const newOrders: ServiceOrder[] = [];
        const newTasks: Task[] = [];
        const newLogs: StatusLog[] = [];
        const now = new Date().toISOString();

        dataLines.forEach((line, idx) => {
          const cols = parseLine(line);
          if (cols.length < 4) return;

          // Estrutura da planilha:
          // 0: SEMANA | 1: DATA | 2: HORÁRIO | 3: CLIENTE | 4: ENDEREÇO | 5: DESCRIÇÃO DO SERVIÇO | 6: CONTATO | 7: RESPONSÁVEL | 8: TIPO CLIENTE | 9: TIPO SERVIÇO | 10: Nº RELATÓRIO | 11: VALOR | 12: EMAIL NF
          const weekLabel = cols[0] || 'SEMANA 1';
          const rawDate = cols[1] || '17/10/2026';
          const scheduledTime = cols[2] || '08:00 às 17:00';
          const clientName = cols[3] || 'Cliente Importado';
          const address = (cols[4] || '').replace(/^\*\s*/, '');
          const rawDesc = cols[5] || 'Serviço importado da planilha';
          const contactName = cols[6] || 'Responsável Local';
          const rawTechs = cols[7] || 'HIGOR';
          const clientType = (cols[8]?.toUpperCase() === 'PF' ? 'PF' : 'PJ') as 'PJ' | 'PF';
          const serviceType = cols[9] || 'PREVENTIVA - AR CONDICIONADO';
          const reportNumber = cols[10] || '-';
          const rawValue = (cols[11] || '0')
            .replace(/[R$\s.]/g, '')
            .replace(',', '.');
          const serviceValue = parseFloat(rawValue) || 0;
          const invoiceEmailSent =
            cols[12]?.toLowerCase() === 'sim'
              ? 'Sim'
              : cols[12]?.toLowerCase() === 'não' || cols[12]?.toLowerCase() === 'nao'
                ? 'Não'
                : '-';

          // Converter DD/MM/YYYY para YYYY-MM-DD
          let scheduledDate = '2026-10-18';
          if (rawDate.includes('/')) {
            const dp = rawDate.split('/');
            if (dp.length === 3) {
              const year = dp[2].length === 2 ? `20${dp[2]}` : dp[2];
              scheduledDate = `${year}-${dp[1].padStart(2, '0')}-${dp[0].padStart(2, '0')}`;
            }
          } else if (rawDate.includes('-')) {
            scheduledDate = rawDate;
          }

          // Localizar ou criar Cliente
          let client = updatedClients.find(
            (c) => c.name.toLowerCase() === clientName.toLowerCase()
          );
          if (!client) {
            client = {
              id: `client-imp-${Date.now()}-${idx}`,
              name: clientName,
              type: clientType,
              contactName,
              phone: '(31) 3000-0000',
              email: 'contato@cliente.com.br',
              address: address || 'Belo Horizonte - MG',
              neighborhood: 'Centro',
              city: 'Belo Horizonte',
              contractType: 'AVULSO',
            };
            updatedClients.push(client);
            newClientsCount++;
          }

          // Mapear técnicos pelo nome
          const techParts = rawTechs
            .split(/[\/,]/)
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          const matchedTechIds = prev.users
            .filter(
              (u) =>
                (u.role === 'TECH' || u.role === 'ADMIN') &&
                techParts.some((tp) => u.name.toLowerCase().includes(tp))
            )
            .map((u) => u.id);

          const assignedTechIds =
            matchedTechIds.length > 0 ? matchedTechIds : ['user-higor'];

          const seq = prev.serviceOrders.length + newOrders.length + 540;
          const osId = `os-imp-${Date.now()}-${idx}`;
          const code = `OS-PE260${seq}`;

          const bulletTasks = rawDesc
            .split(/[\|\n\*]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 3);

          const newOS: ServiceOrder = {
            id: osId,
            code,
            proposalNumber: `PE260${seq}`,
            reportNumber,
            clientId: client.id,
            assignedTechIds,
            serviceType,
            priority: serviceType.includes('CORRETIVA') ? 'ALTA' : 'MEDIA',
            status: invoiceEmailSent === 'Sim' ? 'CONCLUIDO' : 'AGUARDANDO_EXECUCAO',
            weekLabel,
            scheduledDate,
            scheduledTime,
            address: address || client.address,
            contactName: contactName || client.contactName,
            description: bulletTasks.join('; ') || rawDesc,
            serviceValue,
            additionalCosts: [],
            invoiceEmailSent,
            paymentMethod: 'BOLETO',
            sendMethod: 'Zap',
            technicalNotes: '',
            internalNotes: 'Registro importado via CSV da planilha AGENDA - PEQUIM.',
            evidences: [],
            budgetApprovalStatus: 'APROVADO',
            origin: 'PLANILHA',
            createdAt: now,
            updatedAt: now,
          };

          newOrders.push(newOS);
          importedCount++;

          bulletTasks.forEach((bTitle, bIdx) => {
            newTasks.push({
              id: `task-imp-${Date.now()}-${idx}-${bIdx}`,
              serviceOrderId: osId,
              title: bTitle,
              category: 'CHECKLIST_OS',
              assignedToId: assignedTechIds[0],
              dueDate: scheduledDate,
              dueTime: scheduledTime,
              priority: newOS.priority,
              completed: newOS.status === 'CONCLUIDO',
            });
          });

          newLogs.push({
            id: `log-imp-${Date.now()}-${idx}`,
            serviceOrderId: osId,
            newStatus: newOS.status,
            title: 'OS Importada da Planilha AGENDA PEQUIM',
            description: `Importação CSV realizada pela Gerência (${serviceType}).`,
            authorName: 'André (Gerência)',
            authorRole: 'ADMIN',
            isInternal: false,
            createdAt: now,
          });
        });

        const notif = pushNotification(
          `Importação CSV Concluída (${importedCount} OS)`,
          `${importedCount} Ordens de Serviço e ${newClientsCount} novos clientes foram importados da planilha.`,
          ['ADMIN', 'TECH'],
          newOrders[0]?.id
        );

        return {
          ...prev,
          clients: updatedClients,
          serviceOrders: [...newOrders, ...prev.serviceOrders],
          tasks: [...newTasks, ...prev.tasks],
          statusLogs: [...newLogs, ...prev.statusLogs],
          notifications: [notif, ...prev.notifications],
        };
      });

      return { importedCount, newClientsCount };
    },
    [pushNotification]
  );

  const markNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const resetToSeedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pequim_onboarding_seen_v1');
    setShowOnboarding(true);
    setShowGuidedBar(true);
    setState({
      users: INITIAL_USERS,
      clients: INITIAL_CLIENTS,
      serviceOrders: INITIAL_SERVICE_ORDERS,
      tasks: INITIAL_TASKS,
      statusLogs: INITIAL_STATUS_LOGS,
      notifications: [
        {
          id: `notif-reset-${Date.now()}`,
          title: 'Base de Dados Restaurada',
          message: 'Dados originais da planilha AGENDA - PEQUIM 2025 recarregados com sucesso.',
          targetRoles: ['ADMIN', 'TECH', 'CLIENT'],
          createdAt: new Date().toISOString(),
          read: false,
        },
      ],
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        activeTechId,
        setActiveTechId,
        activeClientId,
        setActiveClientId,
        users: state.users,
        clients: state.clients,
        serviceOrders: state.serviceOrders,
        tasks: state.tasks,
        statusLogs: state.statusLogs,
        notifications: state.notifications,
        printingOS,
        setPrintingOS,
        showOnboarding,
        setShowOnboarding: handleSetShowOnboarding,
        showGuidedBar,
        setShowGuidedBar,
        createServiceOrder,
        updateServiceOrder,
        deleteServiceOrder,
        changeOSStatus,
        approveAndAssignOS,
        toggleTask,
        createTask,
        deleteTask,
        addTechnicalNote,
        addAdditionalCost,
        removeAdditionalCost,
        addEvidence,
        createClientRequest,
        respondToBudget,
        submitClientFeedback,
        createClient,
        updateClient,
        createUser,
        updateUser,
        importCSVData,
        markNotificationsRead,
        resetToSeedData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return ctx;
}
