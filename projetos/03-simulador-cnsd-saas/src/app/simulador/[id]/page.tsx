// src/app/simulador/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ArenaDeProva() {
  const params = useParams();
  const router = useRouter();
  const simuladorId = params.id as string;

  const [alunoAtivo, setAlunoAtivo] = useState<any>(null);
  const [simulador, setSimulador] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [questaoAtualIndex, setQuestaoAtualIndex] = useState(0);
  
  // Estados Pós-Prova
  const [provaFinalizada, setProvaFinalizada] = useState(false);
  const [notaObtida, setNotaObtida] = useState(0);
  const [notaMaxima, setNotaMaxima] = useState(0);

  useEffect(() => {
    const idSessao = sessionStorage.getItem("aluno_ativo_id");
    const nomeSessao = sessionStorage.getItem("aluno_ativo_nome");
    const matriculaSessao = sessionStorage.getItem("aluno_ativo_matricula");
    
    if (!idSessao) { router.push("/simulador"); return; }
    setAlunoAtivo({ id: idSessao, nome: nomeSessao, matricula: matriculaSessao });

    const carregarProva = async () => {
      const docSnap = await getDoc(doc(db, "simuladores", simuladorId));
      if (docSnap.exists()) setSimulador(docSnap.data());
      setIsLoading(false);
    };
    carregarProva();
  }, [simuladorId, router]);

  const handleSair = () => {
    if (confirm("Deseja encerrar a sessão? O progresso atual será perdido.")) {
      sessionStorage.clear();
      router.push("/simulador");
    }
  };

  const obterChave = (q: any) => q.id_questao || q.enunciado;

  const handleFinalizar = async () => {
    setIsSubmitting(true);
    let notaObj = 0;
    let maximoObj = 0;

    // Motor de Correção em Tempo Real
    simulador.questoes.forEach((q: any) => {
      const chave = obterChave(q);
      maximoObj += q.valor; // Soma o valor total da prova
      
      if (q.tipo === "multipla_escolha" && respostas[chave] === q.gabarito) {
        notaObj += q.valor;
      }
    });

    setNotaObtida(notaObj);
    setNotaMaxima(maximoObj);

    try {
      await addDoc(collection(db, "submissoes"), {
        simulador_id: simuladorId,
        aluno_id: alunoAtivo.id,
        aluno_nome: alunoAtivo.nome,
        aluno_matricula: alunoAtivo.matricula || "N/A",
        respostas,
        nota_objetiva: notaObj,
        data_envio: new Date().toISOString()
      });
      setProvaFinalizada(true);
    } catch (error) {
      alert("Erro ao enviar a prova. Verifique a sua conexão.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">A decodificar documento...</p>
    </div>
  );
  
  // TELA DE SUCESSO REFORMULADA (COM RESULTADOS E BOTÃO VOLTAR)
  if (provaFinalizada) {
    const mostrarNota = simulador.configuracoes?.liberacao_gabarito === "imediata";

    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="font-black text-2xl text-gray-900 mb-2">Avaliação Concluída!</h1>
          
          {mostrarNota ? (
            <div className="my-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Desempenho Objetivo</p>
              <p className="text-5xl font-black text-indigo-700">{notaObtida.toFixed(1)} <span className="text-xl text-indigo-400">/ {notaMaxima.toFixed(1)}</span></p>
              <p className="text-[10px] text-indigo-500 mt-3 font-medium leading-relaxed">*Questões discursivas (se houver) aguardam correção manual do professor.</p>
            </div>
          ) : (
            <div className="my-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                As suas respostas foram enviadas em segurança para a base de dados. O professor irá libertar os resultados oficiais posteriormente.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button onClick={() => router.push("/simulador")} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md">
              Voltar ao Painel do Aluno
            </button>
            <button onClick={() => { sessionStorage.clear(); router.push("/simulador"); }} className="w-full bg-white text-red-500 py-3 rounded-xl font-bold border border-red-100 hover:bg-red-50 transition-colors">
              Encerrar Sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formato = simulador.configuracoes?.formato_navegacao || "cascata";
  const questoes = simulador.questoes;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center shadow-sm z-50">
        <div>
          <h1 className="font-black text-gray-900 text-lg">{simulador.titulo}</h1>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{alunoAtivo?.nome}</p>
        </div>
        <button onClick={handleSair} className="text-xs bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-bold transition-colors">
          Sair
        </button>
      </div>

      <div className="max-w-3xl mx-auto mt-8 px-4">
        {formato === "cascata" ? (
          <div className="space-y-8">
            {questoes.map((q: any, idx: number) => {
              const chave = obterChave(q);
              return (
                <div key={idx} className="bg-white p-8 rounded-3xl border shadow-sm">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <span className="font-black text-gray-400 text-sm tracking-widest uppercase">Questão {idx + 1}</span>
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{q.valor} pts</span>
                  </div>
                  <p className="font-bold text-lg text-gray-800 mb-6 leading-relaxed">{q.enunciado}</p>
                  
                  {q.tipo === "multipla_escolha" ? (
                    <div className="space-y-3">
                      {q.alternativas.map((alt: string, i: number) => (
                        <label key={i} className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${respostas[chave] === i.toString() ? 'bg-indigo-50 border-indigo-500' : 'hover:border-gray-300'}`}>
                          <input type="radio" name={`questao-${idx}`} value={i.toString()} checked={respostas[chave] === i.toString()} onChange={(e) => setRespostas({...respostas, [chave]: e.target.value})} className="mr-4 w-5 h-5 text-indigo-600 focus:ring-indigo-500" />
                          <span className="font-medium text-gray-700 text-sm">{alt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea className="w-full border-2 border-gray-200 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[150px]" placeholder="Digite a sua resposta aqui..." onChange={(e) => setRespostas({...respostas, [chave]: e.target.value})} />
                  )}
                </div>
              );
            })}
            <button onClick={handleFinalizar} disabled={isSubmitting} className="w-full bg-gray-900 text-white p-5 rounded-2xl font-black text-lg tracking-wide hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 mt-8">
              {isSubmitting ? "A ENVIAR RESPOSTAS..." : "FINALIZAR E ENVIAR AVALIAÇÃO"}
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border shadow-sm">
             <div className="flex justify-between items-center mb-6 border-b pb-4">
               <span className="font-black text-gray-400 text-sm tracking-widest uppercase">Questão {questaoAtualIndex + 1} de {questoes.length}</span>
               <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{questoes[questaoAtualIndex].valor} pts</span>
             </div>
             <p className="font-bold text-lg text-gray-800 mb-6 leading-relaxed">{questoes[questaoAtualIndex].enunciado}</p>
             
             {questoes[questaoAtualIndex].tipo === "multipla_escolha" ? (
               <div className="space-y-3">
                 {questoes[questaoAtualIndex].alternativas.map((alt: string, i: number) => {
                   const qAtual = questoes[questaoAtualIndex];
                   const chave = obterChave(qAtual);
                   return (
                     <label key={i} className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${respostas[chave] === i.toString() ? 'bg-indigo-50 border-indigo-500' : 'hover:border-gray-300'}`}>
                       <input type="radio" name={`questao-${questaoAtualIndex}`} value={i.toString()} checked={respostas[chave] === i.toString()} onChange={(e) => setRespostas({...respostas, [chave]: e.target.value})} className="mr-4 w-5 h-5 text-indigo-600 focus:ring-indigo-500" />
                       <span className="font-medium text-gray-700 text-sm">{alt}</span>
                     </label>
                   );
                 })}
               </div>
             ) : (
               <textarea className="w-full border-2 border-gray-200 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[150px]" placeholder="Digite a sua resposta aqui..." onChange={(e) => {
                 const qAtual = questoes[questaoAtualIndex];
                 setRespostas({...respostas, [obterChave(qAtual)]: e.target.value})
               }} />
             )}
             
             <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                <button disabled={questaoAtualIndex === 0} onClick={() => setQuestaoAtualIndex(questaoAtualIndex - 1)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-30 transition-all">Anterior</button>
                {questaoAtualIndex === questoes.length - 1 ? 
                  <button onClick={handleFinalizar} disabled={isSubmitting} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black tracking-wide hover:bg-indigo-700 shadow-md disabled:opacity-50 transition-colors">
                    {isSubmitting ? "A ENVIAR..." : "FINALIZAR"}
                  </button> :
                  <button onClick={() => setQuestaoAtualIndex(questaoAtualIndex + 1)} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black tracking-wide hover:bg-gray-800 shadow-md transition-colors">Próxima</button>
                }
             </div>
          </div>
        )}
      </div>
    </main>
  );
}