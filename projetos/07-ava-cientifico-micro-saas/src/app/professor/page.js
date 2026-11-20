export default function PainelDoProfessorPremium() {
  return (
    <div className="min-h-screen bg-slate-950 flex p-4 font-sans text-slate-200">

      {/* Sidebar com Identidade Coerente e SVG Visível */}
      <aside className="w-20 lg:w-64 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 flex flex-col justify-between overflow-hidden transition-all duration-300 relative group">
        
        {/* Marca-d'água Científica Ajustada para Alta Visibilidade no Dark Mode */}
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 pointer-events-none transition-opacity duration-500 overflow-hidden select-none text-slate-700">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-dark" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dark)" />
            <line x1="20" y1="200" x2="190" y2="60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4"/>
            <text x="160" y="50" className="text-xs font-serif font-bold fill-current">f(x)</text>
            <circle cx="50" cy="450" r="100" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="450" r="60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4" />
            <circle cx="120" cy="380" r="5" fill="currentColor" />
            <path d="M 0 650 Q 30 610, 60 650 T 120 650 T 180 650" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <text x="10" y="590" className="text-[10px] font-mono fill-current">λ (Ondas)</text>
            <text x="140" y="250" className="text-lg font-serif fill-current">∑</text>
            <text x="30" y="280" className="text-lg font-sans fill-current">π</text>
          </svg>
        </div>

        {/* Links do Menu */}
        <div className="relative z-10">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center lg:justify-start lg:px-8">
            <span className="text-white font-extrabold text-2xl tracking-tight">M<span className="hidden lg:inline">icroSaaS</span></span>
          </div>
          
          <nav className="p-4 space-y-2 mt-4">
            <a href="#" className="flex items-center gap-4 p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl font-bold transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              <span className="hidden lg:block">Visão Geral</span>
            </a>
            <a href="/professor/turma" className="flex items-center gap-4 p-3 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-2xl font-semibold transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              <span className="hidden lg:block">Alunos</span>
            </a>
            <a href="#" className="flex items-center gap-4 p-3 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-2xl font-semibold transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="hidden lg:block">Frequência</span>
            </a>
            <a href="#" className="flex items-center gap-4 p-3 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-2xl font-semibold transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              <span className="hidden lg:block">Oficina PhET</span>
            </a>
          </nav>
        </div>
        
        <div className="p-4 relative z-10">
          <div className="w-full h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
        </div>
      </aside>

      {/* Área Central Bento Box Dark */}
      <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-4 overflow-y-auto">
        <header className="flex justify-between items-center mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Turmas Ativas</h1>
            <p className="text-slate-400 font-medium mt-2">Visão geral do seu ambiente educacional científico.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:-translate-y-0.5 transition-all">
            + Nova Turma
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card Fundamental */}
          <div className="bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-800 hover:border-blue-500/40 transition-all group relative overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4"></div>
            <h3 className="font-bold text-2xl text-white">Fundamental 2</h3>
            <p className="text-blue-400 font-bold text-sm mb-4">Colégio Auge</p>
            <div className="flex items-end justify-between mt-8">
              <div>
                <span className="text-4xl font-black text-white">32</span>
                <span className="text-slate-400 font-medium ml-2">Alunos</span>
              </div>
              <div className="w-12 h-12 bg-slate-800 text-white group-hover:bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl transition-all border border-slate-700 group-hover:border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </div>

          {/* Card Ensino Médio */}
          <div className="bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-800 hover:border-indigo-500/40 transition-all group relative overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4"></div>
            <h3 className="font-bold text-2xl text-white">Ensino Médio</h3>
            <p className="text-indigo-400 font-bold text-sm mb-4">N. S. das Dores</p>
            <div className="flex items-end justify-between mt-8">
              <div>
                <span className="text-4xl font-black text-white">28</span>
                <span className="text-slate-400 font-medium ml-2">Alunos</span>
              </div>
              <div className="w-12 h-12 bg-slate-800 text-white group-hover:bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xl transition-all border border-slate-700 group-hover:border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </div>

          {/* Card Olimpíadas */}
          <div className="bg-slate-900/40 p-6 rounded-3xl shadow-xl border border-slate-800 hover:border-teal-500/40 transition-all group relative overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-bl-full -mr-8 -mt-8"></div>
            <h3 className="font-bold text-2xl text-white">Olimpíadas</h3>
            <p className="text-teal-400 font-bold text-sm mb-4">OBA, OBMEP, Canguru...</p>
            <div className="flex items-end justify-between mt-8">
              <div>
                <span className="text-4xl font-black text-white">45</span>
                <span className="text-slate-400 font-medium ml-2">Inscritos</span>
              </div>
              <div className="w-12 h-12 bg-slate-800 text-white group-hover:bg-teal-500 rounded-full flex items-center justify-center font-bold text-xl transition-all border border-slate-700 group-hover:border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}