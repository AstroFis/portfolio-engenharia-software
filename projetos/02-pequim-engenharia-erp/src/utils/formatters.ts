import { OSStatus, OSPriority, ServiceOrder, Client, User } from '../types/schema';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDateTimeBR(isoStr: string): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateOSTotalValue(os: ServiceOrder): number {
  const extras = (os.additionalCosts || []).reduce((acc, item) => acc + (item.totalValue || 0), 0);
  return (os.serviceValue || 0) + extras;
}

export const STATUS_CONFIG: Record<
  OSStatus,
  {
    label: string;
    shortLabel: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotClass: string;
    stepOrder: number;
  }
> = {
  PENDENTE_ANALISE: {
    label: 'Pendente de Análise',
    shortLabel: 'Pendente',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-300',
    dotClass: 'bg-amber-500',
    stepOrder: 1,
  },
  AGUARDANDO_APROVACAO: {
    label: 'Aguardando Aprovação',
    shortLabel: 'Orçamento',
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-300',
    dotClass: 'bg-yellow-500',
    stepOrder: 2,
  },
  AGUARDANDO_EXECUCAO: {
    label: 'Na Fila / Agendada',
    shortLabel: 'Agendada',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-300',
    dotClass: 'bg-sky-500',
    stepOrder: 3,
  },
  EM_EXECUCAO: {
    label: 'Em Execução',
    shortLabel: 'Em Execução',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-300',
    dotClass: 'bg-blue-600',
    stepOrder: 4,
  },
  AGUARDANDO_PECA: {
    label: 'Aguardando Peça / Aprovação',
    shortLabel: 'Aguard. Peça',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-300',
    dotClass: 'bg-orange-500',
    stepOrder: 4,
  },
  CONCLUIDO: {
    label: 'Concluído',
    shortLabel: 'Concluído',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    dotClass: 'bg-emerald-500',
    stepOrder: 5,
  },
  CANCELADO: {
    label: 'Cancelado / Reprovado',
    shortLabel: 'Cancelado',
    bgClass: 'bg-red-50',
    textClass: 'text-red-800',
    borderClass: 'border-red-300',
    dotClass: 'bg-red-500',
    stepOrder: 0,
  },
};

export const PRIORITY_CONFIG: Record<
  OSPriority,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    weight: number;
  }
> = {
  URGENTE: {
    label: 'Urgente',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    borderClass: 'border-red-300',
    weight: 4,
  },
  ALTA: {
    label: 'Alta',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-300',
    weight: 3,
  },
  MEDIA: {
    label: 'Média',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-300',
    weight: 2,
  },
  BAIXA: {
    label: 'Baixa',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    weight: 1,
  },
};

export function generateSpreadsheetCSV(
  orders: ServiceOrder[],
  clients: Client[],
  users: User[]
): string {
  const headers = [
    'SEMANA',
    'DATA',
    'HORÁRIO',
    'CLIENTE',
    'ENDEREÇO',
    'DESCRIÇÃO DO SERVIÇO',
    'CONTATO',
    'RESPONSÁVEL PELO SERVIÇO',
    'TIPOS DE CLIENTES',
    'TIPOS DE SERVIÇOS',
    'Nº RELATÓRIO',
    'VALOR DO SERVIÇO',
    'EMAIL ENVIADO PARA EMITIR N.F',
    'STATUS SISTEMA',
    'CÓDIGO OS',
  ];

  const rows = orders.map((os) => {
    const client = clients.find((c) => c.id === os.clientId);
    const techNames = os.assignedTechIds
      .map((tid) => users.find((u) => u.id === tid)?.name.toUpperCase())
      .filter(Boolean)
      .join(' / ');

    const total = calculateOSTotalValue(os);
    const cols = [
      os.weekLabel || 'SEMANA 1',
      formatDateBR(os.scheduledDate),
      os.scheduledTime || '-',
      client?.name || 'Cliente',
      os.address || client?.address || '-',
      os.description.replace(/\r?\n/g, ' | '),
      os.contactName || client?.contactName || '-',
      techNames || 'A DEFINIR',
      client?.type || 'PJ',
      os.serviceType,
      os.reportNumber || '-',
      total.toFixed(2).replace('.', ','),
      os.invoiceEmailSent || '-',
      STATUS_CONFIG[os.status]?.label || os.status,
      os.code,
    ];

    return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';');
  });

  return '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
}

export function getSampleCSVTemplate(): string {
  const headers = [
    'SEMANA',
    'DATA',
    'HORÁRIO',
    'CLIENTE',
    'ENDEREÇO',
    'DESCRIÇÃO DO SERVIÇO',
    'CONTATO',
    'RESPONSÁVEL PELO SERVIÇO',
    'TIPOS DE CLIENTES',
    'TIPOS DE SERVIÇOS',
    'Nº RELATÓRIO',
    'VALOR DO SERVIÇO',
    'EMAIL ENVIADO PARA EMITIR N.F',
  ];
  const sampleRows = [
    [
      'SEMANA 2',
      '20/10/2026',
      '08:00 às 17:00',
      'Supermercado BH - Pedro II',
      'Av. Dom Pedro II, 2400 - Carlos Prates, BH',
      '* Manutenção preventiva em 4 climatizadores evaporativos | * Limpeza de colmeias e bombas',
      'Carlos Eduardo',
      'WARLESON / ALEXANDRE',
      'PJ',
      'PREVENTIVA - CLIMATIZADOR',
      'REL-2026-041',
      '2400,00',
      'Não',
    ],
    [
      'SEMANA 2',
      '21/10/2026',
      '09:00 às 12:00',
      'Condomínio The Falls',
      'Rua da Paisagem, 480 - Vila da Serra, Nova Lima',
      '* Instalação de Split Parede 24.000 BTUs no salão gourmet | * Pressurização e vácuo da linha',
      'Síndica Fernanda',
      'HIGOR / CLAUDIMAR',
      'PJ',
      'INSTALAÇÃO - AR CONDICIONADO',
      '-',
      '1850,00',
      'Não',
    ],
  ];

  return (
    '\uFEFF' +
    [
      headers.join(';'),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(';')),
    ].join('\r\n')
  );
}
