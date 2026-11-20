const { irParaTurmas, wait } = require('./totvs_session');

const SEL_RADIO = 'input[type=radio][name=rdTurma]';

/** Garante que a página atual é a lista de turmas do Diário. */
async function garantirListaTurmas(sessao) {
  const tem = await sessao.page.$(SEL_RADIO).catch(() => null);
  if (!tem) await irParaTurmas(sessao);
}

/** Lê todas as turmas/disciplinas (mesmo com o grupo recolhido). */
async function listarTurmas(sessao) {
  await garantirListaTurmas(sessao);
  await wait(1000);

  // Tentativa com tolerância a recarregamento de contexto
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      await sessao.page.waitForSelector(SEL_RADIO, { timeout: 15000 });
      return await sessao.page.evaluate(sel =>
        Array.from(document.querySelectorAll(sel)).map((r, i) => ({
          indice: i + 1,
          value: r.value,
          texto: ((r.parentElement && r.parentElement.innerText) || '').trim()
        })), SEL_RADIO);
    } catch (e) {
      await wait(1500);
    }
  }
  throw new Error('Não foi possível ler as turmas da tela. O Diário ainda está carregando.');
}

function imprimirTurmas(turmas, selecionada) {
  console.log('\nTurmas disponíveis:');
  for (const t of turmas) {
    const marca = selecionada && selecionada.value === t.value ? '  <== selecionada' : '';
    console.log(`  ${String(t.indice).padStart(2)}. ${t.texto}${marca}`);
  }
}

const radioVisivel = (page, value) =>
  page.evaluate((sel, v) => {
    const r = document.querySelector(`${sel}[value="${v}"]`);
    return !!r && r.offsetHeight > 0;
  }, SEL_RADIO, value);

/**
 * Seleciona uma turma pelo número da lista (ou parte do nome, ex.: "204D Física").
 * Abre o grupo (ano) se estiver recolhido. Guarda em sessao.turmaSelecionada.
 */
async function selecionarTurma(sessao, entrada) {
  const { page, notifier } = sessao;
  const turmas = await listarTurmas(sessao);
  const texto = String(entrada || '').trim();
  if (!texto) throw new Error('Informe o número ou o nome da turma. Ex.: turma 7');

  let alvo;
  if (/^\d+$/.test(texto)) {
    alvo = turmas.find(t => t.indice === Number(texto));
  } else {
    const achadas = turmas.filter(t => t.texto.toLowerCase().includes(texto.toLowerCase()));
    if (achadas.length > 1) {
      throw new Error(`"${texto}" combina com mais de uma turma (${achadas.map(a => a.indice).join(', ')}). Use o número.`);
    }
    alvo = achadas[0];
  }
  if (!alvo) throw new Error(`Turma não encontrada: "${texto}". Digite "turmas" para ver a lista.`);

  // Abre o grupo do ano (ex.: "2º Ano - Manhã") se o botão estiver escondido
  if (!(await radioVisivel(page, alvo.value))) {
    const serie = (alvo.texto.match(/^(\d)º Ano/) || [])[1];
    await page.evaluate(s => {
      Array.from(document.querySelectorAll('span, div, td'))
        .filter(e => e.children.length === 0 && /^\s*\d{4} - /.test(e.innerText || '') && e.innerText.includes(`${s}º Ano -`))
        .forEach(e => e.click());
    }, serie);
    await wait(1500);
  }

  const marcado = await page.evaluate((sel, v) => {
    const r = document.querySelector(`${sel}[value="${v}"]`);
    if (!r) return false;
    r.click();
    return r.checked;
  }, SEL_RADIO, alvo.value);
  if (!marcado) throw new Error(`Não consegui marcar a turma: ${alvo.texto}`);

  await wait(800);
  sessao.turmaSelecionada = alvo;
  notifier.aviso(`Turma selecionada: ${alvo.texto}`);
  return alvo;
}

/** Comandos prontos para plugar no menu: extras de menuInterativo. */
const comandosTurmas = {
  turmas: {
    descricao: 'listar as turmas (numeradas)',
    executar: async s => imprimirTurmas(await listarTurmas(s), s.turmaSelecionada)
  },
  turma: {
    descricao: 'selecionar uma turma. Ex.: "turma 7" ou "turma 204D Física"',
    executar: async (s, args) => {
      await selecionarTurma(s, args.join(' '));
    }
  },
  atual: {
    descricao: 'mostrar a turma atualmente selecionada',
    executar: async s =>
      s.notifier.aviso(s.turmaSelecionada ? `Turma atual: ${s.turmaSelecionada.texto}` : 'Nenhuma turma selecionada.')
  }
};

module.exports = { listarTurmas, selecionarTurma, imprimirTurmas, comandosTurmas };
