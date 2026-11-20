// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

  const rotas = [
    { nome: "Visão Geral", path: "/dashboard" },
    { nome: "Minhas Turmas", path: "/dashboard/turmas" },
    { nome: "Simuladores", path: "/dashboard/simuladores" },
    { nome: "Olimpíadas Científicas", path: "/dashboard/olimpiadas" },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] text-white flex flex-col fixed h-full z-50">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-black tracking-wider text-white">SIMULADOR CNSD</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {rotas.map((rota) => {
          // A CORREÇÃO: O Visão Geral só acende se a rota for EXATAMENTE "/dashboard"
          const isActive = 
            rota.path === "/dashboard" 
              ? pathname === "/dashboard" 
              : pathname === rota.path || pathname?.startsWith(rota.path + "/");

          return (
            <Link 
              key={rota.path} 
              href={rota.path} 
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              {rota.nome}
            </Link>
          );
        })}
      </nav>

      {onLogout && (
        <div className="p-4 border-t border-gray-800 mb-4">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-all"
          >
            Sair do Cofre
          </button>
        </div>
      )}
    </aside>
  );
}