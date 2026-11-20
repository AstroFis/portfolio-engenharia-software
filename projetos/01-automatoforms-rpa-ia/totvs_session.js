const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const readline = require('readline');
const { LOGIN_URL, preencherCredenciais } = require('./totvs_login');

const CHROME_PATH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SLOW_MO = Number(process.env.SLOW_MO || 30); // Reduzido de 150 para 30ms para acelerar cliques e digitação
const DEBUG_PORT = Number(process.env.DEBUG_PORT || 9222);
// Perfil próprio do robô (guarda cookies da sessão; está no .gitignore)
const PROFILE_DIR = path.join(__dirname, '.chrome-profile');

const DIARIO_URL =
  'https://seu-tenant.rm.cloudtotvs.com.br/Corpore.Net/Main.aspx?SelectedMenuIDKey=mnDiarioClasse&ActionID=EduDiarioClasseActionWeb';

const wait = ms => new Promise(r => setTimeout(r, ms));

/**
 * Canal de aviso/confirmação. Hoje usa o console; no futuro basta trocar por
 * um notificador do Telegram com a mesma interface: { aviso(texto), confirmar(texto) }.
 */
const consoleNotifier = {
  aviso: texto => console.log(`[AVISO] ${texto}`),
  confirmar: texto =>
    new Promise(resolve => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(`\n[CONFIRMAR] ${texto}\nPressione ENTER para continuar ou digite "n" para cancelar: `, resp => {
        rl.close();
        resolve(resp.trim().toLowerCase() !== 'n');
      });
    })
};

/** Há um Chrome do robô já aberto e aceitando conexão? */
function chromeAtivo() {
  return new Promise(resolve => {
    const req = http.get(`http://127.0.0.1:${DEBUG_PORT}/json/version`, res => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
  });
}

/** Abre o Chrome VISÍVEL, independente deste script (continua aberto quando o script termina). */
async function abrirChrome() {
  const { getScreenBounds } = require('./screen_helper');
  const bounds = getScreenBounds();
  const halfWidth = Math.floor(bounds.width / 2);
  const height = bounds.height;

  const filho = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--remote-debugging-address=127.0.0.1', // somente esta máquina
      `--user-data-dir=${PROFILE_DIR}`,
      `--window-position=${halfWidth},0`,
      `--window-size=${halfWidth},${height}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ],
    { detached: true, stdio: 'ignore' }
  );
  filho.unref();
  for (let i = 0; i < 30; i++) {
    if (await chromeAtivo()) return;
    await wait(400);
  }
  throw new Error('O Chrome não respondeu. Verifique CHROME_PATH no .env ou feche outros Chrome do robô.');
}

async function pegarPagina(browser) {
  const paginas = await browser.pages();
  return paginas.find(p => p.url().includes('cloudtotvs')) || paginas[0] || (await browser.newPage());
}

async function loginSeNecessario(page, notifier) {
  if (!page.url().includes('cloudtotvs')) {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await wait(1500);
  }
  if (await page.$('#txtPass')) {
    notifier.aviso('Fazendo login no TOTVS RM...');
    await page.waitForSelector('#txtUser', { timeout: 15000 });
    const { getCredenciais, obterCredenciaisInterativas } = require('./totvs_login');
    let creds;
    try {
      creds = getCredenciais();
    } catch (e) {
      creds = await obterCredenciaisInterativas();
    }
    await page.evaluate((u, p) => {
      const userInp = document.querySelector('#txtUser');
      const passInp = document.querySelector('#txtPass');
      const btn = document.querySelector('#btnLogin');
      if (userInp) userInp.value = u;
      if (passInp) passInp.value = p;
      if (btn) btn.click();
    }, creds.user, creds.pass);
    await wait(5000);
    if (await page.$('#txtPass')) {
      throw new Error('Login falhou: continua na tela de login. Verifique seu usuário e senha.');
    }
    notifier.aviso('Login realizado com sucesso.');
  } else {
    notifier.aviso('Sessão já estava logada. Reutilizando.');
  }
}

/**
 * Organiza as janelas perfeitamente divididas na tela:
 * Jarvizinha na esquerda (0 a halfWidth) e TOTVS RM na direita (halfWidth a width).
 */
async function organizarLadoALado(sessao, customWidth, customHeight) {
  if (!sessao || !sessao.page) return;
  try {
    const { getScreenBounds, posicionarJanelaPorTitulo } = require('./screen_helper');
    const bounds = (customWidth && customHeight) ? { width: Number(customWidth), height: Number(customHeight) } : getScreenBounds();
    const halfWidth = Math.floor(bounds.width / 2);
    const height = bounds.height;

    // 1. Reposiciona o painel AutomatoForms na metade esquerda
    posicionarJanelaPorTitulo('AutomatoForms', 0, 0, halfWidth, height);

    // 2. Reposiciona o Chrome do TOTVS RM na metade direita via CDP do Puppeteer
    const { page } = sessao;
    const session = await page.target().createCDPSession();
    const { windowId } = await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds', {
      windowId,
      bounds: { 
        windowState: 'normal', 
        left: halfWidth, 
        top: 0, 
        width: halfWidth, 
        height: height 
      }
    });

    // 3. Reforço no Windows para posicionar janela do TOTVS RM
    posicionarJanelaPorTitulo('TOTVS', halfWidth, 0, halfWidth, height);
    posicionarJanelaPorTitulo('Corpore', halfWidth, 0, halfWidth, height);

    await page.bringToFront();
  } catch (e) {
    console.error('[OrganizarJanelas] Erro ao posicionar:', e.message);
  }
}

async function focarChrome(sessao) {
  if (!sessao || !sessao.page) return;
  try {
    await organizarLadoALado(sessao);
    await sessao.page.bringToFront();
  } catch (e) {}
}

/**
 * Abre (ou reaproveita) o Chrome do robô e garante que está logado.
 * NÃO fecha o navegador: use desconectar() para soltar ou encerrar() para fechar.
 */
async function iniciarSessao({ notifier = consoleNotifier } = {}) {
  const reutilizada = await chromeAtivo();
  if (reutilizada) {
    notifier.aviso('Conectando ao Chrome que já está aberto...');
  } else {
    notifier.aviso('Abrindo o Chrome...');
    await abrirChrome();
  }
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${DEBUG_PORT}`,
    defaultViewport: null,
    slowMo: SLOW_MO
  });
  const page = await pegarPagina(browser);
  await loginSeNecessario(page, notifier);
  return { browser, page, notifier, reutilizada };
}

/** Solta o robô mas deixa o Chrome aberto para o próximo passo/conversa. */
async function desconectar(sessao) {
  await sessao.browser.disconnect();
}

/** Fecha o Chrome por completo (use só quando o usuário pedir). */
async function encerrar(sessao) {
  await sessao.browser.close();
}

/** Use ANTES de qualquer ação que grave dados. Se o usuário cancelar, lança erro. */
async function confirmarAntes(sessao, descricao) {
  const ok = await sessao.notifier.confirmar(descricao);
  if (!ok) throw new Error(`Ação cancelada pelo usuário: ${descricao}`);
}

async function irParaTurmas(sessao) {
  const { page, notifier } = sessao;
  
  // 1. Se já está na tela de turmas com a lista de rádios carregada, não precisa navegar novamente
  const jaTemTurmas = await page.$('input[type=radio][name=rdTurma]').catch(() => null);
  if (jaTemTurmas) {
    notifier.aviso('Já está na tela de turmas.');
    return;
  }

  // 2. Se a página atual já é a URL do Diário de Classe, aguarda o carregamento dos elementos
  if (page.url().includes('EduDiarioClasseActionWeb')) {
    notifier.aviso('Aguardando conclusão do carregamento do Diário...');
    await page.waitForSelector('input[type=radio][name=rdTurma], span, table', { timeout: 35000 }).catch(() => {});
    await wait(3000);
    return;
  }

  // 3. Tenta clicar no link nativo "Diário de classe" da tela inicial se disponível
  const clicouLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const linkDiario = links.find(a => (a.innerText && a.innerText.includes('Diário de classe')) || (a.href && a.href.includes('EduDiarioClasseActionWeb')));
    if (linkDiario) {
      linkDiario.click();
      return true;
    }
    return false;
  }).catch(() => false);

  if (clicouLink) {
    notifier.aviso('Abrindo Diário de Classe pelo menu...');
    await wait(6000);
  } else {
    // 4. Navegação direta segura com tratamento de erro
    try {
      await page.goto(DIARIO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      notifier.aviso(`Navegação em andamento: ${e.message}`);
    }
    await wait(5000);
  }

  // Aguarda a presença da tabela ou dos rádios de turma
  await page.waitForSelector('input[type=radio][name=rdTurma], span, table', { timeout: 35000 }).catch(() => {});
  await wait(2000);
  notifier.aviso('Lista de turmas do Diário de Classe carregada.');
}

/**
 * Pergunta o que fazer e ESPERA o usuário. A janela só fecha com "sair".
 * Novos procedimentos (frequência, notas, plano de aula...) entram em `extras`
 * como { nome: { descricao, executar: async (sessao) => {} } }.
 */
async function menuInterativo(sessao, extras = {}) {
  const comandos = {
    turmas: { descricao: 'voltar à lista de turmas do Diário', executar: irParaTurmas },
    captura: {
      descricao: 'tirar uma captura da tela atual',
      executar: async s => {
        const arq = `captura_${Date.now()}.png`;
        await s.page.screenshot({ path: arq, fullPage: true });
        s.notifier.aviso(`Captura salva em ${arq}`);
      }
    },
    ...extras
  };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const mostrar = () => {
    console.log('\nO que deseja fazer?');
    for (const [nome, c] of Object.entries(comandos)) console.log(`  ${nome.padEnd(10)} - ${c.descricao}`);
    console.log('  manter     - encerrar o script e DEIXAR o Chrome aberto (para o próximo passo)');
    console.log('  sair       - fechar o Chrome e encerrar');
    process.stdout.write('> ');
  };

  return new Promise(resolve => {
    let ocupado = Promise.resolve();
    mostrar();
    rl.on('line', linha => {
      ocupado = ocupado.then(async () => {
        const [cmd, ...args] = linha.trim().split(/\s+/);
        const nome = (cmd || '').toLowerCase();
        if (!nome) return mostrar();
        if (nome === 'sair') {
          rl.close();
          await encerrar(sessao);
          sessao.notifier.aviso('Chrome fechado.');
          return resolve('sair');
        }
        if (nome === 'manter') {
          rl.close();
          await desconectar(sessao);
          sessao.notifier.aviso('Chrome continua aberto e logado. Script encerrado.');
          return resolve('manter');
        }
        if (comandos[nome]) {
          try { await comandos[nome].executar(sessao, args); }
          catch (e) { sessao.notifier.aviso(`Erro em "${nome}": ${e.message}`); }
        } else {
          sessao.notifier.aviso(`Comando desconhecido: "${nome}"`);
        }
        mostrar();
      });
    });
    // Se o terminal for fechado/EOF, NÃO fecha o Chrome: apenas solta.
    rl.on('close', () => ocupado.then(async () => {
      try { await desconectar(sessao); } catch (_) {}
      resolve('manter');
    }));
  });
}

module.exports = {
  iniciarSessao, desconectar, encerrar, confirmarAntes,
  irParaTurmas, menuInterativo, consoleNotifier, wait, DIARIO_URL,
  organizarLadoALado, focarChrome
};
