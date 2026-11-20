// src/components/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Limpa erros de tentativas anteriores

    try {
      // Tenta conectar no Firebase com os dados digitados
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Usuário autenticado:", userCredential.user.email);
      router.push("/dashboard");
      
      // Nas próximas etapas, substituiremos o alert pelo redirecionamento para o Dashboard
    } catch (err: any) {
      console.error("Falha na autenticação:", err);
      setError("Credenciais inválidas. Verifique seu e-mail e senha.");
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Acesso ao Sistema</h2>
        <p className="mt-2 text-sm text-gray-600">Área exclusiva para professores e alunos</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="email-address" className="sr-only">Endereço de E-mail</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-none rounded-t-md focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="E-mail institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-none rounded-b-md focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Bloco condicional para exibir o erro na tela */}
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-100 rounded border border-red-200">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            className="relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}