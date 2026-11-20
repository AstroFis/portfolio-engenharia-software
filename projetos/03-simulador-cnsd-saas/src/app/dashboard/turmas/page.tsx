// src/app/dashboard/turmas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Turma { id: string; nome_turma: string; instituicao: string; cabecalho_nome: string; cabecalho_subtitulo: string; }
interface Aluno { id: string; nome_completo: string; matricula: string; turma_id: string; data_nascimento?: string; }

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunosGlobais, setAlunosGlobais] = useState<Aluno[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [nomeTurma, setNomeTurma] = useState("");
  const [instituicao, setInstituicao] = useState("CNSD");
  const [cabecalhoNome, setCabecalhoNome] = useState("");
  const [cabecalhoSubtitulo, setCabecalhoSubtitulo] = useState("");

  const [turmaGerenciadaId, setTurmaGerenciadaId] = useState<string | null>(null);
  const [isAddingAluno, setIsAddingAluno] = useState(false);

  useEffect(() => {
    const unsubTurmas = onSnapshot(query(collection(db, "turmas")), snap => setTurmas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turma))));
    const unsubAlunos = onSnapshot(query(collection(db, "alunos")), snap => setAlunosGlobais(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Aluno))));
    return () => { unsubTurmas(); unsubAlunos(); };
  }, []);

  const handleImportarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !turmaGerenciadaId) return;

    setIsAddingAluno(true);
    const leitor = new FileReader();

    leitor.onload = async (evento) => {
      const texto = evento.target?.result as string;
      const linhas = texto.split("\n").filter(linha => linha.trim() !== "");
      const batch = writeBatch(db);
      
      let importados = 0;
      let erros = 0;

      // Pular cabeçalho se houver (nome,matricula,nascimento)
      const dados = linhas[0].toLowerCase().includes("nome") ? linhas.slice(1) : linhas;

      dados.forEach(linha => {
        const colunas = linha.split(",").map(c => c.trim());
        if (colunas.length >= 3) {
          const [nome, matricula, nascimento] = colunas;
          
          // Verifica duplicata local
          if (!alunosGlobais.some(a => a.matricula === matricula)) {
            const senhaPadrao = nascimento.replace(/\//g, ""); // Remove barras da data DD/MM/AAAA
            const novoDocRef = doc(collection(db, "alunos"));
            
            batch.set(novoDocRef, {
              nome_completo: nome,
              matricula: matricula,
              turma_id: turmaGerenciadaId,
              data_nascimento: nascimento,
              senha_acesso: senhaPadrao
            });
            importados++;
          } else {
            erros++;
          }
        }
      });

      try {
        await batch.commit();
        alert(`Sucesso! ${importados} alunos importados. ${erros > 0 ? `${erros} duplicatas ignoradas.` : ""}`);
      } catch (err) {
        alert("Erro técnico na importação massiva.");
      } finally {
        setIsAddingAluno(false);
        e.target.value = "";
      }
    };

    leitor.readAsText(arquivo, "UTF-8");
  };

  const handleSalvarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addDoc(collection(db, "turmas"), {
        nome_turma: nomeTurma, instituicao, cabecalho_nome: cabecalhoNome || instituicao, cabecalho_subtitulo: cabecalhoSubtitulo || "Avaliação Oficial", data_criacao: new Date().toISOString()
      });
      setIsCreating(false);
    } catch (error) { alert("Erro ao salvar turma."); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Minhas Turmas</h1>
          <p className="text-gray-500 font-medium">Gestão de matrículas e importação de dados.</p>
        </div>
        <button onClick={() => setIsCreating(!isCreating)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all">
          {isCreating ? "Cancelar" : "+ Nova Turma"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSalvarTurma} className="bg-white p-8 rounded-2xl border border-gray-200 mb-8 shadow-sm animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Turma</label><input type="text" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={nomeTurma} onChange={e => setNomeTurma(e.target.value)} /></div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Instituição</label>
              <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={instituicao} onChange={e => setInstituicao(e.target.value)}>
                <option value="CNSD">Colégio Nossa Senhora das Dores</option>
                <option value="AUGE">Colégio Auge</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-600 transition-all">{isLoading ? "A Processar..." : "Confirmar Turma"}</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {turmas.map(t => {
          const alunosDaTurma = alunosGlobais.filter(a => a.turma_id === t.id);
          const isGerenciandoEsta = turmaGerenciadaId === t.id;

          return (
            <div key={t.id} className={`bg-white rounded-2xl border transition-all ${isGerenciandoEsta ? 'ring-2 ring-indigo-500 shadow-lg' : 'border-gray-200 shadow-sm'}`}>
              <div className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xl text-gray-900">{t.nome_turma}</h3>
                  <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded mt-2 inline-block uppercase tracking-widest">{t.instituicao}</span>
                </div>
                <button onClick={() => setTurmaGerenciadaId(isGerenciandoEsta ? null : t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isGerenciandoEsta ? 'bg-gray-900 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                  {isGerenciandoEsta ? "Fechar" : `Alunos (${alunosDaTurma.length})`}
                </button>
              </div>

              {isGerenciandoEsta && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 rounded-b-2xl">
                  {/* ZONA DE IMPORTAÇÃO CSV */}
                  <div className="mb-8 p-6 bg-white border-2 border-dashed border-indigo-200 rounded-2xl text-center">
                    <h4 className="font-bold text-gray-900 mb-1 text-sm">Importação Massiva</h4>
                    <p className="text-[10px] text-gray-400 mb-4 uppercase font-bold tracking-tight">Formato: nome, matricula, nascimento (DD/MM/AAAA)</p>
                    <label className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs cursor-pointer hover:bg-indigo-700 transition-all">
                      {isAddingAluno ? "A Carregar Alunos..." : "Selecionar Arquivo CSV"}
                      <input type="file" accept=".csv" className="hidden" onChange={handleImportarCSV} disabled={isAddingAluno} />
                    </label>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {alunosDaTurma.map(aluno => (
                      <div key={aluno.id} className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{aluno.nome_completo}</p>
                          <p className="text-[10px] text-gray-400 font-mono">MAT: {aluno.matricula} | NASC: {aluno.data_nascimento}</p>
                        </div>
                        <button onClick={() => deleteDoc(doc(db, "alunos", aluno.id))} className="text-red-300 hover:text-red-500">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}