import React, { useState } from 'react';
import {
  Building2,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Phone,
  Users,
  MapPin,
  X,
  Compass,
  PlayCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types/schema';

export const OnboardingTourModal: React.FC = () => {
  const {
    showOnboarding,
    setShowOnboarding,
    activeRole,
    setActiveRole,
    serviceOrders,
    setPrintingOS,
    showGuidedBar,
    setShowGuidedBar,
  } = useApp();

  const [step, setStep] = useState<number>(0);

  if (!showOnboarding) return null;

  const handleStartWithRole = (role: UserRole) => {
    setActiveRole(role);
    setShowGuidedBar(true);
    setShowOnboarding(false);
  };

  const steps = [
    {
      badge: 'Boas-vindas • Primeiro Acesso',
      title: 'Bem-vindo à Central de Atendimento da Pequim Engenharia',
      subtitle:
        'Criamos este ambiente para aproximar nossos clientes, nossa equipe de campo e nossa engenharia — sem burocracia e com transparência total.',
      highlightBox: {
        title: 'Por que criamos este portal?',
        text: 'Sabemos que gerenciar climatização, PMOC e manutenções urgentes exige resposta rápida. Aqui você sabe exatamente quem vai atender sua empresa, qual o horário previsto, o que foi feito em cada equipamento e quanto custa antes do serviço começar.',
      },
      cards: [
        {
          icon: Building2,
          role: 'CLIENT' as UserRole,
          tag: 'Para Clientes e Gestores Prediais',
          title: 'Área do Cliente',
          desc: 'Abra chamados em 30 segundos, aprove orçamentos com 1 clique, veja qual técnico vai até você e baixe seus relatórios em PDF.',
          cta: 'Entrar como Cliente',
        },
        {
          icon: Wrench,
          role: 'TECH' as UserRole,
          tag: 'Para Higor, Warleson e Equipe',
          title: 'Agenda do Técnico em Campo',
          desc: 'Feito para usar no celular: consulte o endereço no GPS, marque os itens verificados na manutenção e anexe fotos do serviço.',
          cta: 'Ver Agenda do Técnico',
        },
        {
          icon: ShieldCheck,
          role: 'ADMIN' as UserRole,
          tag: 'Para Eng. André e Carol',
          title: 'Coordenação & Engenharia',
          desc: 'Receba pedidos de clientes na hora, escale a equipe, calcule instalações pela tabela oficial e exporte para o Excel.',
          cta: 'Abrir Coordenação',
        },
      ],
    },
    {
      badge: 'Passo 1 de 3 • Área do Cliente',
      title: 'Para o Cliente: Clareza, Previsibilidade e Contato Humano',
      subtitle:
        'Pensado para síndicos, gerentes de operações e clientes que precisam de atendimento rápido e documentação em dia.',
      highlightBox: {
        title: 'Dica prática para testar agora:',
        text: 'Na Área do Cliente, você pode alternar entre empresas reais atendidas pela Pequim (como SATEL Safar ou Nona Empreendimentos), aprovar um orçamento pendente ou abrir um chamado urgente.',
      },
      features: [
        {
          num: '01',
          title: 'Saiba quem vai até sua empresa',
          desc: 'Cada Ordem de Serviço mostra os profissionais escalados (ex: Higor e Claudimar), data e janela de chegada.',
        },
        {
          num: '02',
          title: 'Aprovação de orçamento sem troca de e-mails demorada',
          desc: 'Quando há orçamento pendente, o cliente vê o escopo detalhado e aprova com um clique, liberando a equipe imediatamente.',
        },
        {
          num: '03',
          title: 'Linha do tempo limpa e Relatório PDF assinado',
          desc: 'Acompanhe cada etapa com linguagem clara e gere o documento oficial da OS com logomarca para o seu financeiro ou auditoria PMOC.',
        },
      ],
      targetRole: 'CLIENT' as UserRole,
      targetLabel: 'Experimentar a Área do Cliente agora',
    },
    {
      badge: 'Passo 2 de 3 • Equipe Técnica em Campo',
      title: 'Para o Técnico: Direto ao Ponto no Celular ou Tablet',
      subtitle:
        'Sem telas complicadas. O profissional vê sua lista do dia ordenada pelo que é mais urgente.',
      highlightBox: {
        title: 'Separação inteligente de informações:',
        text: 'O técnico pode registrar o Parecer Técnico (que sai no relatório do cliente) ou marcar "Observação Interna da Equipe" (com cadeado, visível apenas para o Eng. André e a Carol).',
      },
      features: [
        {
          num: '01',
          title: 'Botões rápidos de chegada e conclusão',
          desc: 'Com um toque, o técnico avisa que chegou no local ("Em Execução"), que precisa de uma peça ou que concluiu o serviço.',
        },
        {
          num: '02',
          title: 'Checklist passo a passo e fotos de campo',
          desc: 'Ao marcar cada etapa concluída (limpeza de filtros, teste de dreno, medição de pressão), a barra de progresso atualiza na hora.',
        },
        {
          num: '03',
          title: 'Atalho para GPS e WhatsApp do contato local',
          desc: 'Links diretos para abrir o endereço no Google Maps e falar com o responsável que vai receber a equipe no cliente.',
        },
      ],
      targetRole: 'TECH' as UserRole,
      targetLabel: 'Ver o Painel do Técnico em Campo',
    },
    {
      badge: 'Passo 3 de 3 • Coordenação & Engenharia',
      title: 'Para a Gerência: Controle da Agenda, Orçamentos e Financeiro',
      subtitle:
        'Substitui o retrabalho da planilha mantendo 100% de compatibilidade com o modelo AGENDA - PEQUIM.',
      highlightBox: {
        title: 'Fluxo integrado de ponta a ponta:',
        text: 'Quando um cliente abre uma solicitação no Portal, ela aparece no topo da Coordenação com destaque âmbar para o Eng. André aprovar, definir o valor e escalar o técnico.',
      },
      features: [
        {
          num: '01',
          title: 'Triagem rápida de novos chamados',
          desc: 'Converta pedidos de clientes em Ordens de Serviço agendadas em poucos segundos, já com lista de tarefas para o técnico.',
        },
        {
          num: '02',
          title: 'Calculadora de Instalação Pequim integrada',
          desc: 'Adicione Splits, Cassetes, metros de tubulação de cobre, carga de gás e planos PMOC com os valores oficiais da empresa.',
        },
        {
          num: '03',
          title: 'Importação e Exportação Excel (CSV)',
          desc: 'Exporte toda a operação para planilha a qualquer momento ou importe linhas prontas da planilha Agenda Pequim.',
        },
      ],
      targetRole: 'ADMIN' as UserRole,
      targetLabel: 'Acessar a Coordenação & Engenharia',
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto print:hidden">
      <div className="bg-[#faf8f5] w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-auto">
        {/* Top Warm Brand Header */}
        <div className="relative bg-gradient-to-r from-[#662215] via-[#80241b] to-[#992a23] text-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-2xl p-2 shadow-md shrink-0">
                <img
                  src="/pequim-engenharia-logo.webp"
                  alt="Pequim Engenharia"
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-300/20 text-amber-200 border border-amber-200/30 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {current.badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
                  {current.title}
                </h2>
              </div>
            </div>

            <button
              onClick={() => setShowOnboarding(false)}
              className="p-2 rounded-xl bg-black/20 hover:bg-black/35 text-white/90 transition shrink-0"
              title="Fechar tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-stone-100/95 mt-3 max-w-3xl leading-relaxed">
            {current.subtitle}
          </p>

          {/* Step Dots Indicator */}
          <div className="flex items-center gap-2 mt-5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === step
                    ? 'w-10 bg-amber-300'
                    : 'w-2.5 bg-white/35 hover:bg-white/60'
                }`}
                title={`Ir para etapa ${idx + 1}`}
              />
            ))}
            <span className="text-[11px] text-amber-100/90 font-semibold ml-2">
              Etapa {step + 1} de {steps.length}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Human Context Highlight Box */}
          <div className="bg-[#f3ece6] border-l-4 border-[#992a23] rounded-r-2xl p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#992a23] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#662215]">
                {current.highlightBox.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 mt-1 leading-relaxed">
                {current.highlightBox.text}
              </p>
            </div>
          </div>

          {/* Step 0: 3 Persona Cards */}
          {step === 0 && current.cards && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {current.cards.map((card) => {
                const Icon = card.icon;
                const isCurrentRole = activeRole === card.role;
                return (
                  <div
                    key={card.role}
                    onClick={() => handleStartWithRole(card.role)}
                    className={`group rounded-2xl p-5 border-2 transition cursor-pointer flex flex-col justify-between gap-4 ${
                      isCurrentRole
                        ? 'bg-white border-[#992a23] shadow-md'
                        : 'bg-white border-stone-200/90 hover:border-[#992a23] hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-[#fdf3f2] text-[#992a23] flex items-center justify-center group-hover:bg-[#992a23] group-hover:text-white transition">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                          {card.tag}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-[#3b3b3b]">
                        {card.title}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2.5 px-3 rounded-xl bg-stone-100 group-hover:bg-[#992a23] text-[#3b3b3b] group-hover:text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>{card.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Steps 1, 2, 3: Numbered Human Features */}
          {step > 0 && current.features && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {current.features.map((feat) => (
                  <div
                    key={feat.num}
                    className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm space-y-2"
                  >
                    <span className="inline-block text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#fdf3f2] text-[#992a23]">
                      Passo {feat.num}
                    </span>
                    <h4 className="text-sm font-extrabold text-[#3b3b3b]">
                      {feat.title}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                ))}
              </div>

              {current.targetRole && (
                <div className="pt-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleStartWithRole(current.targetRole!)}
                    className="px-6 py-3 rounded-2xl bg-[#992a23] hover:bg-[#662215] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md transition"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{current.targetLabel}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <Phone className="w-4 h-4 text-[#992a23]" />
              <span>
                Suporte Direto Pequim Engenharia: <strong>(31) 98000-0000</strong> • Belo Horizonte e Região
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Anterior
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOnboarding(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold transition"
                >
                  Pular Introdução
                </button>
              )}

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="px-5 py-2.5 rounded-xl bg-[#992a23] hover:bg-[#662215] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                >
                  <span>Próximo Passo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOnboarding(false)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir e Usar o Sistema</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GuidedJourneyBar: React.FC = () => {
  const {
    activeRole,
    setActiveRole,
    showGuidedBar,
    setShowGuidedBar,
    setShowOnboarding,
    serviceOrders,
    setPrintingOS,
  } = useApp();

  if (!showGuidedBar) return null;

  const pendingCount = serviceOrders.filter(
    (o) => o.status === 'PENDENTE_ANALISE'
  ).length;
  const budgetCount = serviceOrders.filter(
    (o) => o.status === 'AGUARDANDO_APROVACAO'
  ).length;

  return (
    <div className="bg-[#f5efe8] border-b border-[#e5d8cb] px-4 py-2.5 print:hidden">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#992a23] text-white text-[11px] font-extrabold shrink-0">
            <HelpCircle className="w-3.5 h-3.5" />
            Roteiro Interativo
          </span>
          <p className="text-xs text-stone-700 font-medium">
            Clique em qualquer etapa abaixo para experimentar o fluxo completo de atendimento da <strong>Pequim Engenharia</strong>:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveRole('CLIENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              activeRole === 'CLIENT'
                ? 'bg-white border-[#992a23] text-[#992a23] shadow-sm'
                : 'bg-white/70 border-stone-300 text-stone-700 hover:bg-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#fdf3f2] text-[#992a23] font-extrabold text-[11px] flex items-center justify-center">
              1
            </span>
            <span>Cliente solicita ou aprova</span>
            {budgetCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[10px] font-extrabold">
                {budgetCount}
              </span>
            )}
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />

          <button
            onClick={() => setActiveRole('ADMIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              activeRole === 'ADMIN'
                ? 'bg-white border-[#992a23] text-[#992a23] shadow-sm'
                : 'bg-white/70 border-stone-300 text-stone-700 hover:bg-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#fdf3f2] text-[#992a23] font-extrabold text-[11px] flex items-center justify-center">
              2
            </span>
            <span>Engenharia analisa e escala equipe</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[10px] font-extrabold">
                {pendingCount}
              </span>
            )}
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />

          <button
            onClick={() => setActiveRole('TECH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              activeRole === 'TECH'
                ? 'bg-white border-[#992a23] text-[#992a23] shadow-sm'
                : 'bg-white/70 border-stone-300 text-stone-700 hover:bg-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#fdf3f2] text-[#992a23] font-extrabold text-[11px] flex items-center justify-center">
              3
            </span>
            <span>Técnico executa no local</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />

          <button
            onClick={() => {
              const target =
                serviceOrders.find((o) => o.status === 'CONCLUIDO') ||
                serviceOrders[0];
              if (target) setPrintingOS(target);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border bg-white/70 border-stone-300 text-stone-700 hover:bg-white hover:border-[#992a23] transition"
          >
            <FileText className="w-3.5 h-3.5 text-[#992a23]" />
            <span>4. Ver Laudo / OS em PDF</span>
          </button>

          <div className="h-4 w-px bg-stone-300 mx-1 hidden sm:block" />

          <button
            onClick={() => setShowOnboarding(true)}
            className="text-xs font-extrabold text-[#992a23] hover:underline px-1.5"
          >
            Abrir Tutorial
          </button>

          <button
            onClick={() => setShowGuidedBar(false)}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
            title="Ocultar barra de roteiro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
