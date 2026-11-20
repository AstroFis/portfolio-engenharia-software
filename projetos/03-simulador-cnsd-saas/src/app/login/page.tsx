// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErro("");

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push("/dashboard/simuladores"); // Redireciona para o painel após o sucesso
    } catch (error) {
      setErro("Credenciais inválidas. Acesso negado ao painel de gestão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-4 shadow-md">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cofre de Comando</h1>
          <p className="text-sm text-gray-500 mt-2">Acesso restrito à coordenação pedagógica.</p>
        </div>

        {erro && <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200"><p className="text-sm text-red-600 font-bold text-center">{erro}</p></div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">E-mail Institucional</label>
            <input type="email" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Senha de Acesso</label>
            <input type="password" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white py-3.5 rounded-lg hover:bg-indigo-600 transition-colors font-bold tracking-wide shadow-md disabled:opacity-50">
            {isLoading ? "Verificando credenciais..." : "AUTENTICAR"}
          </button>
        </form>
      </div>
    </main>
  );
}