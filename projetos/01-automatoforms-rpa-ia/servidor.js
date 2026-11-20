/**
 * servidor.js
 * Servidor Backend da Interface Web do AutomatoForms (Persona Jarvizinha).
 * Permite que qualquer professor faça login com seu CPF/usuário e senha do TOTVS,
 * gerencie suas turmas dinamicamente e lance notas/frequência de forma visual.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { iniciarSessao, irParaTurmas, desconectar, encerrar, wait, organizarLadoALado, focarChrome } = require('./totvs_session');
const { getScreenBounds, posicionarJanelaPorTitulo } = require('./screen_helper');
const { listarTurmas } = require('./turmas');
const { lerPlanilhaExcel } = require('./leitor_notas');

const app = express();
const PORT = 3000;
const upload = multer({ dest: path.join(__dirname, 'uploads') });

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let sessaoAtiva = null;
let usuarioAtual = null;

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({
    conectado: !!sessaoAtiva,
    usuario: usuarioAtual
  });
});

// Organizar janelas lado a lado (Jarvizinha na esquerda, TOTVS na direita)
app.post('/api/chrome/organizar', async (req, res) => {
  if (!sessaoAtiva) return res.status(401).json({ erro: 'Não autenticado.' });
  const { screenWidth, screenHeight } = req.body || {};
  await organizarLadoALado(sessaoAtiva, screenWidth, screenHeight);
  res.json({ sucesso: true });
});

// Focar na janela do TOTVS RM
app.post('/api/chrome/focar', async (req, res) => {
  if (!sessaoAtiva) return res.status(401).json({ erro: 'Não autenticado.' });
  await focarChrome(sessaoAtiva);
  res.json({ sucesso: true });
});

// Rota de captura sob demanda (snapshot)
app.get('/api/screenshot', async (req, res) => {
  if (!sessaoAtiva || !sessaoAtiva.page) {
    return res.status(404).send('Navegador desconectado');
  }
  try {
    const buffer = await sessaoAtiva.page.screenshot({ type: 'jpeg', quality: 70 });
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(buffer);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Login Universal (qualquer professor)
app.post('/api/login', async (req, res) => {
  const { user, pass, screenWidth, screenHeight } = req.body;
  if (!user || !pass) {
    return res.status(400).json({ sucesso: false, erro: 'Informe usuário e senha.' });
  }

  try {
    process.env.TOTVS_USER = user;
    process.env.TOTVS_PASS = pass;
    usuarioAtual = user;

    if (!sessaoAtiva) {
      sessaoAtiva = await iniciarSessao();
    }
    // Organiza automaticamente o Chrome do TOTVS lado a lado
    await organizarLadoALado(sessaoAtiva, screenWidth, screenHeight);

    res.json({ sucesso: true, usuario: user });
  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Listar turmas reais do professor autenticado
app.get('/api/turmas', async (req, res) => {
  if (!sessaoAtiva) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    await irParaTurmas(sessaoAtiva);
    const turmas = await listarTurmas(sessaoAtiva);
    res.json({ turmas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Abrir tela de frequência e extrair alunos
app.post('/api/frequencia/abrir', async (req, res) => {
  const { turmaValor } = req.body;
  if (!sessaoAtiva) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const { page } = sessaoAtiva;
    await irParaTurmas(sessaoAtiva);

    // Clica no radio da turma e abre Frequência
    await page.evaluate((val) => {
      const radio = document.querySelector(`input[value="${val}"]`);
      if (radio) radio.click();
      const btn = document.querySelector('[id$="xbtFreqDiaria_I"]') || document.querySelector('[id$="xbtFreqDiaria"]');
      if (btn) btn.click();
    }, turmaValor);
    await wait(7000);

    // Carregar grade (Selecionar)
    await page.evaluate(() => {
      const btn = document.querySelector('[id$="xbtSelecionar_I"]') || document.querySelector('[id$="xbtSelecionar"]');
      if (btn) btn.click();
    });
    await wait(6000);

    // Clicar no Raio Azul
    await page.evaluate(() => {
      const raio = document.querySelector('#ctl24_ximgCopSugPeriodo') || document.querySelector('img[src*="btRaio_azul"]');
      if (raio) raio.click();
    });
    await wait(1500);

    // Extrair lista com Nome Real e RA de cada aluno diretamente das linhas da grade (sem duplicatas)
    const alunos = await page.evaluate(() => {
      const todasTrs = Array.from(document.querySelectorAll('tr'));
      
      const linhasAlunos = todasTrs.filter(tr => {
        const tds = Array.from(tr.querySelectorAll('td'));
        return tds.length >= 4 && tds.some(td => /^\d{5,10}$/.test(td.innerText.trim()));
      });

      const lista = [];
      const rasVistos = new Set();

      for (const tr of linhasAlunos) {
        const tds = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        const ra = tds.find(t => /^\d{5,10}$/.test(t));
        if (!ra || rasVistos.has(ra)) continue; // Evita repetições por tabelas aninhadas/células congeladas

        const indexRa = tds.indexOf(ra);
        let nome = indexRa !== -1 && tds[indexRa + 1] ? tds[indexRa + 1] : '';

        if (!nome || nome.length < 3) {
          nome = tds.find(t => t.length > 5 && !/^\d+$/.test(t) && !t.includes('/') && !t.includes('Matriculado') && !t.includes('Transferido')) || `Aluno`;
        }

        nome = nome.replace(/\s+/g, ' ').trim();
        if (nome.toLowerCase().includes('diário de classe') || nome.toLowerCase().includes('totvs')) continue;

        rasVistos.add(ra);
        lista.push({
          indice: lista.length + 1,
          ra: ra,
          nome: nome
        });
      }

      return lista;
    });

    res.json({ alunos });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Salvar Frequência
app.post('/api/frequencia/salvar', async (req, res) => {
  const { faltosos } = req.body;
  if (!sessaoAtiva) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const { page } = sessaoAtiva;

    if (faltosos && faltosos.length > 0) {
      await page.evaluate((lista) => {
        for (const item of lista) {
          const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(i => {
            return i.id && i.id.includes(item.ra) && i.id.startsWith('ckFreq_');
          });
          for (const cb of cbs) {
            if (!cb.checked) cb.click();
          }
        }
      }, faltosos);
    }

    // Salvar no TOTVS
    await page.evaluate(() => {
      const btn = document.querySelector('[id$="xbtSalvarFim_I"]') || document.querySelector('[id$="xbtSalvarFim"]');
      if (btn) btn.click();
    });
    await wait(6000);

    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Ler Planilha Excel enviada
app.post('/api/notas/ler-excel', upload.single('planilha'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });

  try {
    const notas = lerPlanilhaExcel(req.file.path);
    // Limpa o arquivo temporário
    fs.unlinkSync(req.file.path);
    res.json({ notas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Rotas do Plano de Aula (Diário com IA)
const { gerarPlanoComIA, injetarPlanoDeAulaNoTotvs } = require('./ia_plano_aula');

// Base curricular Bernoulli
app.get('/api/plano-aula/bernoulli', (req, res) => {
  const caminhoBanco = path.join(__dirname, 'Banco_de_Dados', 'banco_bernoulli_fisica.json');
  if (fs.existsSync(caminhoBanco)) {
    try {
      const dados = JSON.parse(fs.readFileSync(caminhoBanco, 'utf-8'));
      return res.json({ bernoulli: dados });
    } catch (e) {}
  }
  res.json({ bernoulli: [] });
});

// Acessar Plano de Aula no TOTVS RM e ler aulas já existentes
app.post('/api/plano-aula/abrir', async (req, res) => {
  const { turmaValor, etapaIndex = 2 } = req.body;
  if (!sessaoAtiva) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const { page } = sessaoAtiva;
    await irParaTurmas(sessaoAtiva);

    // Selecionar turma e abrir Plano de Aula
    await page.evaluate((val) => {
      const radio = document.querySelector(`input[value="${val}"]`);
      if (radio) radio.click();
      const btn = document.querySelector('[id$="xbtPlanoAula_I"]') || document.querySelector('[id$="xbtPlanoAula"]');
      if (btn) btn.click();
    }, turmaValor);
    await wait(7000);

    // Selecionar Etapa (Trimestre) e clicar em Selecionar
    await page.evaluate((idx) => {
      const cb = window.ASPxClientControl ? window.ASPxClientControl.GetControlCollection().GetByName('ctl24_xcbEtapaFalta') : null;
      if (cb) cb.SetSelectedIndex(Number(idx));
      const btn = document.querySelector('#ctl24_xbtSelecionar_I') || document.querySelector('[id$="xbtSelecionar_I"]');
      if (btn) btn.click();
    }, etapaIndex);
    await wait(6000);

    // Ler as aulas já lançadas na tabela DevExpress com detecção dinâmica de colunas
    const infoPlano = await page.evaluate(() => {
      let rows = Array.from(document.querySelectorAll('tr[id*="xgvPlanoAula_DXDataRow"]'));
      if (rows.length === 0) {
        const tabela = document.querySelector('[id*="xgvPlanoAula_DXMainTable"]') || document.querySelector('[id*="xgvPlanoAula"]');
        if (tabela) rows = Array.from(tabela.querySelectorAll('tr'));
      }

      const aulas = [];
      for (const r of rows) {
        const tds = Array.from(r.querySelectorAll('td')).map(td => td.innerText.trim());
        if (tds.length < 3) continue;

        // Procura a célula que tem o número da aula (ex: 1, 41, 82)
        let num = null;
        let numIdx = -1;
        for (let i = 0; i < Math.min(tds.length, 4); i++) {
          if (/^\d{1,3}$/.test(tds[i])) {
            num = parseInt(tds[i], 10);
            numIdx = i;
            break;
          }
        }
        if (num === null) continue;

        // Data da aula
        const data = tds.find(t => /^\d{2}\/\d{2}\/\d{4}$/.test(t)) || '';
        
        // Horários
        const horarios = tds.filter(t => /^\d{2}:\d{2}$/.test(t));
        const horarioStr = horarios.length >= 2 ? `${horarios[0]} - ${horarios[1]}` : (horarios[0] || '');

        // Textos das colunas de conteúdo (Previsto e Realizado)
        const textos = tds.filter((t, idx) => idx > numIdx && t.length > 2 && !/^\d{2}\/\d{2}\/\d{4}$/.test(t) && !/^\d{2}:\d{2}$/.test(t) && t.toLowerCase() !== 'editar');
        const conteudoEfetivo = textos.length > 0 ? textos[textos.length - 1] : '';

        aulas.push({
          num,
          data,
          horario: horarioStr,
          conteudo: conteudoEfetivo
        });
      }

      // Ordena por número de aula
      aulas.sort((a, b) => a.num - b.num);

      const aulasPreenchidas = aulas.filter(a => a.conteudo && a.conteudo.length > 2);
      const ultimaPreenchida = aulasPreenchidas.length > 0 ? aulasPreenchidas[aulasPreenchidas.length - 1].num : null;
      
      let proximaVazia = null;
      if (ultimaPreenchida) {
        const seguinte = aulas.find(a => a.num > ultimaPreenchida && (!a.conteudo || a.conteudo.length <= 2));
        proximaVazia = seguinte ? seguinte.num : ultimaPreenchida + 1;
      } else if (aulas.length > 0) {
        const primeiraVazia = aulas.find(a => !a.conteudo || a.conteudo.length <= 2);
        proximaVazia = primeiraVazia ? primeiraVazia.num : aulas[0].num;
      }

      return {
        totalAulas: aulas.length,
        totalPreenchidas: aulasPreenchidas.length,
        ultimaPreenchida,
        proximaVazia: proximaVazia || (aulas.length > 0 ? aulas[0].num : 1),
        aulasExistentes: aulas
      };
    });

    res.json({ sucesso: true, info: infoPlano });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/api/plano-aula/gerar-ia', async (req, res) => {
  const { prompt, aulaInicial, qtdAulas, capituloCodigo, capituloTitulo, serie, incluirAvaliacao } = req.body;
  try {
    const plano = await gerarPlanoComIA(prompt, aulaInicial, qtdAulas, { capituloCodigo, capituloTitulo, serie, incluirAvaliacao });
    res.json({ plano });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/api/plano-aula/injetar', async (req, res) => {
  const { turmaValor, etapaIndex = 2, aulas } = req.body;
  if (!sessaoAtiva) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const { page } = sessaoAtiva;

    // Se já estiver na tabela, não precisa reabrir tudo
    const jaNaGrade = await page.evaluate(() => {
      return !!document.querySelector('[id*="xgvPlanoAula_DXMainTable"]');
    });

    if (!jaNaGrade) {
      await irParaTurmas(sessaoAtiva);
      await page.evaluate((val) => {
        const radio = document.querySelector(`input[value="${val}"]`);
        if (radio) radio.click();
        const btn = document.querySelector('[id$="xbtPlanoAula_I"]') || document.querySelector('[id$="xbtPlanoAula"]');
        if (btn) btn.click();
      }, turmaValor);
      await wait(7000);

      await page.evaluate((idx) => {
        const cb = window.ASPxClientControl ? window.ASPxClientControl.GetControlCollection().GetByName('ctl24_xcbEtapaFalta') : null;
        if (cb) cb.SetSelectedIndex(Number(idx));
        const btn = document.querySelector('#ctl24_xbtSelecionar_I') || document.querySelector('[id$="xbtSelecionar_I"]');
        if (btn) btn.click();
      }, etapaIndex);
      await wait(6000);
    }

    // Injetar cada aula
    const resultado = await injetarPlanoDeAulaNoTotvs(page, aulas);
    res.json({ sucesso: true, resultado });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});
app.post('/api/notas/lancar', async (req, res) => {
  const { turmaValor, avaliacao, notas } = req.body;
  if (!sessaoAtiva) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const { page } = sessaoAtiva;
    await irParaTurmas(sessaoAtiva);

    // Clica no radio e abre notas
    await page.evaluate((val) => {
      const rb = document.querySelector(`input[value="${val}"]`);
      if (rb) {
        rb.click();
        const btn = document.querySelector('[id$="xbtNotaAval_I"]') || document.querySelector('[id$="xbtNotaAval"]');
        if (btn) btn.click();
      }
    }, turmaValor);
    await wait(6000);

    // Selecionar Etapa (3º Trimestre)
    await page.evaluate(() => {
      const btn = document.querySelector('[id$="xcbEtapa_B-1"]');
      if (btn) btn.click();
    });
    await wait(1500);
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[id*="xcbEtapa_DDD_L"] td'));
      const item = items.find(td => td.innerText && td.innerText.includes('3º Trimestre'));
      if (item) item.click();
    });
    await wait(5000);

    // Selecionar Avaliação
    await page.evaluate(() => {
      const btn = document.querySelector('[id$="xcbAvaliacao_B-1"]');
      if (btn) btn.click();
    });
    await wait(1500);
    await page.evaluate((aval) => {
      const items = Array.from(document.querySelectorAll('[id*="xcbAvaliacao_DDD_L"] td'));
      const item = items.find(td => td.innerText && (td.innerText.includes(aval) || td.innerText.includes('Avaliação 2')));
      if (item) item.click();
    }, avaliacao);
    await wait(4000);

    // Selecionar (Carregar tabela)
    await page.evaluate(() => {
      const btn = document.querySelector('[id$="xbtSelecionar_I"]') || document.querySelector('[id$="xbtSelecionar"]');
      if (btn) btn.click();
    });
    await wait(5000);

    // Injetar notas aplicando a Regra do Zero
    const totalLancados = await page.evaluate((grades) => {
      const norm = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      let total = 0;
      const tds = Array.from(document.querySelectorAll('td'));

      for (const [nome, rawNota] of Object.entries(grades)) {
        let valorFinal = "";
        if (rawNota !== null && rawNota !== undefined && Number(rawNota) !== 0) {
          valorFinal = Number(rawNota).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const nomeBuscado = norm(nome);
        const td = tds.find(t => t.innerText && norm(t.innerText) === nomeBuscado && t.childElementCount === 0);
        if (td) {
          const tr = td.closest('tr');
          const input = tr.querySelector('input[id*="tbProva_2_"]') || tr.querySelector('input[id^="tbProva_"]');
          if (input) {
            input.disabled = false;
            input.readOnly = false;
            input.value = valorFinal;
            input.dispatchEvent(new Event('focus', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            total++;
          }
        }
      }
      return total;
    }, notas);

    // Salvar
    await page.evaluate(() => {
      const btn = document.querySelector('[id$="xbtSalvarFim_I"]') || document.querySelector('[id$="xbtSalvarFim"]');
      if (btn) btn.click();
    });
    await wait(6000);

    res.json({ sucesso: true, totalLancados });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Logout
app.post('/api/logout', async (req, res) => {
  if (sessaoAtiva) {
    await desconectar(sessaoAtiva);
    sessaoAtiva = null;
    usuarioAtual = null;
  }
  res.json({ sucesso: true });
});

/**
 * Abre o painel do AutomatoForms como um aplicativo desktop dedicado na metade esquerda da tela.
 * Não abre abas no navegador pessoal do professor, garantindo visualização 50% / 50% limpa.
 */
function abrirPainelDesktop() {
  const CHROME_PATH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const bounds = getScreenBounds();
  const halfWidth = Math.floor(bounds.width / 2);
  const height = bounds.height;
  const appProfileDir = path.join(process.cwd(), '.chrome-app-profile');

  if (fs.existsSync(CHROME_PATH)) {
    console.log(`[Jarvizinha] Abrindo AutomatoForms em modo aplicativo na metade esquerda (${halfWidth}x${height})...`);
    const proc = spawn(
      CHROME_PATH,
      [
        `--app=http://localhost:${PORT}`,
        `--user-data-dir=${appProfileDir}`,
        '--window-position=0,0',
        `--window-size=${halfWidth},${height}`,
        '--no-first-run',
        '--no-default-browser-check'
      ],
      { detached: true, stdio: 'ignore' }
    );
    proc.unref();

    // Reforça o posicionamento exato da janela no Windows
    setTimeout(() => {
      posicionarJanelaPorTitulo('AutomatoForms', 0, 0, halfWidth, height);
    }, 1500);
  } else {
    // Fallback se o Chrome não estiver no caminho padrão
    spawn('cmd.exe', ['/c', 'start', `http://localhost:${PORT}`], { detached: true, stdio: 'ignore' }).unref();
  }
}

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  AUTOMATOFORMS - PAINEL VISUAL DO PROFESSOR ATIVO!`);
  console.log(`  Acesse em: http://localhost:${PORT}`);
  console.log(`======================================================\n`);

  // Abre como aplicativo desktop dedicado na metade esquerda
  abrirPainelDesktop();
});
