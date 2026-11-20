export default function PortalDoAlunoCoerente() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Barra de Navegação Coerente */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800 hidden sm:block">
            Portal do Aluno
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </button>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-slate-700">João Pedro</div>
              <div className="text-xs text-blue-600 font-medium tracking-wide">Ensino Médio</div>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full border border-blue-100 flex items-center justify-center text-blue-700 font-bold">
              JP
            </div>
          </div>
        </div>
      </nav>

      {/* Área Principal */}
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        
        {/* Banner de Boas-vindas (Simples e Direto) */}
        <div className="bg-white rounded-3xl p-8 mb-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Sessão Ativa
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">
              Pronto para aprender hoje?
            </h1>
            <p className="text-slate-500 text-lg max-w-xl">
              Você tem um novo material de apoio no capítulo atual e um simulador liberado pelo seu professor.
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg whitespace-nowrap">
            Retomar Estudos
          </button>
        </div>

        {/* Grid de Conteúdo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card: Disciplina Principal (Coerente com o Azul do Professor) */}
          <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-blue-600 text-sm font-bold uppercase tracking-wider block mb-1">Trilha Principal</span>
                <h2 className="text-2xl font-bold text-slate-800">Física Geral</h2>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl text-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-slate-300">A1</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700">Oscilações e Ondas</h3>
                  <p className="text-sm text-slate-500 mt-1">Conceitos fundamentais, amplitude, frequência e período.</p>
                </div>
              </div>
              <div className="mt-6">
                <button className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-100 hover:text-blue-700 text-slate-600 font-semibold py-2.5 px-6 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Acessar PDF da Aula
                </button>
              </div>
            </div>
          </div>

          {/* Card: Laboratório Virtual (Coerente com o Índigo) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-indigo-600 text-sm font-bold uppercase tracking-wider block mb-1">Simulação</span>
                  <h2 className="text-xl font-bold text-slate-800">Laboratório PhET</h2>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                Teste o comportamento das ondas na prática em um ambiente interativo.
              </p>
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm">
              Abrir Simulador
            </button>
          </div>

        </div>

        {/* Zona de Alto Desempenho (Olimpíadas - Espelha o visual do professor) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="hidden md:flex w-16 h-16 bg-white/10 rounded-2xl border border-white/5 text-teal-400 items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
              </div>
              <div>
                <span className="text-teal-400 text-sm font-bold uppercase tracking-wider block mb-1">Módulo Extracurricular</span>
                <h3 className="text-2xl font-bold text-white mb-2">Preparatórios de Elite</h3>
                <p className="text-slate-400 font-medium">
                  Acesse provas e simulados focados na OBA, OBMEP, Canguru, OBGP e OLITEF.
                </p>
              </div>
            </div>
            
            <button className="whitespace-nowrap bg-white/10 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-xl border border-white/20 hover:border-transparent transition-all w-full md:w-auto">
              Acessar Módulo Extra
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}