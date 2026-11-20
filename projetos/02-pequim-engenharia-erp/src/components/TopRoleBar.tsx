import React, { useState } from 'react';
import {
  ShieldCheck,
  Wrench,
  Building2,
  Bell,
  RotateCcw,
  UserCheck,
  Check,
  MapPin,
  Phone,
  Award,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types/schema';
import { formatDateTimeBR } from '../utils/formatters';

export const TopRoleBar: React.FC = () => {
  const {
    activeRole,
    setActiveRole,
    activeTechId,
    setActiveTechId,
    activeClientId,
    setActiveClientId,
    users,
    clients,
    notifications,
    markNotificationsRead,
    resetToSeedData,
    serviceOrders,
    setShowOnboarding,
    showGuidedBar,
    setShowGuidedBar,
  } = useApp();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const techUsers = users.filter((u) => u.role === 'TECH' || u.role === 'ADMIN');
  const relevantNotifs = notifications.filter((n) => n.targetRoles.includes(activeRole));
  const unreadCount = relevantNotifs.filter((n) => !n.read).length;

  const pendingAnalysisCount = serviceOrders.filter(
    (o) => o.status === 'PENDENTE_ANALISE'
  ).length;
  const techQueueCount = serviceOrders.filter(
    (o) =>
      o.assignedTechIds.includes(activeTechId) &&
      (o.status === 'AGUARDANDO_EXECUCAO' ||
        o.status === 'EM_EXECUCAO' ||
        o.status === 'AGUARDANDO_PECA')
  ).length;
  const clientPendingBudgets = serviceOrders.filter(
    (o) => o.clientId === activeClientId && o.status === 'AGUARDANDO_APROVACAO'
  ).length;

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    setShowNotifDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 shadow-sm print:hidden">
      {/* Top Institutional Strip (Pequim Engenharia Official Crimson) */}
      <div className="bg-[#992a23] text-white text-[11px] font-medium py-1.5 px-4 border-b border-[#662215]">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-200" />
              <span>Belo Horizonte e Região Metropolitana</span>
            </span>
            <a
              href="https://wa.me/5531980000000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-amber-200 transition font-semibold"
            >
              <Phone className="w-3.5 h-3.5 text-amber-200" />
              <span>Atendimento & WhatsApp: (31) 98000-0000</span>
            </a>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-red-100">
              <Award className="w-3.5 h-3.5 text-amber-200" />
              <span>Climatização Industrial e Comercial • PMOC • Sistemas VRF</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!showGuidedBar && (
              <button
                onClick={() => setShowGuidedBar(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition"
              >
                <Compass className="w-3 h-3 text-amber-200" />
                <span>Mostrar Passo a Passo</span>
              </button>
            )}
            <button
              onClick={() => setShowOnboarding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-300 hover:bg-amber-200 text-[#662215] text-[11px] font-extrabold shadow-sm transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Como Usar / Tour de Primeiro Acesso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="bg-white text-[#1f1f1f] border-b border-stone-200/90">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Official Logo + Humanized Brand Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="bg-white rounded-xl p-1 border border-stone-200/80 shadow-sm flex items-center justify-center">
              <img
                src="/pequim-engenharia-logo.webp"
                alt="Pequim Engenharia e Serviços"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#3b3b3b]">
                  PEQUIM <span className="text-[#992a23]">ENGENHARIA</span>
                </span>
              </div>
              <p className="text-xs font-medium text-stone-500 hidden sm:block">
                Central de Atendimento ao Cliente, Agenda de Campo & Engenharia
              </p>
            </div>
          </div>

          {/* Center: Natural & Intuitive Environment Switcher */}
          <div className="flex items-center bg-[#f4f1ea] p-1.5 rounded-2xl border border-stone-300/80">
            <button
              onClick={() => handleRoleSwitch('CLIENT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeRole === 'CLIENT'
                  ? 'bg-[#992a23] text-white shadow-sm'
                  : 'text-[#454545] hover:text-[#992a23] hover:bg-white/80'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Área do Cliente</span>
              {clientPendingBudgets > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-stone-950 font-extrabold rounded-full text-[10px]">
                  {clientPendingBudgets} orçamento
                </span>
              )}
            </button>

            <button
              onClick={() => handleRoleSwitch('TECH')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeRole === 'TECH'
                  ? 'bg-[#992a23] text-white shadow-sm'
                  : 'text-[#454545] hover:text-[#992a23] hover:bg-white/80'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Agenda do Técnico</span>
              {techQueueCount > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 font-extrabold rounded-full text-[10px] ${
                    activeRole === 'TECH'
                      ? 'bg-white text-[#992a23]'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {techQueueCount} hoje
                </span>
              )}
            </button>

            <button
              onClick={() => handleRoleSwitch('ADMIN')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeRole === 'ADMIN'
                  ? 'bg-[#992a23] text-white shadow-sm'
                  : 'text-[#454545] hover:text-[#992a23] hover:bg-white/80'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Coordenação & Engenharia</span>
              {pendingAnalysisCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-stone-950 font-extrabold rounded-full text-[10px]">
                  {pendingAnalysisCount} novo(s)
                </span>
              )}
            </button>
          </div>

          {/* Right: Active Person Context + Notifications + Demo Reset */}
          <div className="flex items-center gap-2.5">
            {activeRole === 'TECH' && (
              <div className="flex items-center gap-1.5 bg-[#faf6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-[#992a23]" />
                <span className="text-stone-600 hidden sm:inline font-medium">Profissional:</span>
                <select
                  value={activeTechId}
                  onChange={(e) => setActiveTechId(e.target.value)}
                  className="bg-transparent text-[#662215] font-bold focus:outline-none cursor-pointer"
                >
                  {techUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-white text-stone-900">
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeRole === 'CLIENT' && (
              <div className="flex items-center gap-1.5 bg-[#faf6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-[#992a23]" />
                <span className="text-stone-600 hidden sm:inline font-medium">Sua Empresa:</span>
                <select
                  value={activeClientId}
                  onChange={(e) => setActiveClientId(e.target.value)}
                  className="bg-transparent text-[#662215] font-bold focus:outline-none cursor-pointer max-w-[210px] truncate"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white text-stone-900">
                      {c.name} ({c.contactName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeRole === 'ADMIN' && (
              <div className="hidden lg:flex items-center gap-2 bg-[#faf6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>
                  Coordenação: <strong className="text-[#662215]">Eng. André & Carol</strong>
                </span>
              </div>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown((prev) => !prev);
                  if (!showNotifDropdown && unreadCount > 0) {
                    markNotificationsRead();
                  }
                }}
                className="relative p-2 rounded-xl bg-[#f4f1ea] hover:bg-[#fdf3f2] border border-stone-300 text-[#3b3b3b] hover:text-[#992a23] transition"
                title="Avisos e Atualizações"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#992a23] text-white text-[10px] font-bold flex items-center justify-center shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-stone-800 rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50">
                  <div className="bg-[#faf6f0] px-4 py-3 border-b border-stone-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-[#662215]">
                      Avisos Recentes do Atendimento
                    </span>
                    <button
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-xs text-[#992a23] hover:underline font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Fechar
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {relevantNotifs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-400">
                        Nenhum aviso novo no momento.
                      </div>
                    ) : (
                      relevantNotifs.slice(0, 12).map((n) => (
                        <div key={n.id} className="p-3.5 hover:bg-stone-50 transition">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-xs text-[#992a23]">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {formatDateTimeBR(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Deseja restaurar os dados originais de exemplo da Pequim Engenharia e reabrir o tutorial de boas-vindas?'
                  )
                ) {
                  resetToSeedData();
                }
              }}
              className="p-2 rounded-xl bg-[#f4f1ea] hover:bg-[#fdf3f2] border border-stone-300 text-[#454545] hover:text-[#992a23] transition text-xs font-semibold flex items-center gap-1"
              title="Restaurar dados iniciais e rever o tutorial"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Recomeçar Exemplo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
