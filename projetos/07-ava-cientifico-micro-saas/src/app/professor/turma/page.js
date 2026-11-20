export default function ListaDeAlunosPremium() {
  const alunos = [
    { id: 1, matricula: "26001", nome: "Ana Carolina (Demonstração)", status: "Ativo", topico: "Oscilações e Ondas" },
    { id: 2, matricula: "26002", stroke: "Bruno Costa (Demonstração)", nome: "Bruno Costa (Demonstração)", status: "Ativo", topico: "Oscilações e Ondas" },
    { id: 3, matricula: "26003", nome: "Camila Rodrigues (Demonstração)", status: "Inativo", topico: "Termologia" },
    { id: 4, matricula: "26004", nome: "Daniel Ferreira (Demonstração)", status: "Ativo", topico: "Oscilações e Ondas" },
    { id: 5, matricula: "26005", nome: "Eduarda Lima (Demonstração)", status: "Ativo", topico: "Oscilações e Ondas" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-8 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto">
        
        {/* Links e Botões */}
        <div className="mb-8">
          <a href="/professor" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold mb-4 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Voltar ao Painel
          </a>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Ensino Médio</h1>
              <p className="text-slate-400 font-medium mt-1">Colégio Modelo de Ciências Aplicadas • Demonstração</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded-xl font-semibold transition-all flex items-center">
                Exportar
              </button>
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold transition-all">
                + Novo Aluno
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Informações/Tabela */}
        <div className="bg-slate-900/80 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/40">
            <input 
              type="text" 
              placeholder="Buscar aluno por nome ou matrícula..." 
              className="w-full max-w-md pl-4 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Aluno</th>
                  <th className="p-4 font-semibold">Matrícula</th>
                  <th className="p-4 font-semibold">Tópico Atual</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alunos.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white">{aluno.nome}</td>
                    <td className="p-4 text-slate-400">#{aluno.matricula}</td>
                    <td className="p-4 text-slate-400">{aluno.topico}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${aluno.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {aluno.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}