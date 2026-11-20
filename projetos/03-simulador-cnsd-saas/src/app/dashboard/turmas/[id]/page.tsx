// src/app/dashboard/turmas/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Aluno {
  id: string;
  nome_completo: string;
  matricula: string;
  email: string;
}

export default function SalaDeAulaPage() {
  const params = useParams();
  const router = useRouter();
  const turmaId = params.id as string;

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!turmaId) return;
    const q = query(collection(db, "alunos"), where("turma_id", "==", turmaId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const alunosData: Aluno[] = [];
      querySnapshot.forEach((doc) => {
        alunosData.push({ id: doc.id, ...doc.data() } as Aluno);
      });
      alunosData.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
      setAlunos(alunosData);
    });
    return () => unsubscribe();
  }, [turmaId]);

  const handleAddAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const alunosRef = collection(db, "alunos");
      await addDoc(alunosRef, {
        nome_completo: nome,
        matricula: matricula,
        email: email,
        turma_id: turmaId,
        data_cadastro: new Date().toISOString(),
      });
      setNome("");
      setMatricula("");
      setEmail("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error);
      alert("Falha de comunicação com o banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-indigo-600 font-medium text-sm transition-colors">
          &larr; Voltar para Turmas
        </button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Alunos</h1>
          <p className="text-gray-600 mt-1">ID da Turma: <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{turmaId}</span></p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">
          + Adicionar Aluno
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {alunos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Nenhum aluno cadastrado nesta turma ainda.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alunos.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{aluno.matricula}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{aluno.nome_completo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{aluno.email || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Novo Aluno</h2>
            <form onSubmit={handleAddAluno} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Opcional)</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">{isLoading ? "Salvando..." : "Salvar Aluno"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}