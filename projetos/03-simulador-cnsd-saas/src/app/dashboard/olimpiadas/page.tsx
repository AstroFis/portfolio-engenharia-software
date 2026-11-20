// src/app/dashboard/olimpiadas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Olimpiada {
  id: string;
  nome: string;
  instituicao: string;
  niveis: string[];
  link_oficial?: string;
}

interface Aluno { id: string; nome_completo: string; turma_id: string; }
interface Turma { id: string; nome_turma: string; instituicao: string; }
interface Inscricao {
  id: string;
  olimpiada_id: string;
  aluno_id: string;
  aluno_nome: string;
  turma_nome: string; 
  nivel: string;
  fase_atual: number;
  status: string;
}

export default function OlimpiadasPage() {
  const [olimpiadas, setOlimpiadas] = useState<Olimpiada[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [abaAtiva, setAbaAtiva] = useState<"gestao" | "resultados">("gestao");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nomeOlimpiada, setNomeOlimpiada] = useState("");
  const [linkOficial, setLinkOficial] = useState("");
  const [instituicao, setInstituicao] = useState("CNSD");
  const [niveis, setNiveis] = useState<string[]>(["Nível 1"]);

  const [eventoAtivoId, setEventoAtivoId] = useState<string | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [nivelSelecionado, setNivelSelecionado] = useState("");

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, "olimpiadas")), snap => setOlimpiadas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Olimpiada)))),
      onSnapshot(query(collection(db, "inscricoes_olimpiadas")), snap => setInscricoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Inscricao)))),
      onSnapshot(query(collection(db, "turmas")), snap => setTurmas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Turma)))),
      onSnapshot(query(collection(db, "alunos")), snap => setAlunos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Aluno))))
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const abrirEdicao = (olim: Olimpiada) => {
    setEditingId(olim.id);
    setNomeOlimpiada(olim.nome);
    setLinkOficial(olim.link_oficial || "");
    setInstituicao(olim.instituicao);
    setNiveis(olim.niveis);
    setIsModalOpen(true);
  };

  const handleSalvarOlimpiada = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const dados = { 
      nome: nomeOlimpiada, 
      link_oficial: linkOficial,
      instituicao, 
      niveis: niveis.filter(n => n.trim() !== "") 
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "olimpiadas", editingId), dados);
      } else {
        await addDoc(collection(db, "olimpiadas"), { ...dados, data_criacao: new Date().toISOString() });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNomeOlimpiada(""); setLinkOficial(""); setNiveis(["Nível 1"]);
    } catch (err) { alert("Erro ao processar evento."); }
    finally { setIsLoading(false); }
  };

  const inscreverCompetidor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoSelecionado || !nivelSelecionado || !eventoAtivoId) return alert("Dados incompletos.");
    
    const atleta = alunos.find(a => a.id === alunoSelecionado);
    const turma = turmas.find(t => t.id === atleta?.turma_id);

    await addDoc(collection(db, "inscricoes_olimpiadas"), {
      olimpiada_id: eventoAtivoId,
      aluno_id: atleta?.id,
      aluno_nome: atleta?.nome_completo,
      turma_nome: turma?.nome_turma || "N/A",
      nivel: nivelSelecionado,
      fase_atual: 1,
      status: "Fase 1"
    });
    setAlunoSelecionado("");
  };

  const alterarStatus = async (id: string, novaFase: number, novoStatus: string) => {
    await updateDoc(doc(db, "inscricoes_olimpiadas", id), {
      fase_atual: novaFase,
      status: novoStatus
    });
  };

  const medalhistas = inscricoes.filter(i => i.status.includes("Medalha") || i.status.includes("Menção"));

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Olimpíadas Científicas</h1>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setAbaAtiva("gestao")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${abaAtiva === "gestao" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-500 border"}`}
            >
              ⚙️ Gestão Operacional
            </button>
            <button 
              onClick={() => setAbaAtiva("resultados")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${abaAtiva === "resultados" ? "bg-amber-500 text-white shadow-md" : "bg-white text-gray-500 border"}`}
            >
              🏆 Mural de Resultados
            </button>
          </div>
        </div>
        {abaAtiva === "gestao" && (
          <button onClick={() => { setEditingId(null); setNomeOlimpiada(""); setLinkOficial(""); setIsModalOpen(true); }} className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition-all">
            + Novo Evento Olímpico
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900/80 backdrop-blur-sm flex justify-center items-start overflow-y-auto pt-10 pb-10 px-4">
          <form onSubmit={handleSalvarOlimpiada} className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative my-auto">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-4 right-5 text-gray-400 hover:text-red-500 font-bold text-2xl leading-none">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">{editingId ? "Ajustar Evento" : "Novo Evento Olímpico"}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome do Evento</label>
                <input type="text" required placeholder="Ex: OBA 2026" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={nomeOlimpiada} onChange={e => setNomeOlimpiada(e.target.value)} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Instituição</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={instituicao} onChange={e => setInstituicao(e.target.value)}>
                  <option value="CNSD">CNSD</option>
                  <option value="AUGE">AUGE</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link do Portal de Inscrição</label>
                <input type="url" placeholder="https://sistema.olimpiada.org.br" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" value={linkOficial} onChange={e => setLinkOficial(e.target.value)} />
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-xl mb-8 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-sm text-gray-700 uppercase tracking-wide">Níveis de Prova</span>
                <button type="button" onClick={() => setNiveis([...niveis, ""])} className="text-xs text-indigo-600 font-bold hover:underline">+ Adicionar Nível</button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                {niveis.map((n, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={n} onChange={e => { const copy = [...niveis]; copy[i] = e.target.value; setNiveis(copy); }} />
                    {niveis.length > 1 && <button type="button" onClick={() => setNiveis(niveis.filter((_, idx) => idx !== i))} className="text-red-500 font-bold p-2 hover:bg-red-50 rounded-lg transition-colors">&times;</button>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors rounded-lg">Cancelar</button>
              <button type="submit" disabled={isLoading} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50">
                {isLoading ? "Processando..." : "Salvar no Sistema"}
              </button>
            </div>
          </form>
        </div>
      )}

      {abaAtiva === "resultados" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total de Medalhistas</p>
              <p className="text-4xl font-black text-gray-900 mt-1">{medalhistas.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Participação CNSD</p>
              <p className="text-4xl font-black text-indigo-600 mt-1">{inscricoes.filter(i => turmas.find(t => t.nome_turma === i.turma_nome)?.instituicao === "CNSD").length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Participação AUGE</p>
              <p className="text-4xl font-black text-amber-600 mt-1">{inscricoes.filter(i => turmas.find(t => t.nome_turma === i.turma_nome)?.instituicao === "AUGE").length}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-black text-gray-900 text-xl uppercase tracking-tighter">Quadro de Honra Acadêmica</h2>
              <button 
                onClick={() => window.print()} 
                className="text-xs font-bold bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all text-gray-700 print:hidden"
              >
                Gerar Relatório (PDF)
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-400 font-bold border-b text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="p-6">Competidor</th>
                  <th className="p-6">Escola / Turma</th>
                  <th className="p-6">Olimpíada</th>
                  <th className="p-6">Nível</th>
                  <th className="p-6 text-right">Premiação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medalhistas.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">Nenhum resultado premiado registrado até o momento.</td></tr>
                ) : (
                  medalhistas.map(m => {
                    const olim = olimpiadas.find(o => o.id === m.olimpiada_id);
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-6 font-black text-gray-900 text-base">{m.aluno_nome}</td>
                        <td className="p-6">
                          <p className="font-bold text-gray-600">{m.turma_nome}</p>
                          <p className="text-[10px] font-black text-indigo-400 uppercase">{olim?.instituicao}</p>
                        </td>
                        <td className="p-6 font-bold text-gray-700">{olim?.nome}</td>
                        <td className="p-6"><span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{m.nivel}</span></td>
                        <td className="p-6 text-right">
                          <span className="inline-block bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-black text-xs border border-amber-100 shadow-sm">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
              <strong>Nota de Conformidade LGPD:</strong> Este relatório contém dados pessoais protegidos. A partilha externa deve ser realizada apenas em canais oficiais da instituição e com consentimento prévio para divulgação de imagem e nome de menores em murais públicos.
            </p>
          </div>
        </div>
      )}

      {abaAtiva === "gestao" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {olimpiadas.map(olim => {
            const compNoEvento = inscricoes.filter(i => i.olimpiada_id === olim.id);
            const isAtivo = eventoAtivoId === olim.id;

            return (
              <div key={olim.id} className={`bg-white rounded-2xl border transition-all ${isAtivo ? 'ring-2 ring-indigo-500 shadow-lg' : 'border-gray-200 shadow-sm'}`}>
                <div className="p-6 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-gray-900">{olim.nome}</h3>
                      {olim.link_oficial && (
                        <a href={olim.link_oficial} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-100 transition-colors uppercase tracking-widest">
                          🔗 Portal Oficial
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mt-2 inline-block">{olim.instituicao}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEventoAtivoId(isAtivo ? null : olim.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isAtivo ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {isAtivo ? "Recolher Painel" : `Gerir Competidores (${compNoEvento.length})`}
                    </button>
                    <button onClick={() => abrirEdicao(olim)} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-50 hover:text-gray-700 transition-all">Editar</button>
                  </div>
                </div>

                {isAtivo && (
                  <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                    <form onSubmit={inscreverCompetidor} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
                      <select className="p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={turmaSelecionada} onChange={e => setTurmaSelecionada(e.target.value)}>
                        <option value="">1. Filtrar Turma...</option>
                        {turmas.filter(t => t.instituicao === olim.instituicao).map(t => <option key={t.id} value={t.id}>{t.nome_turma}</option>)}
                      </select>
                      <select className="p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={alunoSelecionado} onChange={e => setAlunoSelecionado(e.target.value)} disabled={!turmaSelecionada}>
                        <option value="">2. Selecionar Aluno...</option>
                        {alunos.filter(a => a.turma_id === turmaSelecionada).map(a => <option key={a.id} value={a.id}>{a.nome_completo}</option>)}
                      </select>
                      <select className="p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={nivelSelecionado} onChange={e => setNivelSelecionado(e.target.value)}>
                        <option value="">3. Nível...</option>
                        {olim.niveis.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <button type="submit" className="bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors">Inscrever Competidor</button>
                    </form>

                    {compNoEvento.length === 0 ? (
                      <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
                        <p className="text-gray-500 text-sm font-medium">Nenhum competidor inscrito neste evento.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                            <tr><th className="p-4">Aluno / Competidor</th><th className="p-4">Nível</th><th className="p-4">Status / Fase</th><th className="p-4 text-right">Controle</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {compNoEvento.map(insc => (
                              <tr key={insc.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                  <p className="font-bold text-gray-900">{insc.aluno_nome}</p>
                                  <p className="text-[10px] text-gray-400 uppercase font-medium">{insc.turma_nome}</p>
                                </td>
                                <td className="p-4"><span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-[10px] font-bold">{insc.nivel}</span></td>
                                <td className="p-4">
                                  <select 
                                    className={`text-xs font-bold uppercase px-3 py-2 rounded-lg border-none focus:ring-0 cursor-pointer transition-colors ${insc.status.includes('Medalha') ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                                    value={insc.status}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      let fase = 1;
                                      if (val.includes("2")) fase = 2;
                                      if (val.includes("3")) fase = 3;
                                      alterarStatus(insc.id, fase, val);
                                    }}
                                  >
                                    <option value="Fase 1">Fase 1</option>
                                    <option value="Fase 2">Fase 2</option>
                                    <option value="Fase 3">Fase 3</option>
                                    <option value="🏆 Medalha de Ouro">🥇 Ouro</option>
                                    <option value="🥈 Medalha de Prata">🥈 Prata</option>
                                    <option value="🥉 Medalha de Bronze">🥉 Bronze</option>
                                    <option value="🎗️ Menção Honrosa">🎗️ Menção</option>
                                  </select>
                                </td>
                                <td className="p-4 text-right">
                                  <button onClick={() => deleteDoc(doc(db, "inscricoes_olimpiadas", insc.id))} className="text-red-400 hover:text-red-600 p-2 transition-colors" title="Remover Inscrição">
                                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}