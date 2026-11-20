// src/app/dashboard/simuladores/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Turma { id: string; nome_turma: string; instituicao: string; }
interface Olimpiada { id: string; nome: string; instituicao: string; niveis: string[]; }
interface Questao { id: string; tipo: "multipla_escolha" | "discursiva"; enunciado: string; alternativas: string[]; gabarito: string; valor: number; }
interface Simulador { 
  id: string; 
  titulo: string; 
  modo: string; 
  turma_id?: string; 
  olimpiada_id?: string;
  nivel_olimpiada?: string;
  pin_acesso: string; 
  status: string; 
  data_criacao: string; 
}

export default function SimuladoresPage() {
  const router = useRouter();
  const [simuladores, setSimuladores] = useState<Simulador[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [olimpiadas, setOlimpiadas] = useState<Olimpiada[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [modoSimulador, setModoSimulador] = useState<"turma" | "olimpiada">("turma");
  
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [olimpiadaSelecionada, setOlimpiadaSelecionada] = useState("");
  const [nivelOlimpiadaSelecionado, setNivelOlimpiadaSelecionado] = useState("");

  const [tempoLimite, setTempoLimite] = useState("");
  const [liberacaoGabarito, setLiberacaoGabarito] = useState("manual"); // ESTADO RECUPERADO
  const [formatoNavegacao, setFormatoNavegacao] = useState("cascata");
  const [questoes, setQuestoes] = useState<Questao[]>([]);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, "turmas"), snap => setTurmas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Turma)))),
      onSnapshot(collection(db, "olimpiadas"), snap => setOlimpiadas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Olimpiada)))),
      onSnapshot(query(collection(db, "simuladores"), orderBy("data_criacao", "desc")), snap => setSimuladores(snap.docs.map(d => ({ id: d.id, ...d.data() } as Simulador))))
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const handleExcluirSimulador = async (id: string) => {
    if (confirm("Tem certeza que deseja apagar este simulador permanentemente? As respostas ficarão órfãs.")) {
      try { await deleteDoc(doc(db, "simuladores", id)); } 
      catch (error) { alert("Falha ao tentar excluir o simulador."); }
    }
  };

  const adicionarQuestao = () => {
    setQuestoes([...questoes, { 
      id: Math.random().toString(36).substr(2, 9), 
      tipo: "multipla_escolha", 
      enunciado: "", 
      alternativas: ["", "", "", ""], 
      gabarito: "0", 
      valor: 1 
    }]);
  };

  const adicionarAlternativa = (questaoId: string) => setQuestoes(questoes.map(q => q.id === questaoId ? { ...q, alternativas: [...q.alternativas, ""] } : q));
  
  const removerAlternativa = (questaoId: string, index: number) => {
    setQuestoes(questoes.map(q => {
      if (q.id === questaoId && q.alternativas.length > 2) {
        const novasAlt = q.alternativas.filter((_, i) => i !== index);
        const novoGabarito = Number(q.gabarito) >= novasAlt.length ? "0" : q.gabarito;
        return { ...q, alternativas: novasAlt, gabarito: novoGabarito };
      }
      return q;
    }));
  };

  const atualizarQuestao = (id: string, campo: string, valor: any) => setQuestoes(questoes.map(q => q.id === id ? { ...q, [campo]: valor } : q));
  
  const atualizarAlternativa = (questaoId: string, index: number, valor: string) => {
    setQuestoes(questoes.map(q => {
      if (q.id === questaoId) {
        const novasAlt = [...q.alternativas];
        novasAlt[index] = valor;
        return { ...q, alternativas: novasAlt };
      }
      return q;
    }));
  };

  const removerQuestao = (id: string) => setQuestoes(questoes.filter(q => q.id !== id));

  const gerarPIN = () => {
    const prefix = modoSimulador === "olimpiada" ? "OLX" : "AVAL";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleSalvarSimulador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modoSimulador === "turma" && !turmaSelecionada) return alert("Selecione uma turma para a avaliação.");
    if (modoSimulador === "olimpiada" && (!olimpiadaSelecionada || !nivelOlimpiadaSelecionado)) return alert("Selecione a Olimpíada e o Nível para criar o treino.");
    if (questoes.length === 0) return alert("Adicione pelo menos uma questão à prova.");

    setIsLoading(true);
    try {
      const pin = gerarPIN();
      
      const payloadBase = {
        titulo,
        modo: modoSimulador,
        pin_acesso: pin,
        status: "publicado",
        configuracoes: {
          tempo_limite: tempoLimite ? Number(tempoLimite) : null,
          liberacao_gabarito: liberacaoGabarito, // USANDO O ESTADO RECUPERADO
          formato_navegacao: formatoNavegacao
        },
        questoes: questoes.map(q => ({
          id_questao: q.id,
          tipo: q.tipo,
          enunciado: q.enunciado,
          alternativas: q.tipo === "multipla_escolha" ? q.alternativas : [],
          gabarito: q.tipo === "multipla_escolha" ? q.gabarito : "",
          valor: Number(q.valor)
        })),
        data_criacao: new Date().toISOString()
      };

      const payloadFinal = modoSimulador === "turma" 
        ? { ...payloadBase, turma_id: turmaSelecionada }
        : { ...payloadBase, olimpiada_id: olimpiadaSelecionada, nivel_olimpiada: nivelOlimpiadaSelecionado };

      await addDoc(collection(db, "simuladores"), payloadFinal);

      setIsCreating(false);
      setTitulo(""); setTurmaSelecionada(""); setOlimpiadaSelecionada(""); setNivelOlimpiadaSelecionado(""); setTempoLimite(""); setQuestoes([]); setLiberacaoGabarito("manual");
      alert(`PIN Gerado com sucesso: ${pin}`);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o simulador no cofre.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCreating) {
    const olimpiadaAtiva = olimpiadas.find(o => o.id === olimpiadaSelecionada);

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={() => setIsCreating(false)} className="mb-4 text-gray-500 hover:text-indigo-600 font-bold">&larr; Voltar</button>
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-black mb-6 text-gray-900">Forja de Avaliação</h2>
          <form onSubmit={handleSalvarSimulador} className="space-y-6">
            
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button type="button" onClick={() => setModoSimulador("turma")} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${modoSimulador === "turma" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                🎓 Avaliação Escolar (Turma)
              </button>
              <button type="button" onClick={() => setModoSimulador("olimpiada")} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${modoSimulador === "olimpiada" ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                🏅 Treino Olímpico (Olimpíada)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título do Documento</label>
                <input type="text" required placeholder={modoSimulador === "turma" ? "Ex: Prova Mensal de Física" : "Ex: Treino OBA - Cinemática Escalar"} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>

              {modoSimulador === "turma" ? (
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Turma Alvo</label>
                  <select required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={turmaSelecionada} onChange={(e) => setTurmaSelecionada(e.target.value)}>
                    <option value="">Selecione a Turma Oficial...</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.nome_turma} ({t.instituicao})</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Olimpíada Vinculada</label>
                    <select required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={olimpiadaSelecionada} onChange={(e) => { setOlimpiadaSelecionada(e.target.value); setNivelOlimpiadaSelecionado(""); }}>
                      <option value="">Selecione a Competição...</option>
                      {olimpiadas.map(o => <option key={o.id} value={o.id}>{o.nome} ({o.instituicao})</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nível de Dificuldade</label>
                    <select required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" value={nivelOlimpiadaSelecionado} onChange={(e) => setNivelOlimpiadaSelecionado(e.target.value)} disabled={!olimpiadaSelecionada}>
                      <option value="">Selecione o Nível...</option>
                      {olimpiadaAtiva?.niveis.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* CONTROLES DE CONFIGURAÇÃO (AGORA COM RESULTADOS) */}
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mt-2 mb-1">Formato</label>
                <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={formatoNavegacao} onChange={(e) => setFormatoNavegacao(e.target.value)}>
                  <option value="cascata">Cascata Contínua</option>
                  <option value="paginacao">Paginação (1 por tela)</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mt-2 mb-1">Tempo Limite</label>
                <input type="number" placeholder="Livre (Sem cronômetro)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" value={tempoLimite} onChange={(e) => setTempoLimite(e.target.value)} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mt-2 mb-1 text-indigo-600">Resultados</label>
                <select className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50" value={liberacaoGabarito} onChange={(e) => setLiberacaoGabarito(e.target.value)}>
                  <option value="imediata">Mostrar nota ao final</option>
                  <option value="manual">Ocultar nota (Controle do Prof.)</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-gray-800">Questões do Documento</h3>
                <button type="button" onClick={adicionarQuestao} className="text-indigo-600 font-bold hover:underline">+ Adicionar Questão</button>
              </div>

              {questoes.length === 0 && <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 font-medium">A prova está vazia. Adicione a primeira questão.</div>}

              {questoes.map((q, index) => (
                <div key={q.id} className="border p-6 rounded-xl bg-white relative shadow-sm">
                  <button type="button" onClick={() => removerQuestao(q.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 font-bold text-sm">Remover</button>
                  <div className="flex gap-4 mb-4">
                    <select className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500" value={q.tipo} onChange={(e) => atualizarQuestao(q.id, "tipo", e.target.value)}>
                      <option value="multipla_escolha">Múltipla Escolha</option>
                      <option value="discursiva">Discursiva</option>
                    </select>
                    <input type="number" step="0.5" className="w-24 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Pontos" value={q.valor} onChange={(e) => atualizarQuestao(q.id, "valor", e.target.value)} />
                  </div>
                  <textarea required placeholder="Escreva o enunciado detalhado da questão aqui..." className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 min-h-[100px]" value={q.enunciado} onChange={(e) => atualizarQuestao(q.id, "enunciado", e.target.value)} />

                  {q.tipo === "multipla_escolha" && (
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-3">Alternativas (Marque o gabarito correto)</p>
                      {q.alternativas.map((alt, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <input type="radio" name={`gabarito-${q.id}`} checked={q.gabarito === i.toString()} onChange={() => atualizarQuestao(q.id, "gabarito", i.toString())} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                          <span className="font-bold text-sm text-gray-700">{String.fromCharCode(65 + i)})</span>
                          <input type="text" required placeholder="Texto da alternativa..." className="flex-1 p-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500" value={alt} onChange={(e) => atualizarAlternativa(q.id, i, e.target.value)} />
                          <button type="button" onClick={() => removerAlternativa(q.id, i)} className="text-red-400 hover:text-red-600 p-2 font-bold">&times;</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => adicionarAlternativa(q.id)} className="text-xs font-bold text-indigo-600 mt-3 hover:underline inline-block">+ Adicionar Alternativa</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t">
              <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white p-4 rounded-xl font-black text-lg tracking-wide hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50">
                {isLoading ? "A PROCESSAR..." : "SALVAR E GERAR PIN DE ACESSO"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Simuladores</h1>
          <p className="text-gray-500 mt-1 font-medium">Gestão de Avaliações e Treinamentos</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition-colors">
          + Novo Documento
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {simuladores.map(s => {
          const isOlimpiada = s.modo === "olimpiada";
          const olimpiadaRef = olimpiadas.find(o => o.id === s.olimpiada_id);
          const turmaRef = turmas.find(t => t.id === s.turma_id);
          
          const instituicao = isOlimpiada ? olimpiadaRef?.instituicao : turmaRef?.instituicao;
          const nomeOlimpiada = olimpiadaRef?.nome || "Evento Apagado";
          const nomeTurma = turmaRef?.nome_turma || "Turma Apagada";

          return (
            <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-lg text-gray-900 line-clamp-2">{s.titulo}</h3>
                </div>
                
                {isOlimpiada ? (
                  <div className="mb-4">
                    <div className="flex gap-2 items-center mb-1">
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2 py-1 rounded-md">🏅 Treino Olímpico</span>
                      {instituicao && <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-black uppercase px-2 py-1 rounded-md">{instituicao}</span>}
                    </div>
                    <p className="text-xs text-gray-500 font-bold">{nomeOlimpiada} • {s.nivel_olimpiada}</p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex gap-2 items-center mb-1">
                      <span className="inline-block bg-gray-100 text-gray-800 text-[10px] font-black uppercase px-2 py-1 rounded-md">🎓 Avaliação de Turma</span>
                      {instituicao && <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-black uppercase px-2 py-1 rounded-md">{instituicao}</span>}
                    </div>
                    <p className="text-xs text-gray-500 font-bold">{nomeTurma}</p>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">PIN de Acesso</span>
                  <span className="font-mono font-black text-indigo-600 text-lg tracking-widest">{s.pin_acesso}</span>
                </div>
              </div>
              <div className="mt-6 flex space-x-3 border-t border-gray-100 pt-4">
                <button onClick={() => router.push(`/dashboard/simuladores/${s.id}`)} className="flex-1 bg-indigo-50 text-indigo-700 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors">
                  Ver Respostas
                </button>
                <button onClick={() => handleExcluirSimulador(s.id)} className="px-4 bg-white text-red-500 py-2.5 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors border border-gray-200 hover:border-red-100">
                  Apagar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}