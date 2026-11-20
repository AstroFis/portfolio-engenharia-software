/**
 * Módulo do botão "Alunos" do Diário de Classe (SOMENTE LEITURA).
 * Veja CONTEXTO.md para as regras.
 */
const { wait, irParaTurmas } = require('./totvs_session');

const SEL_BTN_ALUNOS = '[id$="xbtMinhasTur_I"]';
const SEL_GRADE = '[id$="xgvAlunosTurma_DXMainTable"]';

function exigirTurma(sessao) {
  if (!sessao.turmaSelecionada) {
    throw new Error('Nenhuma turma selecionada. Use "turma <n>" antes.');
  }
  return sessao.turmaSelecionada;
}

/** Abre a tela de alunos (se ainda não estiver nela) e devolve a lista lida da grade. */
async function listarAlunos(sessao) {
  const { page } = sessao;
  const turma = exigirTurma(sessao);

  if (!(await page.$(SEL_GRADE))) {
    if (!(await page.$(SEL_BTN_ALUNOS))) await irParaTurmas(sessao);
    // Garante que a turma escolhida está marcada na tela de turmas
    const marcada = await page.evaluate(() => {
      const r = document.querySelector('input[type=radio][name=rdTurma]:checked');
      return r ? r.value : null;
    });
    if (marcada !== turma.value) {
      throw new Error('A turma marcada na tela difere da selecionada. Use "turma <n>" novamente.');
    }
    await page.evaluate(sel => document.querySelector(sel).click(), SEL_BTN_ALUNOS);
    await page.waitForSelector(SEL_GRADE, { timeout: 30000 });
    await wait(1500);
  }

  return page.evaluate(sel => {
    const tabela = document.querySelector(sel);
    return Array.from(tabela.querySelectorAll('tr[id*="_DXDataRow"]'))
      .map(tr => Array.from(tr.cells).map(c => c.innerText.trim()).filter((c, i) => i > 0 || c))
      .filter(c => c.length >= 4)
      .map(c => ({ numero: Number(c[0]), ra: c[1], nome: c[2], situacao: c[3] }));
  }, SEL_GRADE);
}

async function lerAlunos(sessao) {
  const turma = exigirTurma(sessao);
  sessao.notifier.aviso(`Lendo alunos da turma: ${turma.texto}`);
  const alunos = await listarAlunos(sessao);
  const linhas = alunos.map(a => `  ${String(a.numero).padStart(2)}. ${a.ra}  ${a.nome.padEnd(45)} ${a.situacao}`);
  sessao.notifier.aviso(`${alunos.length} aluno(s):\n${linhas.join('\n')}`);
  return alunos;
}

const comandosAlunos = {
  alunos: { descricao: 'listar os alunos da turma selecionada (somente leitura)', executar: lerAlunos }
};

module.exports = { listarAlunos, comandosAlunos };
