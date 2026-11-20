// src/app/dashboard/simuladores/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PainelDeCorrecao() {
  const params = useParams();
  const router = useRouter();
  const simuladorId = params.id as string;

  const [simulador, setSimulador] = useState<any>(null);
  const [turma, setTurma] = useState<any>(null); 
  const [submissoes, setSubmissoes] = useState<any[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notasManuais, setNotasManuais] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!simuladorId) return;
    
    const fetchDados = async () => {
      const docSnap = await getDoc(doc(db, "simuladores", simuladorId));
      if (docSnap.exists()) {
        const simData = docSnap.data();
        setSimulador(simData);
        
        const turmaSnap = await getDoc(doc(db, "turmas", simData.turma_id));
        if (turmaSnap.exists()) setTurma(turmaSnap.data());
      }
    };

    const q = query(collection(db, "submissoes"), where("simulador_id", "==", simuladorId));
    const unsub = onSnapshot(q, (snap) => {
      setSubmissoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    });

    fetchDados();
    return () => unsub();
  }, [simuladorId]);

  const gerarRelatorioTurma = () => {
    const doc = new jsPDF();
    const nomeEscola = turma?.cabecalho_nome || "INSTITUIÇÃO NÃO DEFINIDA";
    const subtituloEscola = turma?.cabecalho_subtitulo || "Avaliação Científica";

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(nomeEscola.toUpperCase(), 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtituloEscola, 14, 26);
    doc.line(14, 30, 196, 30); 

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Relatório de Turma: ${turma?.nome_turma || "Geral"}`, 14, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Simulador: ${simulador.titulo} | Data: ${new Date().toLocaleDateString()}`, 14, 46);

    const headers = [["Matrícula", "Nome do Aluno", "Nota Obj.", "Nota Man.", "Total"]];
    const data = submissoes.map(s => [
      s.aluno_matricula || "N/A", // CORREÇÃO PARA A MATRÍCULA REAL
      s.aluno_nome,
      s.nota_objetiva || 0,
      s.nota_manual || 0,
      ((s.nota_objetiva || 0) + (s.nota_manual || 0)).toFixed(1)
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 52,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Relatorio_${turma?.nome_turma || "Turma"}_${simulador.titulo}.pdf`);
  };

  const gerarBoletimIndividual = (sub: any) => {
    const doc = new jsPDF();
    const nomeEscola = turma?.cabecalho_nome || "INSTITUIÇÃO NÃO DEFINIDA";
    const subtituloEscola = turma?.cabecalho_subtitulo || "Avaliação Científica";
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(nomeEscola.toUpperCase(), 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtituloEscola, 14, 26);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(16);
    doc.text("Boletim de Desempenho Individual", 14, 42);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Aluno(a): ${sub.aluno_nome}`, 14, 52);
    doc.text(`Matrícula: ${sub.aluno_matricula || "N/A"}`, 14, 58);
    doc.text(`Avaliação: ${simulador.titulo}`, 14, 64);
    
    const total = (sub.nota_objetiva || 0) + (sub.nota_manual || 0);
    
    doc.setFillColor(243, 244, 246);
    doc.rect(140, 48, 50, 20, 'F');
    doc.setFontSize(10);
    doc.text("NOTA FINAL", 145, 54);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${total.toFixed(1)}`, 145, 64);

    const questoesData = simulador.questoes.map((q: any, i: number) => {
      const resp = sub.respostas[q.enunciado];
      return [
        i + 1,
        q.tipo === 'multipla_escolha' ? 'Obj' : 'Disc',
        q.enunciado.substring(0, 40) + "...",
        q.tipo === 'multipla_escolha' ? (resp === q.gabarito ? 'Correta' : 'Errada') : 'Avaliada',
        q.valor
      ];
    });

    autoTable(doc, {
      head: [["#", "Tipo", "Questão", "Status", "Valor"]],
      body: questoesData,
      startY: 75,
      headStyles: { fillColor: [31, 41, 55] }
    });

    doc.save(`Boletim_${sub.aluno_nome}.pdf`);
  };

  const salvarCorrecaoManual = async (submissaoId: string) => {
    const totalManual = Object.values(notasManuais).reduce((a, b) => a + b, 0);
    await updateDoc(doc(db, "submissoes", submissaoId), {
      nota_manual: totalManual,
      status_correcao: "corrigido"
    });
    alert("Nota gravada.");
  };

  if (isLoading) return <div className="p-20 text-center">A carregar registos...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-indigo-600">&larr; Voltar</button>
        <div className="flex space-x-3">
          <button onClick={gerarRelatorioTurma} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm">
            📥 Baixar Relatório da Turma (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b font-bold">Inscritos ({submissoes.length})</div>
          <div className="divide-y">
            {submissoes.map((sub) => (
              <div key={sub.id} onClick={() => setAlunoSelecionado(sub)} className={`p-4 cursor-pointer ${alunoSelecionado?.id === sub.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-900">{sub.aluno_nome}</span>
                  <button onClick={(e) => { e.stopPropagation(); gerarBoletimIndividual(sub); }} className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">
                    PDF Aluno
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Nota: {(sub.nota_objetiva || 0) + (sub.nota_manual || 0)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!alunoSelecionado ? (
            <div className="bg-white p-20 rounded-xl border border-dashed text-center text-gray-400">
              Selecione um aluno para corrigir ou gerar o boletim.
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Correção: {alunoSelecionado.aluno_nome}</h2>
              <div className="space-y-6">
                {simulador.questoes.map((q: any, idx: number) => (
                  <div key={idx} className="border-b pb-4">
                    <p className="font-bold text-gray-700">{idx + 1}. {q.enunciado}</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded border italic text-sm text-gray-800">
                      "{alunoSelecionado.respostas[q.enunciado] || "Sem resposta"}"
                    </div>
                    {q.tipo === "discursiva" && (
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase text-indigo-900">Atribuir Nota:</span>
                        <input type="number" max={q.valor} step="0.1" className="w-20 p-1 border rounded focus:ring-2 focus:ring-indigo-500" onChange={(e) => setNotasManuais({...notasManuais, [q.enunciado]: parseFloat(e.target.value)})} />
                        <span className="text-xs text-gray-400">/ {q.valor} pts</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => salvarCorrecaoManual(alunoSelecionado.id)} className="mt-8 w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">
                Salvar Nota Manual e Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}