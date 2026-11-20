// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardOverview() {
  const [estatisticas, setEstatisticas] = useState({
    totalAlunos: 0,
    totalSimuladores: 0,
    totalOlimpiadas: 0,
    totalSubmissoes: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [alunosSnap, simuladoresSnap, olimpiadasSnap] = await Promise.all([
          getDocs(collection(db, "alunos")),
          getDocs(collection(db, "simuladores")),
          getDocs(collection(db, "olimpiadas")),
          // getDocs(collection(db, "submissoes")) // OCULTADO TEMPORARIAMENTE
        ]);

        setEstatisticas({
          totalAlunos: alunosSnap.size,
          totalSimuladores: simuladoresSnap.size,
          totalOlimpiadas: olimpiadasSnap.size,
          totalSubmissoes: 0 // OCULTADO TEMPORARIAMENTE
        });
      } catch (error) {
        console.error("Erro ao carregar o cérebro analítico:", error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">A sincronizar métricas...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Visão Geral</h1>
        <p className="text-gray-500 mt-1 font-medium">O seu centro de comando operacional e pedagógico.</p>
      </div>

      {/* GRELHA AJUSTADA PARA 3 COLUNAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Alunos */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total de Alunos</h3>
            <span className="text-2xl">👨‍🎓</span>
          </div>
          <p className="text-5xl font-black text-gray-900">{estatisticas.totalAlunos}</p>
        </div>

        {/* Card 2: Simuladores */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Provas Forjadas</h3>
            <span className="text-2xl">📄</span>
          </div>
          <p className="text-5xl font-black text-indigo-600">{estatisticas.totalSimuladores}</p>
        </div>

        {/* Card 3: Olimpíadas */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Eventos Ativos</h3>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-5xl font-black text-amber-500">{estatisticas.totalOlimpiadas}</p>
        </div>

        {/* CARD DE SUBMISSÕES OCULTADO 
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest">Provas Entregues</h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-5xl font-black text-green-500">{estatisticas.totalSubmissoes}</p>
        </div>
        */}
      </div>

      <div className="mt-12 bg-gradient-to-br from-indigo-900 to-gray-900 p-10 rounded-3xl shadow-xl text-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white mb-3">Sistema Operacional Pronto</h2>
          <p className="text-indigo-200 max-w-2xl mx-auto font-medium leading-relaxed">
            A arquitetura logística das suas instituições está 100% estabilizada. Utilize os menus laterais para gerir as suas turmas, criar novos exames e acompanhar o desempenho da sua delegação nas competições científicas.
          </p>
        </div>
      </div>
    </div>
  );
}