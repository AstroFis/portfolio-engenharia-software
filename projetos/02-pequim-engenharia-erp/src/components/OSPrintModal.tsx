import React from 'react';
import { Printer, X, CheckCircle2, Square, Building2, Calendar, Clock, Phone, MapPin, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency,
  formatDateBR,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  calculateOSTotalValue,
} from '../utils/formatters';

export const OSPrintModal: React.FC = () => {
  const { printingOS, setPrintingOS, clients, users, tasks } = useApp();

  if (!printingOS) return null;

  const client = clients.find((c) => c.id === printingOS.clientId);
  const assignedTechs = printingOS.assignedTechIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);
  const osTasks = tasks.filter((t) => t.serviceOrderId === printingOS.id);
  const totalValue = calculateOSTotalValue(printingOS);
  const additionalTotal = printingOS.additionalCosts.reduce((s, c) => s + c.totalValue, 0);
  const statusInfo = STATUS_CONFIG[printingOS.status];
  const priorityInfo = PRIORITY_CONFIG[printingOS.priority];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/75 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 print:my-0 print:shadow-none print:border-none print:rounded-none print:max-w-none">
        {/* Top Action Bar (Hidden on print) */}
        <div className="bg-[#992a23] text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-bold text-sm">
                Visualização de Documento Comercial — {printingOS.code}
              </h3>
              <p className="text-xs text-red-100">
                Layout oficial Pequim Engenharia otimizado para impressão A4 ou salvamento em PDF
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white text-[#992a23] hover:bg-stone-100 px-4 py-2 rounded-lg text-sm font-extrabold transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar em PDF
            </button>
            <button
              onClick={() => setPrintingOS(null)}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-8 md:p-10 space-y-6 text-[#1f1f1f] print:p-6">
          {/* Commercial Header with Official Logo */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#992a23] pb-6 gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/pequim-engenharia-logo.webp"
                alt="Pequim Engenharia e Serviços"
                className="h-20 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="text-xl font-extrabold text-[#3b3b3b] tracking-tight">
                  PEQUIM <span className="text-[#992a23]">ENGENHARIA E SERVIÇOS LTDA</span>
                </h1>
                <p className="text-xs text-[#454545] font-semibold">
                  Projetos de Climatização • Sistemas VRF/VRV • PMOC • Manutenção Preventiva e Corretiva • Energia Solar
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Belo Horizonte MG e Região • WhatsApp: (31) 98000-0000 • contato@pequimengenharia-demo.com.br
                </p>
                <p className="text-[11px] text-[#992a23] font-semibold">
                  https://pequimengenharia.demo.app/
                </p>
              </div>
            </div>

            <div className="text-left md:text-right bg-[#fdf3f2] border border-[#992a23]/25 rounded-xl px-4 py-3 min-w-[235px]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#662215]">
                Ordem de Serviço / Proposta
              </div>
              <div className="text-xl font-extrabold text-[#992a23]">{printingOS.code}</div>
              <div className="flex items-center md:justify-end gap-2 mt-1 text-xs text-[#454545]">
                <span>Proposta: <strong>{printingOS.proposalNumber || '-'}</strong></span>
                <span>•</span>
                <span>Relatório: <strong>{printingOS.reportNumber || '-'}</strong></span>
              </div>
              <div className="mt-1.5 flex items-center md:justify-end gap-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${statusInfo.bgClass} ${statusInfo.textClass} ${statusInfo.borderClass}`}
                >
                  {statusInfo.label}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${priorityInfo.bgClass} ${priorityInfo.textClass} ${priorityInfo.borderClass}`}
                >
                  Prioridade {priorityInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Client & Execution Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/70">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23] mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#992a23]" />
                Dados do Cliente / Tomador
              </h2>
              <div className="space-y-1.5 text-sm">
                <p>
                  <span className="text-stone-500">Cliente / Razão Social:</span>{' '}
                  <strong className="text-stone-900">{client?.name || 'Cliente'}</strong>{' '}
                  <span className="text-xs font-bold px-1.5 py-0.5 bg-stone-200 rounded text-stone-700 ml-1">
                    {client?.type || 'PJ'}
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-[#992a23] shrink-0 mt-0.5" />
                  <span>
                    {printingOS.address || client?.address} — {client?.city || 'Belo Horizonte'}
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#992a23] shrink-0" />
                  <span>
                    Contato Local: <strong>{printingOS.contactName || client?.contactName}</strong>{' '}
                    ({client?.phone || '-'})
                  </span>
                </p>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/70">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23] mb-2.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#992a23]" />
                Programação Técnica & Responsáveis
              </h2>
              <div className="space-y-1.5 text-sm">
                <p>
                  <span className="text-stone-500">Modalidade / Tipo:</span>{' '}
                  <strong className="text-[#992a23]">{printingOS.serviceType}</strong>
                </p>
                <p className="flex items-center gap-3">
                  <span>
                    <span className="text-stone-500">Data Programada:</span>{' '}
                    <strong>{formatDateBR(printingOS.scheduledDate)}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <strong>{printingOS.scheduledTime}</strong>
                  </span>
                </p>
                <p>
                  <span className="text-stone-500">Equipe Técnica Designada:</span>{' '}
                  <strong>
                    {assignedTechs.length > 0
                      ? assignedTechs.map((t) => t?.name).join(' / ')
                      : 'A Definir pela Gerência'}
                  </strong>
                </p>
                <p className="text-xs text-stone-500">
                  Forma de Pagamento: <strong>{printingOS.paymentMethod}</strong> • N.F Emitida:{' '}
                  <strong>{printingOS.invoiceEmailSent}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Scope of Service */}
          <div className="border border-stone-200 rounded-xl p-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23] mb-2">
              Escopo Detalhado do Serviço
            </h2>
            <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">
              {printingOS.description}
            </p>
          </div>

          {/* Technical Checklist */}
          {osTasks.length > 0 && (
            <div className="border border-stone-200 rounded-xl p-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23] mb-3">
                Checklist de Atividades e Procedimentos ({osTasks.filter((t) => t.completed).length}/{osTasks.length} concluídos)
              </h2>
              <div className="divide-y divide-stone-100">
                {osTasks.map((t) => (
                  <div key={t.id} className="py-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 shrink-0" />
                      )}
                      <span className={t.completed ? 'text-stone-800 font-medium' : 'text-stone-600'}>
                        {t.title}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500">
                      {t.completed ? `Concluído (${t.completedBy || 'Técnico'})` : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Notes (Public only) */}
          {printingOS.technicalNotes && (
            <div className="border border-[#992a23]/25 rounded-xl p-4 bg-[#fdf3f2]/50">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23] mb-2">
                Parecer / Apontamentos Técnicos de Execução
              </h2>
              <p className="text-sm text-stone-700 whitespace-pre-line">
                {printingOS.technicalNotes}
              </p>
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-[#fdf3f2] px-4 py-2.5 border-b border-[#992a23]/20 flex justify-between items-center">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#992a23]">
                Demonstrativo Financeiro da Ordem de Serviço
              </h2>
              <span className="text-xs font-bold text-[#662215]">
                Status do Orçamento: {printingOS.budgetApprovalStatus}
              </span>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">
                  Valor Base do Serviço ({printingOS.serviceType})
                </span>
                <span className="font-semibold text-stone-900">
                  {formatCurrency(printingOS.serviceValue)}
                </span>
              </div>

              {printingOS.additionalCosts.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-1 border-b border-stone-100 text-stone-700"
                >
                  <span>
                    Material / Adicional: {item.description} ({item.quantity}x{' '}
                    {formatCurrency(item.unitValue)})
                  </span>
                  <span className="font-medium">{formatCurrency(item.totalValue)}</span>
                </div>
              ))}

              {additionalTotal > 0 && (
                <div className="flex justify-between py-1 text-xs text-stone-500">
                  <span>Subtotal de Materiais e Adicionais</span>
                  <span>{formatCurrency(additionalTotal)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-[#992a23]/30 text-base font-extrabold text-[#992a23]">
                <span>VALOR TOTAL DA ORDEM DE SERVIÇO</span>
                <span className="text-lg">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs text-stone-600">
            <div className="border-t border-stone-400 pt-2">
              <p className="font-bold text-stone-800">PEQUIM ENGENHARIA E SERVIÇOS LTDA</p>
              <p>Responsável Técnico / Executor</p>
            </div>
            <div className="border-t border-stone-400 pt-2">
              <p className="font-bold text-stone-800">{client?.name || 'Cliente'}</p>
              <p>Aceite do Cliente ({printingOS.contactName || client?.contactName})</p>
            </div>
          </div>

          <div className="text-center text-[11px] text-stone-400 pt-2 border-t border-stone-100">
            Documento emitido eletronicamente pelo Sistema Integrado Pequim Engenharia e Serviços em{' '}
            {new Date().toLocaleString('pt-BR')}.
          </div>
        </div>
      </div>
    </div>
  );
};
