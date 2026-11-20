// src/app/simulador/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PortalDoAluno() {
  const router = useRouter();
  
  // Estados de Autenticação
  const [matricula, setMatricula] = useState("");
  const [senhaAcesso, setSenhaAcesso] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [alunoData, setAlunoData] = useState<any>(null);
  
  // Estados de Conteúdo
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [treinosDisponiveis, setTreinosDisponiveis] = useState<any[]>([]);
  const [pin, setPin] = useState("");
  
  // Estados de Segurança (Alterar Senha)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const salvo = sessionStorage.getItem("aluno_ativo_id");
    if (salvo) {
      setAlunoData({ id: salvo, nome: sessionStorage.getItem("aluno_ativo_nome"), matricula: sessionStorage.getItem("aluno_ativo_matricula") });
      setIsLogged(true);
    }
  }, []);

  useEffect(() => {
    if (!isLogged || !alunoData) return;

    const qInsc = query(collection(db, "inscricoes_olimpiadas"), where("aluno_id", "==", alunoData.id));
    const unsubInsc = onSnapshot(qInsc, (snap) => {
      const docsInsc = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInscricoes(docsInsc);

      const niveis = docsInsc.map((i: any) => i.nivel);
      if (niveis.length > 0) {
        const qTreinos = query(collection(db, "simuladores"), where("modo", "==", "olimpiada"), where("nivel_olimpiada", "in", niveis));
        getDocs(qTreinos).then(simSnap => setTreinosDisponiveis(simSnap.docs.map(d => ({ id: d.id, ...d.data() }))));
      }
    });
    return () => unsubInsc();
  }, [isLogged, alunoData]);

  const handleAcessoMatricula = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErro("");

    try {
      const q = query(collection(db, "alunos"), where("matricula", "==", matricula.trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setErro("Matrícula não encontrada no sistema.");
        setIsLoading(false);
        return;
      }

      const docAlu = snap.docs[0];
      const data = docAlu.data();
      
      // Validação de Segurança (LGPD)
      const senhaCorreta = data.senha_acesso;
      
      // Fallback de segurança para alunos cadastrados ANTES dessa atualização
      if (!senhaCorreta) {
        setErro("Conta inativa. Solicite ao professor a atualização do seu cadastro com a sua Data de Nascimento.");
        setIsLoading(false);
        return;
      }

      if (senhaAcesso !== senhaCorreta) {
        setErro("Credenciais inválidas. Verifique a sua matrícula e senha.");
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem("aluno_ativo_id", docAlu.id);
      sessionStorage.setItem("aluno_ativo_nome", data.nome_completo);
      sessionStorage.setItem("aluno_ativo_matricula", data.matricula);
      
      setAlunoData({ id: docAlu.id, nome: data.nome_completo, matricula: data.matricula });
      setIsLogged(true);

    } catch (err) {
      setErro("Falha na ligação aos servidores.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMudarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) return alert("As senhas não coincidem.");
    if (novaSenha.length < 6) return alert("A nova senha deve ter pelo menos 6 caracteres.");

    try {
      await updateDoc(doc(db, "alunos", alunoData.id), { senha_acesso: novaSenha });
      alert("Senha atualizada com sucesso!");
      setIsChangingPassword(false);
      setNovaSenha(""); setConfirmarSenha("");
    } catch (err) {
      alert("Falha ao atualizar credencial.");
    }
  };

  const acessarPorPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const pinLimpo = pin.trim().toUpperCase();

    const q = query(collection(db, "simuladores"), where("pin_acesso", "==", pinLimpo));
    const snap = await getDocs(q);

    if (snap.empty) { alert("PIN Inválido."); } 
    else { router.push(`/simulador/${snap.docs[0].id}`); }
    setIsLoading(false);
  };

  const logout = () => {
    sessionStorage.clear();
    setIsLogged(false);
    setAlunoData(null);
  };

  if (!isLogged) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Portal do Aluno</h1>
            <p className="text-gray-500 mt-2 font-medium">Autenticação Segura</p>
          </div>
          {erro && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">{erro}</div>}
          <form onSubmit={handleAcessoMatricula} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-2">Matrícula</label>
              <input type="text" required className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl text-lg font-bold focus:border-indigo-500 transition-all outline-none" value={matricula} onChange={e => setMatricula(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-2">Senha (PIN Pessoal)</label>
              <input type="password" required placeholder="Primeiro acesso: DDMMAAAA" className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl text-lg focus:border-indigo-500 transition-all outline-none" value={senhaAcesso} onChange={e => setSenhaAcesso(e.target.value)} />
            </div>
            <button type="submit" disabled={isLoading} className="w-full mt-4 bg-gray-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50">
              {isLoading ? "A VALIDAR CREDENCIAIS..." : "ENTRAR NO SISTEMA"}
            </button>
          </form>

          {/* ESCUDO LEGAL LGPD */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed text-center">
              <strong>Proteção de Dados:</strong> O acesso a esta plataforma constitui consentimento para o tratamento de dados (Nome, Matrícula e Turma) para fins estritamente pedagógicos e de avaliação escolar, em conformidade com as diretrizes de privacidade.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 relative">
      
      {/* MODAL DE ALTERAÇÃO DE SENHA */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleMudarSenha} className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-2">Segurança da Conta</h3>
            <p className="text-xs text-gray-500 mb-6">Cadastre uma nova senha para proteger as suas avaliações e treinos.</p>
            
            <div className="space-y-4 mb-6">
              <input type="password" required placeholder="Nova Senha" minLength={6} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
              <input type="password" required placeholder="Confirmar Nova Senha" minLength={6} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} />
            </div>
            
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
              <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Salvar Senha</button>
            </div>
          </form>
        </div>
      )}

      {/* HEADER DO ALUNO */}
      <header className="bg-white border-b p-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Sessão Segura</p>
            <h2 className="text-xl font-black text-gray-900">{alunoData?.nome}</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsChangingPassword(true)} className="text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl transition-colors hidden md:block">Segurança da Conta</button>
            <button onClick={logout} className="text-xs font-bold text-red-500 hover:bg-red-50 border border-red-100 px-4 py-2 rounded-xl transition-colors">Encerrar Sessão</button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: TREINOS OLÍMPICOS (PILAR 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Os Meus Treinos Olímpicos</h3>
            <button onClick={() => setIsChangingPassword(true)} className="text-xs font-bold text-indigo-600 hover:underline md:hidden">Alterar Senha</button>
          </div>
          
          {inscricoes.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border-2 border-dashed text-center text-gray-400">
              Não estás inscrito em nenhuma delegação olímpica.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {treinosDisponiveis.map(treino => (
                <div key={treino.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">🏅 Treino {treino.nivel_olimpiada}</span>
                  </div>
                  <h4 className="font-black text-gray-900 text-lg mb-4 line-clamp-2">{treino.titulo}</h4>
                  <button onClick={() => router.push(`/simulador/${treino.id}`)} className="w-full bg-gray-100 text-gray-900 py-3 rounded-2xl font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    Iniciar Documento
                  </button>
                </div>
              ))}
              {treinosDisponiveis.length === 0 && (
                <p className="text-sm text-gray-500 italic p-4 bg-white rounded-2xl border">Aguardando a disponibilização de provas pelo coordenador.</p>
              )}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: ACESSO POR PIN (AVALIAÇÕES DE TURMA) */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-gray-900">Avaliações Oficiais</h3>
          <div className="bg-indigo-900 p-8 rounded-3xl text-white shadow-xl">
            <p className="text-xs font-bold text-indigo-300 uppercase mb-4 tracking-widest">Sessão Presencial</p>
            <form onSubmit={acessarPorPin} className="space-y-4">
              <input type="text" placeholder="Introduzir PIN" className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-center font-mono text-2xl uppercase font-black placeholder:text-white/30 outline-none focus:bg-white/20 transition-colors" value={pin} onChange={e => setPin(e.target.value)} />
              <button type="submit" className="w-full bg-white text-indigo-900 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-50 transition-all">
                ABRIR PROVA
              </button>
            </form>
            <p className="text-[10px] text-indigo-300 mt-6 leading-relaxed opacity-70 border-t border-indigo-800 pt-4">
              O PIN da prova de turma ignora os treinos olímpicos. Certifique-se com o professor de que a sessão está aberta.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}