export type UserRole = 'ADMIN' | 'TECH' | 'CLIENT';

export type ClientType = 'PJ' | 'PF';

export type OSPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type OSStatus =
  | 'PENDENTE_ANALISE'      // Solicitação do cliente ou orçamento em análise
  | 'AGUARDANDO_APROVACAO'  // Orçamento enviado aguardando aprovação do cliente
  | 'AGUARDANDO_EXECUCAO'   // Aprovada e agendada na fila do técnico
  | 'EM_EXECUCAO'           // Em atendimento no local pelo técnico
  | 'AGUARDANDO_PECA'       // Pausada aguardando peça/material ou aprovação adicional
  | 'CONCLUIDO'             // Executado / Finalizado
  | 'CANCELADO';            // Reprovado / Cancelado

export type TaskCategory =
  | 'CHECKLIST_OS'
  | 'COMPRAS_MATERIAIS'
  | 'ORCAMENTO_VISITA'
  | 'ADMINISTRATIVO';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  jobTitle: string;
  phone: string;
  email: string;
  avatarInitials: string;
  clientId?: string; // Vinculado quando role === 'CLIENT'
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  type: ClientType; // 'PJ' | 'PF' (Coluna I da Agenda / Aba Tabelas)
  contactName: string; // Coluna G da Agenda
  phone: string;
  email: string;
  address: string; // Coluna E da Agenda
  neighborhood: string;
  city: string; // Coluna G da aba Orçamentos
  contractType: 'AVULSO' | 'PMOC_MENSAL' | 'PMOC_TRIMESTRAL' | 'PMOC_SEMESTRAL';
  notes?: string;
}

export interface AdditionalCostItem {
  id: string;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  addedBy: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: 'PHOTO' | 'DOCUMENT' | 'LINK';
  url: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ClientFeedback {
  rating: number; // 1 a 5 estrelas
  comment: string;
  submittedAt: string;
}

export interface ServiceOrder {
  id: string;
  code: string; // Ex: OS-PE2602532
  proposalNumber: string; // Coluna C da aba Orçamentos (ex: PE2602532)
  reportNumber: string; // Coluna K da aba Agenda (Nº RELATÓRIO)
  clientId: string; // FK -> Clients.id
  assignedTechIds: string[]; // FK -> Users.id[] (Coluna H: RESPONSÁVEL PELO SERVIÇO)
  serviceType: string; // Coluna J: TIPOS DE SERVIÇOS (Aba Tabelas)
  priority: OSPriority;
  status: OSStatus;
  weekLabel: string; // Coluna A: SEMANA 1, SEMANA 2...
  scheduledDate: string; // YYYY-MM-DD (Coluna B: DATA)
  scheduledTime: string; // Coluna C: HORÁRIO (ex: "07:00 às 17:00")
  address: string; // Coluna E: ENDEREÇO
  contactName: string; // Coluna G: CONTATO
  description: string; // Coluna F: DESCRIÇÃO DO SERVIÇO
  serviceValue: number; // Coluna L: VALOR DO SERVIÇO
  additionalCosts: AdditionalCostItem[];
  invoiceEmailSent: 'Sim' | 'Não' | '-'; // Coluna M: EMAIL ENVIADO PARA EMITIR N.F
  paymentMethod: 'BOLETO' | 'TRANSFERÊNCIA' | 'DEPÓSITO' | 'PIX' | 'A DEFINIR';
  sendMethod: 'Zap' | 'E-mail' | 'Portal' | 'Pessoalmente';
  technicalNotes: string; // Visível no relatório e para o cliente
  internalNotes: string; // Visível APENAS para Gerência e Técnico (oculto para Cliente)
  evidences: EvidenceItem[];
  budgetApprovalStatus: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'NAO_APLICAVEL';
  feedback?: ClientFeedback;
  origin: 'PLANILHA' | 'PORTAL_CLIENTE' | 'GERENCIA';
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  serviceOrderId: string | null; // FK -> ServiceOrders.id (null se for tarefa interna avulsa da agenda)
  title: string;
  category: TaskCategory;
  assignedToId: string; // FK -> Users.id
  supplierOrLocation?: string; // Ex: Distribuidora Frigorífica Central, Loja Elétrica, Distribuidora Térmica Nacional
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  priority: OSPriority;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface StatusLog {
  id: string;
  serviceOrderId: string; // FK -> ServiceOrders.id
  previousStatus?: OSStatus;
  newStatus: OSStatus;
  title: string;
  description: string;
  authorName: string;
  authorRole: UserRole;
  isInternal: boolean; // Se true, não é exibido na Linha do Tempo do Portal do Cliente
  createdAt: string;
}

export interface CatalogPricingItem {
  id: string;
  category: 'EQUIPAMENTO_INSTALACAO' | 'MATERIAL_ADICIONAL' | 'CONTRATO_PMOC';
  name: string;
  unit: string;
  unitPrice: number;
}

export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  targetRoles: UserRole[];
  serviceOrderId?: string;
  createdAt: string;
  read: boolean;
}
