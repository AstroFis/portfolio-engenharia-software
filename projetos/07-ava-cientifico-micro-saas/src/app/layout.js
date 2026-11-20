import './globals.css'

export const metadata = {
  title: 'Portal Educacional',
  description: 'Ambiente de alta performance para ensino de Ciências Exatas',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="relative min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
        
        {/* Marca-d'água Global (Física, Matemática e Astronomia) */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full min-w-[1200px]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="math-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#math-grid)" />
            
            {/* Fórmulas e Símbolos Espalhados */}
            <text x="10%" y="15%" className="text-4xl font-serif font-bold">E = mc²</text>
            <text x="85%" y="20%" className="text-3xl font-serif font-bold">F = m·a</text>
            <text x="15%" y="80%" className="text-5xl font-serif">∫ f(x) dx</text>
            <text x="80%" y="75%" className="text-5xl font-serif">∑</text>
            <text x="50%" y="10%" className="text-3xl font-serif">λ = h / p</text>
            
            {/* Átomo / Órbitas */}
            <ellipse cx="50%" cy="50%" rx="150" ry="50" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(30 700 400)" />
            <ellipse cx="50%" cy="50%" rx="150" ry="50" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-30 700 400)" />
            <ellipse cx="50%" cy="50%" rx="150" ry="50" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(90 700 400)" />
            <circle cx="50%" cy="50%" r="15" fill="currentColor" />

            {/* Gráfico de Ondas */}
            <path d="M 100 500 Q 150 400, 200 500 T 300 500 T 400 500" fill="none" stroke="currentColor" strokeWidth="2"/>
            <line x1="80" y1="500" x2="420" y2="500" stroke="currentColor" strokeWidth="1" strokeDasharray="4"/>
            
            {/* Elementos Astronômicos */}
            <circle cx="85%" cy="85%" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 4" />
            <circle cx="85%" cy="85%" r="60" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="85%" cy="85%" r="20" fill="currentColor" />
          </svg>
        </div>

        {/* O conteúdo das suas páginas entra aqui, sempre acima do fundo */}
        <div className="relative z-10">
          {children}
        </div>

      </body>
    </html>
  )
}