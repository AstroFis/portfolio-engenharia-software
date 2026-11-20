# Portfólio de Engenharia de Software, Automação (RPA) & Inteligência Artificial

**Autor:** Lucas Drumond de Magalhães Cabral  
**Diretório de Código Sanitizado no Repositório:** `./projetos`

Este portfólio documenta os **7 sistemas e produtos tecnológicos** projetados e desenvolvidos no ecossistema de programação, abrangendo **Engenharia de Software Full-Stack**, **Automação Robótica de Processos (RPA) para Sistemas Legados**, **Sistemas Corporativos ERP/FSM**, **Plataformas SaaS em Tempo Real** e **Aplicações de Inteligência Artificial Multimodal**.

---

## 📊 Visão Geral da Arquitetura do Portfólio

| # | Projeto | Categoria | Stack Principal | Status / Entrega |
|---|---|---|---|---|
| **1** | **AutomatoForms ("Jarvizinha")** | RPA Desktop/Web + Copiloto IA | Node.js, Express 5, Puppeteer, CDP, Win32 API (`user32.dll`), Gemini API, SheetJS, `.exe` (`caxa`) | Em produção + Executável Standalone |
| **2** | **Pequim Engenharia (ERP / FSM)** | Sistema Corporativo & Field Service | React 18, TypeScript 5.6, Vite 6, Tailwind CSS, Context API Multi-Tab Real-time, Print CSS | MVP Completo c/ Dados Reais |
| **3** | **Simulador CNSD & Arena Olímpica** | SaaS Educacional Full-Stack | Next.js 16 (App Router), React 19, TypeScript, Firebase 12 (Firestore Real-time + Auth), `jsPDF` | Plataforma Full-Stack Multi-Escola |
| **4** | **PlataformaFísica (v1.0 & v1.2)** | Avaliação Adaptativa IA & Proctoring | React 18, Tailwind CSS, Firebase Firestore, Google Gemini API, Page Visibility API, SheetJS | 2 Versões em Produção + Bancos JSON |
| **5** | **Diário Escolar Inteligente (`DIARIO`)** | Web App OCR Vision & Automação | HTML5/CSS3 (Glassmorphism), ES6+, Gemini 2.5 Flash Vision (OCR), SheetJS, Node.js, Python (`pandas`) | Aplicação Web + Scripts CLI |
| **6** | **Robô Universal TOTVS (`FALTAS`)** | Biblioteca RPA Modular & Doc Técnica | Node.js, Puppeteer, SheetJS, Dotenv, Mermaid.js | Motor RPA em 6 Fases + Manual |
| **7** | **AVA Científico & PhET (`meu-micro-saas`)** | UI/UX EdTech & Simulação Científica | Next.js 16, React 19, Tailwind CSS 4, Custom Mathematical SVG + Acervo 540 Simulações HTML5 | Protótipo UI/UX Alta Fidelidade |

---

## 🚀 1. AutomatoForms ("Jarvizinha") — Copiloto & RPA Educacional com IA para TOTVS RM

- **Diretório no Repositório:** `./projetos/01-automatoforms-rpa-ia`
- **Problema Resolvido:** O portal legado **TOTVS RM Educacional (Corpore.Net)** exige dezenas de cliques manuais por turma em interfaces ASP.NET WebForms + DevExpress propensas a timeouts e erros de `NullReferenceException` no servidor ao lançar notas, faltas e planos de aula.
- **Solução de Engenharia:**
  1. **Arquitetura Split-Screen 50/50 Nativa no Windows (`screen_helper.js`):** Ao iniciar, o sistema consulta a resolução útil do monitor (`System.Windows.Forms.Screen.PrimaryScreen.WorkingArea`) e utiliza chamadas nativas **Win32 P/Invoke em C# (`user32.dll`: `MoveWindow`, `ShowWindow`, `SetForegroundWindow`)** combinadas com o **Chrome DevTools Protocol (`Browser.setWindowBounds`)** para posicionar automaticamente o Painel Web da Jarvizinha nos 50% à esquerda e o navegador do TOTVS RM nos 50% à direita.
  2. **Engenharia Reversa de Componentes DevExpress (`ASPxClientControl`):** Contorna falhas críticas de `UpdatePanels` e grids com colunas congeladas (`dxgv`) disparando eventos nativos sequenciais (`focus`, `keydown`, `input`, `keyup`, `change`, `blur`) e aguardando o término exato de cada callback AJAX antes de prosseguir.
  3. **Motor Pedagógico com IA (Google Gemini) + Matriz Bernoulli (`ia_plano_aula.js`):** Cruza o cronograma de aulas com o banco JSON raspado do Sistema Bernoulli (`banco_bernoulli_fisica.json`), gera planos de aula no padrão `[Código]: [Título]: [Subtópico BNCC]` aplicando a regra do **"Sanduíche de Avaliações"** (*Revisão $\rightarrow$ Prova $\rightarrow$ Correção*) e possui fallback determinístico offline.
  4. **Regra de Ouro do Zero & Espelhamento de Disciplinas (`leitor_notas.js`):** Higieniza nomes via normalização Unicode (`NFD`), converte notas `0` em vazio (`""`) para proteger alunos de 2ª chamada e espelha automaticamente lançamentos entre disciplinas integradas (*Física* $\leftrightarrow$ *Prática de Física*).
  5. **Distribuição Standalone (`AutomatoForms.exe`):** Empacotado em executável único para Windows via `caxa`, permitindo execução imediata sem necessidade de instalação prévia do Node.js pelo usuário final.

---

## 🏢 2. Pequim Engenharia — Sistema Corporativo ERP / FSM & Portal do Cliente

- **Diretório no Repositório:** `./projetos/02-pequim-engenharia-erp`
- **Problema Resolvido:** Substituição do controle manual baseado na planilha corporativa `AGENDA - GESTÃO OPERACIONAL.xlsx` da **Pequim Engenharia e Serviços Ltda (Belo Horizonte/MG)** por um sistema web integrado e auditável para gestão de climatização, PMOC e manutenção predial.
- **Solução de Engenharia:**
  1. **Arquitetura Tripartida com Sincronização Real-Time Multi-Aba (`AppContext.tsx`):** Oferece 3 módulos dedicados por perfil de acesso (**Coordenação & Engenharia**, **Agenda Móvel do Técnico em Campo** e **Portal do Cliente**), sincronizados instantaneamente entre abas via eventos de `storage` e sistema de notificações em tempo real (`RealtimeNotification`).
  2. **Calculadora Automática de Orçamento de Climatização:** Integrada à criação/edição de Ordens de Serviço (OS), calcula automaticamente custos de instalação de Splits, Piso Teto, Cassete, Multi-Split, metragem excedente de tubulação de cobre, furos em viga de concreto, carga de gás refrigerante e contratos PMOC.
  3. **Fluxo de Campo Mobile-First & Privacidade de Dados (`ServiceModule.tsx`):** Integração direta com rotas de GPS/Google Maps, checklist operacional em 4 passos, inclusão de materiais extras em campo e separação rigorosa entre **Parecer Técnico Público** (exibido ao cliente e impresso no PDF) e **Notas Internas Confidenciais** (restritas à engenharia).
  4. **Portal do Cliente & Gerador de Proposta A4/PDF (`ClientModule.tsx` & `OSPrintModal.tsx`):** Linha do tempo auditável (`StatusLog`), aprovação de orçamento em 1 clique, integração com WhatsApp, avaliação de atendimento (1 a 5 estrelas) e geração de Ordem de Serviço/Orçamento formatada para impressão A4/PDF.
  5. **Interoperabilidade Legada (`formatters.ts`):** Importação e exportação CSV 100% compatível com a planilha original `AGENDA - GESTÃO OPERACIONAL.xlsx`.

---

## 🏆 3. Simulador CNSD & Arena Olímpica — SaaS Educacional em Tempo Real

- **Diretório no Repositório:** `./projetos/03-simulador-cnsd-saas`
- **Problema Resolvido:** Necessidade de uma plataforma digital unificada para aplicar simulados, corrigir provas discursivas/objetivas e gerir delegações de alunos em Olimpíadas Científicas Nacionais (OBA, OBMEP, Canguru, OLITEF) para o **Colégio Nossa Senhora das Dores (CNSD)** e **Colégio Auge**.
- **Solução de Engenharia:**
  1. **Persistência Cloud em Tempo Real (Next.js 16 + Firebase 12):** Sincronização instantânea de turmas, alunos, simulados, submissões e resultados olímpicos utilizando listeners `onSnapshot` do Firestore.
  2. **Importação Massiva CSV com `writeBatch` & Credenciais LGPD:** Faz parsing local de arquivos CSV, valida matrículas duplicadas e executa gravações atômicas em lote no Firestore, gerando senhas individuais baseadas na data de nascimento (`DDMMAAAA`).
  3. **"Forja" de Avaliações Dual-Mode & Correção Híbrida:** Criação de provas regulares por turma (`AVAL-XXXX`) ou treinos olímpicos por nível (`OLX-XXXX`), com cronômetro regressivo, modo de exibição em cascata ou paginado, correção automática de múltipla escolha e painel docente para atribuição de notas em questões abertas.
  4. **Motor de Relatórios e Boletins Individuais em PDF (`jsPDF` + `jspdf-autotable`):** Exportação imediata do Relatório Geral da Turma e de Boletins Individuais com cabeçalho institucional dinâmico (CNSD ou Colégio Auge) e detalhamento questão a questão.
  5. **Gestão de Delegações Olímpicas e Quadro de Honra:** Controle completo de fases e premiações (*Ouro, Prata, Bronze, Menção Honrosa*) com geração automática do Quadro de Honra Acadêmica.

---

## ⚛️ 4. PlataformaFísica (v1.0 & v1.2) — Avaliação Adaptativa com IA & Proctoring Anti-Cola

- **Diretório no Repositório:** `./projetos/04-plataforma-fisica-ia`
- **Problema Resolvido:** Disponibilizar um ambiente de estudo autônomo infinito para alunos do Ensino Médio (1ª a 3ª série — Matriz Bernoulli) e um sistema seguro de provas online com monitoramento de foco de tela.
- **Solução de Engenharia:**
  1. **Geração Adaptativa de Questões via IA + Bancos JSON Estruturados:** Além de contar com bancos locais curados (`questões_aluno_em1.json`, `em2`, `em3`), integra a API Google Gemini com fallback automático entre múltiplos modelos (`gemini-2.5-flash-preview` $\rightarrow$ `gemini-2.0-flash` $\rightarrow$ `gemini-1.5-flash`) para gerar questões inéditas contextualizadas por Frente e Capítulo.
  2. **Sistema Proctoring Anti-Cola (`Page Visibility API`):** Monitora eventos `visibilitychange` durante avaliações oficiais cronometradas; qualquer troca de aba ou janela emite alerta imediato e incrementa o contador auditável `alertasCola` no painel do professor.
  3. **Carrinho Docente de Tópicos, Controle de Tentativas e Exportação Multi-Aba (`v1.2`):** Permite compor avaliações mesclando diversos capítulos e níveis de dificuldade, limitar o número máximo de tentativas por aluno, diagnosticar gargalos de aprendizagem por atividade e exportar a pauta completa em `.xlsx` com uma aba separada para cada turma via `SheetJS`.

---

## 📸 5. Diário Escolar Inteligente (`DIARIO`) — OCR Multimodal & Planejamento Automatizado

- **Diretório no Repositório:** `./projetos/05-diario-escolar-ocr-vision`
- **Problema Resolvido:** Converter fotos/prints de horários escolares e matrizes extensas de capítulos em cronogramas aula a aula prontos para lançamento.
- **Solução de Engenharia:**
  1. **OCR Estruturado com Gemini Vision (`callGeminiVisionAPI`):** Extrai tabelas de horários diretamente de imagens (`.png`/`.jpg`) retornando JSON tipado (`responseMimeType: "application/json"`).
  2. **Cruzamento Automatizado com Matrizes Excel (SheetJS + Python `pandas`):** Lê os arquivos `.xlsx` de capítulos do Bernoulli (`EM1`, `EM2`, `EM3`), filtra pelas frentes selecionadas e distribui o conteúdo pedagógico exatamente nos dias letivos disponíveis, com edição *in-place* (`contenteditable`) e exportação `.xlsx`.

---

## 🤖 6. Robô Universal TOTVS (`FALTAS`) & 7. AVA Científico (`meu-micro-saas` + `Htmls Físicos`)

- **`FALTAS` (`robo_totvs_universal.js` + `ROTEIRO_ECOSSISTEMA_TOTVS.md`):** Arquitetura modular de RPA documentada em **6 fases** (Contextualização, Login Universal, Leitor Inteligente de Excel, Estabilizador de Callbacks DevExpress `esperaSegura`, Injeção com Regra do Zero e Interceptador de Pop-ups `page.on('dialog')`).
- **`meu-micro-saas` & `Htmls Físicos`:** Protótipo de alta fidelidade em **Next.js 16 + Tailwind CSS 4** com interface *Bento Box Dark Mode*, ilustrações matemáticas/físicas em código **SVG vetorial puro** (órbitas, funções, ondas $\lambda$) e integração planejada com **Oficina PhET** e um acervo local de **540 simulações interativas em HTML5/JS** de Física, Química, Matemática e Astronomia (`Natur-fysik-kemi-mat-Animationer.zip`).
