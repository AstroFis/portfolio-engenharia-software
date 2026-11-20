export default function TelaDeLogin() {
  return (
    <div className="min-h-screen flex bg-transparent">
      
      {/* Lado Esquerdo - Institucional (Chamativo) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden shadow-2xl">
        {/* Efeito de iluminação no fundo escuro */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-teal-500/10 pointer-events-none"></div>
        
        {/* Espaço para sua Logomarca */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black text-2xl shadow-lg">
            {/* Substitua a letra M pela sua imagem/logo futuramente */}
            M
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">
            [Nome do Sistema]
          </span>
        </div>

        {/* Descrição e Proposta de Valor */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            A ciência é o motor <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              que transforma o futuro.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Acesse o seu ambiente virtual de aprendizagem. Laboratórios interativos, conteúdos aprofundados e preparação de alto rendimento para as olimpíadas científicas (OBA, OBMEP, Canguru e OLITEF).
          </p>
          
          <div className="flex gap-4">
            <div className="flex -space-x-4">
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-600"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-500"></div>
            </div>
            <p className="text-sm text-slate-500 font-medium flex items-center">
              Junte-se às turmas ativas.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © 2026 Plataforma Educacional. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado Direito - Formulário de Acesso */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-200">
          
          <div className="text-center mb-10">
            {/* Logo Mobile (Só aparece em telas pequenas) */}
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md mx-auto mb-4 lg:hidden">
              M
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Bem-vindo de volta</h2>
            <p className="text-slate-500 mt-2 font-medium">Selecione o seu perfil para entrar na plataforma</p>
          </div>

          <div className="space-y-4">
            <button className="w-full flex items-center justify-between bg-white hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 text-slate-700 hover:text-blue-700 font-bold py-4 px-6 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <span>Acesso do Professor</span>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>

            <button className="w-full flex items-center justify-between bg-white hover:bg-teal-50 border-2 border-slate-100 hover:border-teal-200 text-slate-700 hover:text-teal-700 font-bold py-4 px-6 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 group-hover:bg-teal-100 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v6.5"></path></svg>
                </div>
                <span>Acesso do Aluno</span>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
            Ambiente seguro com criptografia de ponta a ponta.
          </div>

        </div>
      </div>

    </div>
  );
}