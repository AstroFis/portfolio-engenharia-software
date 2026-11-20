let turmasGlobais = [];
let alunosFreqAtuais = [];
let notasCarregadas = null;

function addLog(msg, tipo = 'info') {
  const logEl = document.getElementById('terminalLog');
  const p = document.createElement('p');
  const hora = new Date().toLocaleTimeString('pt-BR');
  p.className = tipo === 'erro' ? 'text-rose-400' : (tipo === 'sucesso' ? 'text-emerald-400' : 'text-slate-300');
  p.innerHTML = `<span class="text-slate-500">[${hora}]</span> ${msg}`;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

function toggleSenha() {
  const pass = document.getElementById('loginPass');
  const icone = document.getElementById('iconeOlho');
  if (pass.type === 'password') {
    pass.type = 'text';
    icone.className = 'ph ph-eye-slash';
  } else {
    pass.type = 'password';
    icone.className = 'ph ph-eye';
  }
}

function mudarAba(aba) {
  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-50', 'text-indigo-700', 'font-semibold');
    btn.classList.add('text-slate-600', 'font-medium');
  });

  document.getElementById('abaTurmas').classList.add('hidden');
  document.getElementById('abaFrequencia').classList.add('hidden');
  document.getElementById('abaNotas').classList.add('hidden');
  const abaD = document.getElementById('abaDiario');
  if (abaD) abaD.classList.add('hidden');

  if (aba === 'turmas') {
    document.getElementById('abaTurmas').classList.remove('hidden');
    document.getElementById('abaBtnTurmas').classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
  } else if (aba === 'frequencia') {
    document.getElementById('abaFrequencia').classList.remove('hidden');
    document.getElementById('abaBtnFrequencia').classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
  } else if (aba === 'notas') {
    document.getElementById('abaNotas').classList.remove('hidden');
    document.getElementById('abaBtnNotas').classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
  } else if (aba === 'diario') {
    if (abaD) abaD.classList.remove('hidden');
    const btnD = document.getElementById('abaBtnDiario');
    if (btnD) btnD.classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
  }
}

async function checarStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.conectado) {
      document.getElementById('statusDot').className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50';
      document.getElementById('statusTexto').innerText = `Conectado: ${data.usuario || 'Professor'}`;
      document.getElementById('btnDesconectar').classList.remove('hidden');
      document.getElementById('secaoLogin').classList.add('hidden');
      document.getElementById('secaoDashboard').classList.remove('hidden');
      carregarTurmas();
    }
  } catch (e) {}
}

async function organizarLadoALado() {
  try {
    const screenWidth = window.screen.availWidth || 2560;
    const screenHeight = window.screen.availHeight || 1392;
    await fetch('/api/chrome/organizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenWidth, screenHeight })
    });
    addLog('Janelas organizadas: Jarvizinha na esquerda e TOTVS RM na direita.', 'sucesso');
  } catch (e) {
    addLog(`Erro ao posicionar janelas: ${e.message}`, 'erro');
  }
}

async function focarTotvs() {
  try {
    await fetch('/api/chrome/focar', { method: 'POST' });
    addLog('Janela do TOTVS RM trazida para a frente da tela.', 'sucesso');
  } catch (e) {
    addLog(`Erro: ${e.message}`, 'erro');
  }
}

async function fazerLogin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const btn = document.getElementById('btnEntrar');

  const msgAguardando = document.getElementById('msgAguardandoConexao');
  if (msgAguardando) msgAguardando.classList.remove('hidden');

  btn.disabled = true;
  btn.innerHTML = `<i class="ph ph-spinner animate-spin text-lg"></i> Conectando...`;
  addLog(`Iniciando autenticação para o usuário ${user}...`);

  try {
    const screenWidth = window.screen.availWidth || 2560;
    const screenHeight = window.screen.availHeight || 1392;
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass, screenWidth, screenHeight })
    });
    const data = await res.json();

    if (data.sucesso) {
      addLog(`Login efetuado com sucesso! Abrindo tela de turmas...`, 'sucesso');
      checarStatus();
    } else {
      if (msgAguardando) msgAguardando.classList.add('hidden');
      addLog(`Falha no login: ${data.erro}`, 'erro');
      alert(`Erro: ${data.erro}`);
    }
  } catch (err) {
    if (msgAguardando) msgAguardando.classList.add('hidden');
    addLog(`Erro de conexão com o servidor: ${err.message}`, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ph-bold ph-sign-in"></i> Conectar e Abrir Diário`;
  }
}

async function carregarTurmas(forcar = false) {
  const container = document.getElementById('listaTurmasContainer');
  if (!forcar && turmasGlobais.length > 0) {
    // Já possui turmas em memória, renderiza instantâneo sem congelar o TOTVS
    renderizarTurmasCards();
    return;
  }

  container.innerHTML = `
    <div class="col-span-full py-12 text-center text-slate-400">
      <i class="ph ph-spinner animate-spin text-3xl mb-2 text-indigo-500"></i>
      <p class="text-sm">Identificando turmas do professor no TOTVS...</p>
    </div>
  `;
  addLog('Lendo turmas do Diário de Classe...');

  try {
    const res = await fetch('/api/turmas');
    const data = await res.json();
    turmasGlobais = data.turmas || [];

    if (turmasGlobais.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center py-8 text-slate-500">Nenhuma turma encontrada.</div>`;
      return;
    }

    addLog(`${turmasGlobais.length} turmas identificadas com sucesso!`, 'sucesso');
    renderizarTurmasCards();
  } catch (err) {
    addLog(`Erro ao carregar turmas: ${err.message}`, 'erro');
  }
}

function renderizarTurmasCards() {
  const container = document.getElementById('listaTurmasContainer');
  container.innerHTML = turmasGlobais.map(t => `
    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">Turma #${t.indice}</span>
        </div>
        <h3 class="font-bold text-slate-800 text-sm leading-snug">${t.texto}</h3>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
        <button onclick="selecionarParaFreq('${t.value}')" class="flex-1 min-w-[70px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1">
          <i class="ph-bold ph-calendar-check"></i> Faltas
        </button>
        <button onclick="selecionarParaNotas('${t.value}')" class="flex-1 min-w-[70px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1">
          <i class="ph-bold ph-exam"></i> Notas
        </button>
        <button onclick="selecionarParaPlano('${t.value}')" class="flex-1 min-w-[80px] bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1 border border-amber-200/60">
          <i class="ph-bold ph-sparkle text-amber-600"></i> Plano IA
        </button>
      </div>
    </div>
  `).join('');

  const options = turmasGlobais.map(t => `<option value="${t.value}">${t.texto}</option>`).join('');
  document.getElementById('selectTurmaFreq').innerHTML = options;
  document.getElementById('selectTurmaNotas').innerHTML = options;
  const selDiario = document.getElementById('selectTurmaDiario');
  if (selDiario) {
    selDiario.innerHTML = options;
    filtrarCapitulosPorTurma();
  }
}

function selecionarParaFreq(val) {
  document.getElementById('selectTurmaFreq').value = val;
  mudarAba('frequencia');
  abrirGradeFrequencia();
}

function selecionarParaNotas(val) {
  document.getElementById('selectTurmaNotas').value = val;
  mudarAba('notas');
}

function selecionarParaPlano(val) {
  const selDiario = document.getElementById('selectTurmaDiario');
  if (selDiario) {
    selDiario.value = val;
    filtrarCapitulosPorTurma();
  }
  mudarAba('diario');
  abrirPlanoAulaTOTVS();
}

async function abrirGradeFrequencia() {
  const turmaValor = document.getElementById('selectTurmaFreq').value;
  const tObj = turmasGlobais.find(t => t.value === turmaValor);
  const card = document.getElementById('cardAlunosFreq');
  const tbody = document.getElementById('tabelaAlunosFreqBody');

  addLog(`Carregando grade de frequência para ${tObj ? tObj.texto : 'a turma'}...`);
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-400"><i class="ph ph-spinner animate-spin text-2xl text-indigo-500 mb-2"></i><br>Acessando diário e aplicando Raio Azul...</td></tr>`;
  card.classList.remove('hidden');

  try {
    const res = await fetch('/api/frequencia/abrir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turmaValor })
    });
    const data = await res.json();
    alunosFreqAtuais = data.alunos || [];

    document.getElementById('nomeTurmaAtivaFreq').innerText = tObj ? tObj.texto : 'Turma';
    document.getElementById('badgeQtdAlunos').innerText = `${alunosFreqAtuais.length} alunos`;

    if (alunosFreqAtuais.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-500">Nenhum aluno identificado na grade.</td></tr>`;
      return;
    }

    tbody.innerHTML = alunosFreqAtuais.map(a => `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4 text-center font-bold text-slate-400">${String(a.indice).padStart(2, '0')}</td>
        <td class="py-3 px-4 font-semibold text-slate-800">${a.nome}</td>
        <td class="py-3 px-4 text-xs font-mono text-slate-500">${a.ra}</td>
        <td class="py-3 px-4 text-center">
          <input type="checkbox" id="check_${a.ra}" class="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer">
        </td>
      </tr>
    `).join('');

    addLog(`${alunosFreqAtuais.length} alunos carregados na lista. Marque as faltas desejadas.`, 'sucesso');
  } catch (err) {
    addLog(`Erro ao abrir frequência: ${err.message}`, 'erro');
  }
}

function marcarTodosPresentes() {
  alunosFreqAtuais.forEach(a => {
    const cb = document.getElementById(`check_${a.ra}`);
    if (cb) cb.checked = false;
  });
  addLog('Todas as caixas de falta foram desmarcadas (100% presentes).');
}

async function salvarFrequencia() {
  const turmaValor = document.getElementById('selectTurmaFreq').value;
  const faltosos = [];

  alunosFreqAtuais.forEach(a => {
    const cb = document.getElementById(`check_${a.ra}`);
    if (cb && cb.checked) {
      faltosos.push({ ra: a.ra, nome: a.nome });
    }
  });

  const confirma = confirm(`Deseja gravar a frequência no TOTVS com ${faltosos.length} falta(s) registrada(s)?`);
  if (!confirma) return;

  addLog(`Gravando frequência no TOTVS (${faltosos.length} ausências)...`);

  try {
    const res = await fetch('/api/frequencia/salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turmaValor, faltosos })
    });
    const data = await res.json();
    if (data.sucesso) {
      addLog(`Frequência gravada e salva no TOTVS com sucesso!`, 'sucesso');
      alert('Frequência salva com sucesso no TOTVS!');
    } else {
      addLog(`Erro ao salvar frequência: ${data.erro}`, 'erro');
    }
  } catch (e) {
    addLog(`Erro: ${e.message}`, 'erro');
  }
}

// DRAG AND DROP EXCEL
async function processarArquivoExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('planilha', file);

  addLog(`Lendo planilha ${file.name}...`);
  try {
    const res = await fetch('/api/notas/ler-excel', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    notasCarregadas = data.notas;

    const lista = Object.entries(notasCarregadas);
    document.getElementById('previewNotasContainer').classList.remove('hidden');
    document.getElementById('previewTituloNotas').innerText = `${lista.length} Alunos Identificados na Planilha`;

    document.getElementById('tabelaPreviewNotas').innerHTML = lista.map(([nome, nota]) => `
      <tr class="hover:bg-slate-50">
        <td class="py-2 px-3 font-medium text-slate-700">${nome}</td>
        <td class="py-2 px-3 text-right font-bold ${nota ? 'text-indigo-600' : 'text-slate-400 italic'}">
          ${nota !== null ? Number(nota).toFixed(2).replace('.', ',') : 'EM BRANCO (Ausente)'}
        </td>
      </tr>
    `).join('');

    addLog(`Planilha carregada com sucesso! ${lista.length} notas prontas.`, 'sucesso');
  } catch (err) {
    addLog(`Erro ao ler planilha: ${err.message}`, 'erro');
  }
}

async function iniciarEnvioNotas() {
  if (!notasCarregadas) return alert('Carregue uma planilha primeiro.');
  const turmaValor = document.getElementById('selectTurmaNotas').value;
  const avaliacao = document.getElementById('selectAvaliacao').value;

  const confirma = confirm(`Deseja iniciar a injeção ao vivo das notas na turma selecionada (${avaliacao})?`);
  if (!confirma) return;

  addLog(`Iniciando injeção de notas no TOTVS... Acompanhe na janela ao lado!`);

  try {
    const res = await fetch('/api/notas/lancar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turmaValor, avaliacao, notas: notasCarregadas })
    });
    const data = await res.json();
    if (data.sucesso) {
      addLog(`Notas injetadas com sucesso! ${data.totalLancados} preenchidos.`, 'sucesso');
      alert('Notas lançadas e salvas com sucesso no TOTVS!');
    } else {
      addLog(`Erro no lançamento: ${data.erro}`, 'erro');
    }
  } catch (e) {
    addLog(`Erro: ${e.message}`, 'erro');
  }
}

// MÓDULO PLANO DE AULA COM IA & INTEGRAÇÃO TOTVS
let aulasPlanoGeradas = [];
let matrizBernoulli = [];
let aulasExistentesNoTotvs = [];

async function carregarMatrizBernoulli() {
  try {
    const res = await fetch('/api/plano-aula/bernoulli');
    const data = await res.json();
    matrizBernoulli = data.bernoulli || [];
    filtrarCapitulosPorTurma();
  } catch (e) {}
}

function detectarSerieTurma(nomeTurma) {
  if (!nomeTurma) return null;
  const n = nomeTurma.toLowerCase();
  if (n.includes('1º') || n.includes('1o') || n.includes('103') || n.includes('104') || n.includes('1ª') || n.includes('em1')) {
    return '1ª Série';
  }
  if (n.includes('2º') || n.includes('2o') || n.includes('203') || n.includes('204') || n.includes('2ª') || n.includes('em2')) {
    return '2ª Série';
  }
  if (n.includes('3º') || n.includes('3o') || n.includes('205') || n.includes('207') || n.includes('3ª') || n.includes('4v')) {
    return '3ª Série';
  }
  return null;
}

function filtrarCapitulosPorTurma() {
  const selectTurma = document.getElementById('selectTurmaDiario');
  const selectCap = document.getElementById('selectCapituloBernoulli');
  if (!selectCap) return;

  if (matrizBernoulli.length === 0) {
    selectCap.innerHTML = `<option value="">Matriz Bernoulli não carregada</option>`;
    return;
  }

  const turmaValor = selectTurma ? selectTurma.value : '';
  const turmaObj = turmasGlobais.find(t => t.value === turmaValor);
  const nomeTurma = turmaObj ? turmaObj.texto : '';
  const serie = detectarSerieTurma(nomeTurma);

  let filtrados = matrizBernoulli;
  let labelFiltro = 'Todas as séries';

  if (serie === '1ª Série') {
    filtrados = matrizBernoulli.filter(b => b.metadados.includes('1ª Série') || b.metadados.includes('EM1'));
    labelFiltro = '1ª Série (EM1)';
  } else if (serie === '2ª Série') {
    filtrados = matrizBernoulli.filter(b => b.metadados.includes('2ª Série') || b.metadados.includes('EM2'));
    labelFiltro = '2ª Série (EM2)';
  } else if (serie === '3ª Série') {
    filtrados = matrizBernoulli.filter(b => b.metadados.includes('3ª Série') || b.metadados.includes('4V'));
    labelFiltro = '3ª Série (4V)';
  }

  if (filtrados.length === 0) {
    selectCap.innerHTML = `<option value="">Nenhum capítulo encontrado para ${labelFiltro}</option>`;
    return;
  }

  selectCap.innerHTML = `<option value="">-- Escolha um capítulo (${labelFiltro} - ${filtrados.length} disponíveis) --</option>` +
    filtrados.map(b => `<option value="${b.codigo}: ${b.titulo}" data-codigo="${b.codigo}" data-titulo="${b.titulo}" data-serie="${serie || ''}">${b.codigo}: ${b.titulo} (${b.metadados.split('–')[0].trim()})</option>`).join('');
}

function selecionouCapituloBernoulli() {
  const select = document.getElementById('selectCapituloBernoulli');
  if (!select) return;
  const val = select.value;
  if (!val) return;
  document.getElementById('promptPlanoAula').value = val;
  addLog(`Capítulo Bernoulli selecionado: ${val}`);
}

async function abrirPlanoAulaTOTVS() {
  const turmaValor = document.getElementById('selectTurmaDiario').value;
  const etapaIndex = document.getElementById('selectEtapaDiario').value;
  const btn = document.getElementById('btnAbrirDiarioTOTVS');
  const card = document.getElementById('cardStatusDiario');

  if (!turmaValor) return alert('Selecione uma turma primeiro.');

  const tObj = turmasGlobais.find(t => t.value === turmaValor);
  btn.disabled = true;
  btn.innerHTML = `<i class="ph ph-spinner animate-spin text-sm"></i> Sincronizando...`;

  addLog(`Abrindo Diário de Classe no TOTVS para ${tObj ? tObj.texto : 'a turma'}...`);

  try {
    const res = await fetch('/api/plano-aula/abrir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turmaValor, etapaIndex })
    });
    const data = await res.json();

    if (!data.sucesso) {
      addLog(`Erro ao abrir diário no TOTVS: ${data.erro}`, 'erro');
      alert(`Erro: ${data.erro}`);
      return;
    }

    const info = data.info;
    aulasExistentesNoTotvs = info.aulasExistentes || [];

    card.classList.remove('hidden');
    document.getElementById('badgeInfoDiario').innerText = `${info.totalAulas} aulas na etapa (${info.totalPreenchidas} preenchidas)`;
    document.getElementById('txtUltimaPreenchida').innerText = info.ultimaPreenchida ? `Aula #${info.ultimaPreenchida}` : 'Nenhuma aula registrada';
    document.getElementById('txtProximaSugerida').innerText = `Aula #${info.proximaVazia}`;

    // Atualiza automaticamente o campo de aula inicial com a próxima aula sugerida!
    document.getElementById('inputAulaInicial').value = info.proximaVazia;

    // Preenche lista de aulas já existentes
    const containerExistentes = document.getElementById('listaAulasExistentes');
    if (aulasExistentesNoTotvs.length === 0) {
      containerExistentes.innerHTML = `<p class="text-slate-400 text-center py-2">Nenhuma aula encontrada nesta etapa.</p>`;
    } else {
      containerExistentes.innerHTML = aulasExistentesNoTotvs.map(a => `
        <div class="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs ${a.conteudo ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-100'} px-2 py-0.5 rounded">#${a.num}</span>
            <span class="text-[11px] text-slate-500 font-mono">${a.data}</span>
          </div>
          <span class="text-[11px] ${a.conteudo ? 'text-slate-700 font-medium' : 'text-slate-400 italic'} truncate max-w-xs text-right">
            ${a.conteudo || 'Em branco (não preenchida)'}
          </span>
        </div>
      `).join('');
    }

    addLog(`Diário carregado! Próxima aula a lançar identificada: Aula #${info.proximaVazia}.`, 'sucesso');
  } catch (err) {
    addLog(`Erro de conexão: ${err.message}`, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ph-bold ph-arrow-square-in"></i> Abrir & Ler TOTVS`;
  }
}

function toggleAulasExistentes() {
  const lista = document.getElementById('listaAulasExistentes');
  const icone = document.getElementById('iconeToggleAulas');
  const btnTxt = document.getElementById('btnTxtVerExistentes');
  if (lista.classList.contains('hidden')) {
    lista.classList.remove('hidden');
    icone.className = 'ph-bold ph-caret-up';
    btnTxt.innerText = 'Ocultar aulas já registradas';
  } else {
    lista.classList.add('hidden');
    icone.className = 'ph-bold ph-caret-down';
    btnTxt.innerText = 'Ver aulas já registradas nesta etapa';
  }
}

async function gerarPlanoComIA() {
  const prompt = document.getElementById('promptPlanoAula').value.trim();
  const aulaInicial = document.getElementById('inputAulaInicial').value;
  const qtdAulas = document.getElementById('inputQtdAulas').value;
  const selectCap = document.getElementById('selectCapituloBernoulli');
  const optSel = selectCap && selectCap.selectedIndex >= 0 ? selectCap.options[selectCap.selectedIndex] : null;
  const capituloCodigo = optSel ? optSel.getAttribute('data-codigo') || '' : '';
  const capituloTitulo = optSel ? optSel.getAttribute('data-titulo') || '' : '';
  
  const turmaValor = document.getElementById('selectTurmaDiario').value;
  const tObj = turmasGlobais.find(t => t.value === turmaValor);
  const serie = detectarSerieTurma(tObj ? tObj.texto : '');
  const incluirAvaliacao = document.getElementById('selectTipoAvaliacao').value;
  const btn = document.getElementById('btnGerarPlanoIA');

  if (!prompt && !capituloCodigo && !capituloTitulo) {
    return alert('Por favor, selecione um capítulo da matriz Bernoulli ou digite o tema das aulas.');
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="ph ph-spinner animate-spin text-base"></i> Gerando cronograma...`;
  addLog(`Estruturando ${qtdAulas} aulas a partir da aula #${aulaInicial} no padrão da escola (${serie || 'Geral'})...`);

  try {
    const res = await fetch('/api/plano-aula/gerar-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aulaInicial,
        qtdAulas,
        capituloCodigo,
        capituloTitulo: capituloTitulo || prompt,
        serie,
        incluirAvaliacao
      })
    });
    const data = await res.json();
    aulasPlanoGeradas = data.plano || [];

    if (aulasPlanoGeradas.length === 0) {
      addLog('Nenhuma aula retornada pela IA.', 'erro');
      return;
    }

    const cardPreview = document.getElementById('cardPreviewPlano');
    cardPreview.classList.remove('hidden');
    document.getElementById('badgeQtdAulasGeradas').innerText = `${aulasPlanoGeradas.length} aulas estruturadas`;
    setTimeout(() => {
      cardPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    const container = document.getElementById('listaAulasContainer');
    container.innerHTML = aulasPlanoGeradas.map((a, idx) => `
      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:border-indigo-300 transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
            <i class="ph-bold ph-chalkboard"></i> Aula #${a.num}
          </span>
          <span class="text-[10px] text-slate-400 font-mono">Conteúdo Efetivo</span>
        </div>
        <textarea id="textoAula_${idx}" data-num="${a.num}" rows="2" class="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition resize-none font-medium text-slate-700">${a.text}</textarea>
      </div>
    `).join('');

    addLog(`Cronograma pedagógico gerado com sucesso! Revise os textos antes de injetar.`, 'sucesso');
  } catch (err) {
    addLog(`Erro ao gerar plano: ${err.message}`, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ph-bold ph-sparkle text-amber-300"></i> Gerar Cronograma Pedagógico`;
  }
}

async function injetarPlanoTOTVS() {
  const turmaValor = document.getElementById('selectTurmaDiario').value;
  const etapaIndex = document.getElementById('selectEtapaDiario').value;
  if (!turmaValor) return alert('Selecione uma turma primeiro.');

  // Coleta as aulas com as revisões feitas pelo professor
  const aulasParaInjetar = [];
  const container = document.getElementById('listaAulasContainer');
  const textareas = container.querySelectorAll('textarea[id^="textoAula_"]');
  textareas.forEach(ta => {
    aulasParaInjetar.push({
      num: parseInt(ta.getAttribute('data-num'), 10),
      text: ta.value.trim()
    });
  });

  if (aulasParaInjetar.length === 0) {
    return alert('Nenhuma aula para injetar.');
  }

  const confirma = confirm(`Deseja iniciar a injeção automática de ${aulasParaInjetar.length} aula(s) diretamente no Diário de Classe do TOTVS RM?`);
  if (!confirma) return;

  const btn = document.getElementById('btnInjetarPlano');
  btn.disabled = true;
  btn.innerHTML = `<i class="ph ph-spinner animate-spin text-sm"></i> Injetando ao vivo...`;

  addLog(`Iniciando injeção de ${aulasParaInjetar.length} aula(s) no TOTVS RM. Acompanhe na Visão ao Vivo ao lado!`);

  try {
    const res = await fetch('/api/plano-aula/injetar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turmaValor, etapaIndex, aulas: aulasParaInjetar })
    });
    const data = await res.json();
    if (data.sucesso) {
      addLog(`Plano de aula injetado e salvo com sucesso no TOTVS RM!`, 'sucesso');
      alert('Plano de aula preenchido e gravado com sucesso no TOTVS RM!');
      // Atualiza a visualização do diário
      abrirPlanoAulaTOTVS();
    } else {
      addLog(`Erro na injeção do plano: ${data.erro}`, 'erro');
      alert(`Erro: ${data.erro}`);
    }
  } catch (err) {
    addLog(`Erro de comunicação: ${err.message}`, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ph-bold ph-paper-plane-tilt"></i> Injetar no TOTVS RM`;
  }
}

async function encerrarSessao() {
  if (!confirm('Deseja realmente encerrar a sessão do TOTVS?')) return;
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
}

window.onload = () => {
  checarStatus();
  carregarMatrizBernoulli();
};
