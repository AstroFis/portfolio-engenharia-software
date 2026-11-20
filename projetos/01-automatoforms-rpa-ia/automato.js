/**
 * automato.js
 * Ponto de entrada unificado do AutomatoForms (Persona Jarvizinha).
 * 
 * Funcionalidades Integradas:
 * [1] Listar Turmas do Diário
 * [2] Lançar Notas P2 a partir de Planilha Excel (.xlsx) com Espelhamento (Física e Práticas)
 * [3] Lançar Frequência Diária (com Raio Azul de Aulas Dadas e Marcação de Ausências)
 * [4] Lançar Plano de Aulas (Conteúdo Ministrado)
 * [5] Gerar Relatório de Diagnóstico
 * [6] Manter Chrome Aberto e Sair
 * [0] Encerrar Tudo e Sair
 */

const readline = require('readline');
const path = require('path');
const fs = require('fs');
const { iniciarSessao, irParaTurmas, desconectar, encerrar, wait } = require('./totvs_session');
const { listarTurmas, selecionarTurma, imprimirTurmas } = require('./turmas');
const { lerPlanilhaExcel, normalizarNome } = require('./leitor_notas');
const { obterCredenciaisInterativas } = require('./totvs_login');
const { RelatorioExecucao } = require('./logger_relatorio');

// Mapeamento oficial de Turmas e seus pares espelhados
const TURMAS_MAPEADAS = [
  { id: 1, turma: "1º Ano 103D", disc: "Física", valor: "1;15027", espelhoValor: "1;15037", espelhoNome: "Prática de Física", expand: "1º Ano - Manhã" },
  { id: 2, turma: "1º Ano 103D", disc: "Prática de Física", valor: "1;15037", espelhoValor: "1;15027", espelhoNome: "Física", expand: "1º Ano - Manhã" },
  { id: 3, turma: "1º Ano 104D", disc: "Física", valor: "1;15045", espelhoValor: "1;15055", espelhoNome: "Prática de Física", expand: "1º Ano - Manhã" },
  { id: 4, turma: "1º Ano 104D", disc: "Prática de Física", valor: "1;15055", espelhoValor: "1;15045", espelhoNome: "Física", expand: "1º Ano - Manhã" },
  { id: 5, turma: "2º Ano 203D", disc: "Física", valor: "1;15063", espelhoValor: "1;15075", espelhoNome: "Mais Física I", expand: "2º Ano - Manhã" },
  { id: 6, turma: "2º Ano 203D", disc: "Mais Física I", valor: "1;15075", espelhoValor: "1;15063", espelhoNome: "Física", expand: "2º Ano - Manhã" },
  { id: 7, turma: "2º Ano 204D", disc: "Física", valor: "1;15083", espelhoValor: "1;15095", espelhoNome: "Mais Física I", expand: "2º Ano - Manhã" },
  { id: 8, turma: "2º Ano 204D", disc: "Mais Física I", valor: "1;15095", espelhoValor: "1;15083", espelhoNome: "Física", expand: "2º Ano - Manhã" },
  { id: 9, turma: "3º Ano 205D", disc: "Física", valor: "1;15103", expand: "3º Ano - Manhã" },
  { id: 10, turma: "3º Ano 207D", disc: "Física", valor: "1;15120", expand: "3º Ano - Manhã" }
];

function perguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(texto, resp => { rl.close(); resolve(resp.trim()); }));
}

async function clicarComRetry(page, idSuffix, retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const handle = await page.evaluateHandle((suffix) => {
        const els = Array.from(document.querySelectorAll(`[id$="${suffix}"]`));
        return els.find(e => e.offsetHeight > 0 && e.offsetWidth > 0);
      }, idSuffix);
      if (handle && handle.asElement()) {
        await handle.asElement().click();
        await handle.dispose();
        return true;
      }
    } catch (e) {}
    await wait(500);
  }
  return false;
}

async function jsClick(page, idSubstring, retries = 15) {
  for (let i = 0; i < retries; i++) {
    const success = await page.evaluate((substring) => {
      const el = Array.from(document.querySelectorAll('*')).find(e => e.id && e.id.includes(substring));
      if (el) {
        el.click();
        return true;
      }
      return false;
    }, idSubstring).catch(() => false);
    if (success) return true;
    await wait(500);
  }
  return false;
}

async function preencherNotasNaGrade(page, notasObj) {
  return page.evaluate((grades) => {
    const norm = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    let totalPreenchidos = 0;
    let emBranco = 0;
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
          input.dispatchEvent(new Event('keydown', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('keyup', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
          if (valorFinal === "") emBranco++;
          else totalPreenchidos++;
        }
      }
    }
    return { totalPreenchidos, emBranco };
  }, notasObj);
}

async function expandirGrupo(page, expandText) {
  if (!expandText) return;
  await page.evaluate((exp) => {
    const spans = Array.from(document.querySelectorAll('span, a, td'));
    spans.filter(s => s.innerText && s.innerText.includes(exp)).forEach(s => s.click());
  }, expandText).catch(() => {});
  await wait(1500);
}

async function executarLancamentoFrequencia(sessao, relatorio) {
  console.log('\n--- LANÇAMENTO DE FREQUÊNCIA DIÁRIA ---');
  TURMAS_MAPEADAS.forEach(t => console.log(`  [${t.id}] ${t.turma} - ${t.disc}`));

  const idTurma = await perguntar('\nDigite o número da turma: ');
  const alvo = TURMAS_MAPEADAS.find(t => t.id === Number(idTurma));
  if (!alvo) {
    console.log('[ERRO] Turma inválida.');
    return;
  }

  relatorio.log('FREQUÊNCIA', `Iniciando frequência para ${alvo.turma} - ${alvo.disc}`);
  await irParaTurmas(sessao);
  await expandirGrupo(sessao.page, alvo.expand);

  // Seleciona rádio da turma e clica em Frequência
  await sessao.page.evaluate((val) => {
    const radio = document.querySelector(`input[value="${val}"]`);
    if (radio) radio.click();
    const btn = document.querySelector('[id$="xbtFreqDiaria_I"]') || document.querySelector('[id$="xbtFreqDiaria"]');
    if (btn) btn.click();
  }, alvo.valor);
  await wait(7000);

  // Carregar Grade (Selecionar)
  console.log('Carregando grade de frequência (Selecionar)...');
  await jsClick(sessao.page, 'xbtSelecionar_I');
  await wait(6000);

  // Copiar sugestão de Aulas Dadas (Raio Azul)
  console.log('Copiando sugestão de aulas no período (Raio Azul)...');
  await sessao.page.evaluate(() => {
    const raio = document.querySelector('#ctl24_ximgCopSugPeriodo') || document.querySelector('img[src*="btRaio_azul"]');
    if (raio) raio.click();
  });
  console.log(`-> Sugestão de aulas aplicada.`);
  await wait(1500);

  // Extrair lista de alunos diretamente da grade aberta
  const alunosGrade = await sessao.page.evaluate(() => {
    // Busca todas as linhas de dados da tabela
    const todasLinhas = Array.from(document.querySelectorAll('tr'));
    const linhasComCheck = todasLinhas.filter(tr => tr.querySelector('input[type="checkbox"][id^="ckFreq_"]'));

    return linhasComCheck.map((tr, index) => {
      const cb = tr.querySelector('input[type="checkbox"][id^="ckFreq_"]');
      const partesId = cb ? cb.id.split('_') : [];
      let ra = partesId.length >= 3 ? partesId[2] : '';

      // Varre as células (td) da linha
      const tds = Array.from(tr.querySelectorAll('td'));
      
      // Encontra a célula do nome do aluno
      // No DevExpress, o nome fica em uma coluna de texto (sem inputs, sem números puros de data ou aula)
      let nomeEncontrado = '';

      for (const td of tds) {
        const txt = (td.innerText || '').trim();
        // Critério para nome: texto com mais de 3 letras, não sendo puramente numérico, nem cabeçalho, nem data
        if (txt && txt.length >= 4 && !/^\d+$/.test(txt) && !/^\d{2}\/\d{2}/.test(txt) && !['F', 'J', 'S', 'N'].includes(txt)) {
          // Se contém letras maiúsculas e espaços (padrão de nome completo de aluno)
          if (/[a-zA-ZÀ-ÿ]{3,}/.test(txt) && !txt.includes('Total') && !txt.includes('Faltas')) {
            nomeEncontrado = txt;
            break;
          }
        }
      }

      // Se não achou na linha atual, tenta na célula anterior/irmã de tabela fixa vinculada (comum em grids do DevExpress com colunas congeladas)
      if (!nomeEncontrado) {
        // Tenta buscar por links ou spans com nome de aluno
        const spanNome = tr.querySelector('span[id*="lblNome"], a[id*="lnkNome"], td.dxgv:not([align="center"])');
        if (spanNome && spanNome.innerText) {
          nomeEncontrado = spanNome.innerText.trim();
        }
      }

      // Se ainda não achou, pega qualquer célula de texto com comprimento razoável
      if (!nomeEncontrado) {
        const candidata = tds.map(t => (t.innerText || '').trim()).find(t => t.length > 5 && !t.includes('/'));
        if (candidata) nomeEncontrado = candidata;
      }

      // Se o RA ainda não foi pego pelo ID do checkbox, busca célula numérica de RA
      if (!ra || ra.length < 3) {
        const tdRa = tds.map(t => (t.innerText || '').trim()).find(t => /^\d{5,12}$/.test(t));
        if (tdRa) ra = tdRa;
      }

      return {
        indice: index + 1,
        ra: ra || `RA_${index + 1}`,
        nome: nomeEncontrado || `Aluno ${index + 1}`
      };
    });
  });

  console.log(`\n=================================================================`);
  console.log(`ALUNOS ENCONTRADOS NA TURMA (${alunosGrade.length} alunos):`);
  console.log(`=================================================================`);
  alunosGrade.forEach(a => {
    console.log(`  [${String(a.indice).padStart(2, '0')}] RA: ${String(a.ra).padEnd(12)} - ${a.nome}`);
  });
  console.log(`=================================================================`);

  console.log('\nVocê pode selecionar múltiplos alunos com falta.');
  console.log('Exemplos de entrada:');
  console.log('  - Por número: "3, 7, 15"');
  console.log('  - Por RA: "12345, 67890"');
  console.log('  - Deixe em branco se NENHUM aluno faltou (todos presentes 100%).');
  
  const entradaFaltas = await perguntar('\nQuais alunos tiveram falta? ');
  const rasParaMarcar = [];

  if (entradaFaltas.trim()) {
    const itens = entradaFaltas.split(/[,;\s]+/).filter(Boolean);
    for (const item of itens) {
      if (/^\d{1,2}$/.test(item)) {
        const al = alunosGrade.find(a => a.indice === Number(item));
        if (al) rasParaMarcar.push({ ra: al.ra, nome: al.nome });
      } else {
        const al = alunosGrade.find(a => a.ra.includes(item));
        if (al) rasParaMarcar.push({ ra: al.ra, nome: al.nome });
        else rasParaMarcar.push({ ra: item, nome: item });
      }
    }
  }

  if (rasParaMarcar.length > 0) {
    console.log(`\nMarcando ausências para ${rasParaMarcar.length} aluno(s):`);
    rasParaMarcar.forEach(a => console.log(`  -> ${a.nome} (RA: ${a.ra})`));

    const marcadasTotal = await sessao.page.evaluate((lista) => {
      let total = 0;
      for (const item of lista) {
        const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(i => {
          return i.id && i.id.includes(item.ra) && i.id.startsWith('ckFreq_');
        });
        for (const cb of cbs) {
          if (!cb.checked) {
            cb.click();
            total++;
          }
        }
      }
      return total;
    }, rasParaMarcar);

    console.log(`\n[OK] ${marcadasTotal} ausência(s) marcadas na grade.`);
    relatorio.log('FREQUÊNCIA', `${marcadasTotal} ausências marcadas para os alunos selecionados.`);
  } else {
    console.log('\n[INFO] Nenhum aluno marcado com falta. Presença 100% mantida.');
    relatorio.log('FREQUÊNCIA', 'Nenhuma ausência marcada (100% presença).');
  }

  const salvar = await perguntar('\nDeseja salvar a frequência agora no TOTVS? (s/n): ');
  if (salvar.toLowerCase() === 's') {
    await jsClick(sessao.page, 'xbtSalvarFim_I');
    await wait(6000);
    console.log('[GRAVADO] Frequência salva com sucesso!');
    relatorio.log('FREQUÊNCIA', `Frequência de ${alvo.turma} gravada com sucesso.`);

    // Regra de Espelhamento de Frequência (Física e Práticas)
    if (alvo.espelhoValor) {
      console.log(`\n[ESPELHAMENTO DETECTADO]`);
      const espelhar = await perguntar(`Deseja espelhar a mesma frequência para ${alvo.turma} - ${alvo.espelhoNome}? (s/n): `);
      if (espelhar.toLowerCase() === 's') {
        relatorio.log('FREQUÊNCIA', `Iniciando espelhamento em ${alvo.turma} - ${alvo.espelhoNome}`);
        await irParaTurmas(sessao);
        await expandirGrupo(sessao.page, alvo.expand);

        await sessao.page.evaluate((val) => {
          const radio = document.querySelector(`input[value="${val}"]`);
          if (radio) radio.click();
          const btn = document.querySelector('[id$="xbtFreqDiaria_I"]') || document.querySelector('[id$="xbtFreqDiaria"]');
          if (btn) btn.click();
        }, alvo.espelhoValor);
        await wait(7000);

        await jsClick(sessao.page, 'xbtSelecionar_I');
        await wait(6000);

        await sessao.page.evaluate(() => {
          const raio = document.querySelector('#ctl24_ximgCopSugPeriodo') || document.querySelector('img[src*="btRaio_azul"]');
          if (raio) raio.click();
        });
        await wait(1500);

        if (rasParaMarcar.length > 0) {
          await sessao.page.evaluate((lista) => {
            for (const item of lista) {
              const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(i => {
                return i.id && i.id.includes(item.ra) && i.id.startsWith('ckFreq_');
              });
              for (const cb of cbs) {
                if (!cb.checked) cb.click();
              }
            }
          }, rasParaMarcar);
        }

        await jsClick(sessao.page, 'xbtSalvarFim_I');
        await wait(6000);
        console.log(`[ESPELHAMENTO CONCLUÍDO] ${alvo.espelhoNome} salva com sucesso!`);
        relatorio.log('FREQUÊNCIA', `Espelhamento em ${alvo.espelhoNome} salvo com sucesso.`);
      }
    }
  } else {
    console.log('[NÃO SALVO] Registro mantido na tela para conferência.');
  }
}

async function menuPrincipal() {
  console.clear();
  console.log('=================================================================');
  console.log('        AUTOMATOFORMS - JARVIZINHA (TOTVS RM EDUCACIONAL)        ');
  console.log('          Automação Completa: Notas, Frequência & Turmas         ');
  console.log('=================================================================\n');

  const relatorio = new RelatorioExecucao();
  relatorio.log('INICIALIZAÇÃO', 'Iniciando verificação de credenciais...');

  // Garante credenciais protegidas logo na inicialização
  await obterCredenciaisInterativas();
  relatorio.log('SEGURANÇA', 'Credenciais carregadas com segurança.');

  let sessao = null;

  try {
    relatorio.log('SESSÃO', 'Iniciando navegador Chrome maximizado...');
    sessao = await iniciarSessao();
    relatorio.log('SESSÃO', 'Sessão conectada e tela de Turmas aberta com sucesso!');

    while (true) {
      console.log('\n--- MENU DE OPERAÇÕES ---');
      console.log('  [1] Ver Lista de Turmas do Diário');
      console.log('  [2] Lançar Notas P2 a partir de Planilha Excel (.xlsx) [Com Espelhamento]');
      console.log('  [3] Lançar Frequência Diária / Faltas [Com Raio Azul]');
      console.log('  [4] Gerar Relatório de Diagnóstico Agora');
      console.log('  [5] Manter Navegador Aberto e Sair');
      console.log('  [0] Encerrar Navegador e Sair');

      const opc = await perguntar('\nEscolha uma opção: ');

      if (opc === '1') {
        relatorio.log('TURMAS', 'Solicitada listagem de turmas...');
        const turmas = await listarTurmas(sessao);
        imprimirTurmas(turmas, sessao.turmaSelecionada);
        relatorio.log('TURMAS', `Listadas ${turmas.length} turmas com sucesso.`);
      } else if (opc === '2') {
        relatorio.log('NOTAS', 'Iniciando procedimento de lançamento de notas...');
        console.log('\n--- LANÇAMENTO DE NOTAS ---');
        console.log('Turmas Disponíveis:');
        TURMAS_MAPEADAS.forEach(t => console.log(`  [${t.id}] ${t.turma} - ${t.disc}`));

        const idTurma = await perguntar('\nDigite o número da turma: ');
        const alvo = TURMAS_MAPEADAS.find(t => t.id === Number(idTurma));
        if (!alvo) {
          console.log('[ERRO] Turma inválida.');
          relatorio.erro('NOTAS', `Turma inválida digitada: ${idTurma}`);
          continue;
        }

        const caminhoPlanilha = await perguntar('Arraste ou digite o caminho do arquivo Excel (.xlsx): ');
        const caminhoLimpo = caminhoPlanilha.replace(/^['"]|['"]$/g, '').trim();

        if (!fs.existsSync(caminhoLimpo)) {
          console.log(`[ERRO] Arquivo não encontrado: ${caminhoLimpo}`);
          relatorio.erro('PLANILHA', `Arquivo não encontrado: ${caminhoLimpo}`);
          continue;
        }

        const notas = lerPlanilhaExcel(caminhoLimpo);
        const qtd = Object.keys(notas).length;
        console.log(`\n[PLANILHA] Carregadas notas de ${qtd} alunos.`);
        relatorio.log('PLANILHA', `Notas carregadas para ${qtd} alunos.`);

        console.log(`\n[CONFIGURAÇÃO] Turma: ${alvo.turma} - ${alvo.disc}`);
        if (alvo.espelhoValor) {
          console.log(`[ESPELHAMENTO ATIVO] Também será gravada automaticamente em: ${alvo.espelhoNome}`);
        }

        const confirma = await perguntar('\nDeseja iniciar o preenchimento ao vivo na tela? (s/n): ');
        if (confirma.toLowerCase() !== 's') {
          console.log('[CANCELADO] Operação cancelada pelo usuário.');
          relatorio.log('NOTAS', 'Cancelado pelo usuário antes da injeção.');
          continue;
        }

        const turmasParaProcessar = [
          { nome: `${alvo.turma} - ${alvo.disc}`, valor: alvo.valor, expand: alvo.expand }
        ];

        if (alvo.espelhoValor) {
          turmasParaProcessar.push({
            nome: `${alvo.turma} - ${alvo.espelhoNome}`,
            valor: alvo.espelhoValor,
            expand: alvo.expand
          });
        }

        for (const tProc of turmasParaProcessar) {
          console.log(`\n>>> Processando: ${tProc.nome}`);
          relatorio.log('PROCESSAMENTO', `Abrindo grade de notas para ${tProc.nome}`);
          await irParaTurmas(sessao);
          await expandirGrupo(sessao.page, tProc.expand);
          await wait(1000);

          // Clica no radio da turma e abre Notas
          await sessao.page.evaluate((val) => {
            const rb = document.querySelector(`input[value="${val}"]`);
            if (rb) {
              rb.click();
              const btn = document.querySelector('[id$="xbtNotaAval_I"]') || document.querySelector('[id$="xbtNotaAval"]');
              if (btn) btn.click();
            }
          }, tProc.valor);
          await wait(6000);

          // Etapa 3º Trimestre
          console.log('Selecionando 3º Trimestre...');
          await clicarComRetry(sessao.page, 'xcbEtapa_B-1');
          await wait(1500);
          await sessao.page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('[id*="xcbEtapa_DDD_L"] td'));
            const item = items.find(td => td.innerText && td.innerText.includes('3º Trimestre'));
            if (item) item.click();
          });
          await wait(5000);

          // Avaliação P2
          console.log('Selecionando Avaliação P2...');
          await clicarComRetry(sessao.page, 'xcbAvaliacao_B-1');
          await wait(1500);
          await sessao.page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('[id*="xcbAvaliacao_DDD_L"] td'));
            const item = items.find(td => td.innerText && (td.innerText.includes('P2') || td.innerText.includes('Aval. 2') || td.innerText.includes('Avaliação 2')));
            if (item) item.click();
          });
          await wait(4000);

          // Clicar em Selecionar
          console.log('Carregando grade de alunos...');
          await jsClick(sessao.page, 'xbtSelecionar_I');
          await wait(5000);

          // Injetar notas
          console.log('Preenchendo notas na grade com visualização ao vivo...');
          const resultado = await preencherNotasNaGrade(sessao.page, notas);
          relatorio.log('NOTAS', `Injetadas ${resultado.totalPreenchidos} notas (${resultado.emBranco} ausências em branco) em ${tProc.nome}`);
          console.log(`[SUCESSO] ${resultado.totalPreenchidos} notas lançadas. ${resultado.emBranco} alunos em branco (regra de ausência).`);

          const salvar = await perguntar(`Deseja salvar ${tProc.nome} agora? (s/n): `);
          if (salvar.toLowerCase() === 's') {
            await jsClick(sessao.page, 'xbtSalvarFim_I');
            await wait(5000);
            relatorio.log('SALVAMENTO', `${tProc.nome} salva no TOTVS com sucesso.`);
            console.log(`[GRAVADO] ${tProc.nome} salvo com sucesso!`);
          } else {
            relatorio.log('SALVAMENTO', `${tProc.nome} NÃO foi salva (apenas conferência).`);
            console.log(`[NÃO SALVO] Registro mantido na tela para conferência.`);
          }
        }
      } else if (opc === '3') {
        await executarLancamentoFrequencia(sessao, relatorio);
      } else if (opc === '4') {
        relatorio.salvarRelatorio();
      } else if (opc === '5') {
        relatorio.log('ENCERRAMENTO', 'Desconectando do robô e mantendo o Chrome aberto.');
        await desconectar(sessao);
        relatorio.salvarRelatorio();
        break;
      } else if (opc === '0') {
        relatorio.log('ENCERRAMENTO', 'Fechando navegador e finalizando.');
        await encerrar(sessao);
        relatorio.salvarRelatorio();
        break;
      }
    }
  } catch (err) {
    relatorio.erro('FATAL', err.message, err);
    relatorio.salvarRelatorio();
  }
}

if (require.main === module) {
  menuPrincipal();
}

module.exports = { menuPrincipal };
