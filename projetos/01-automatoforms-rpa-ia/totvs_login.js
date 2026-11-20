const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const LOGIN_URL = 'https://seu-tenant.rm.cloudtotvs.com.br/Corpore.Net/Login.aspx';

let credenciaisEmMemoria = null;

function promptOculto(pergunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const stdin = process.stdin;
    process.stdout.write(pergunta);

    let senha = '';
    const onData = (char) => {
      char = char.toString('utf-8');
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.removeListener('data', onData);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u0008': // Backspace
        case '\x7f':
          if (senha.length > 0) {
            senha = senha.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          senha += char;
          process.stdout.write('*');
          break;
      }
    };

    if (stdin.isTTY) {
      stdin.on('data', onData);
    }

    rl.question('', (ans) => {
      rl.close();
      if (!stdin.isTTY) {
        resolve(ans.trim());
      } else {
        process.stdout.write('\n');
        resolve(senha.trim());
      }
    });
  });
}

function promptTexto(pergunta) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(pergunta, ans => { rl.close(); resolve(ans.trim()); }));
}

async function obterCredenciaisInterativas() {
  if (credenciaisEmMemoria) return credenciaisEmMemoria;

  let user = process.env.TOTVS_USER;
  let pass = process.env.TOTVS_PASS;

  if (!user) {
    console.log('\n[SEGURANÇA] Nenhuma credencial encontrada no ambiente.');
    user = await promptTexto('Digite seu Usuário/CPF TOTVS: ');
  }

  if (!pass) {
    pass = await promptOculto('Digite sua Senha TOTVS (digitada de forma oculta): ');
  }

  if (!user || !pass) {
    throw new Error('Usuário ou senha não informados.');
  }

  credenciaisEmMemoria = { user, pass };
  return credenciaisEmMemoria;
}

function getCredenciais() {
  if (credenciaisEmMemoria) return credenciaisEmMemoria;
  const user = process.env.TOTVS_USER;
  const pass = process.env.TOTVS_PASS;
  if (!user || !pass) {
    throw new Error('Credenciais não configuradas. Defina no .env ou solicite de forma interativa.');
  }
  return { user, pass };
}

async function preencherCredenciais(page) {
  let creds;
  try {
    creds = getCredenciais();
  } catch (e) {
    creds = await obterCredenciaisInterativas();
  }
  await page.type('#txtUser', creds.user);
  await page.type('#txtPass', creds.pass);
}

module.exports = {
  LOGIN_URL,
  getCredenciais,
  obterCredenciaisInterativas,
  preencherCredenciais
};
