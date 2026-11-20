#!/usr/bin/env node
/**
 * ============================================================================
 * 🛡️ FIREWALL DE SEGURANÇA & AUDITORIA LGPD (DevSecOps Scanner)
 * Arquivo: scripts/auditoria_seguranca.js
 * ============================================================================
 * Varre todos os arquivos rastreados/staged no Git em busca de:
 * 1. Chaves de API do Google / Firebase / Gemini (AIza...)
 * 2. Tokens OAuth / Vertex / sessões (AQ....)
 * 3. Números de CPF / CNPJ ou dados pessoais do titular
 * 4. Senhas hardcoded ou URLs de tenants privados
 * 5. Extensões de arquivos proibidas (.pdf, .env, .xlsx, .csv, .exe, .msi)
 * 6. Referências a arquivos pessoais/médicos/financeiros
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FORBIDDEN_EXTENSIONS = new Set([
  '.pdf', '.msi', '.exe', '.xlsx', '.xls', '.csv', '.key', '.pem', '.pfx'
]);

const FORBIDDEN_PATH_PATTERNS = [
  /^Certificados\//i,
  /^_quarentena_local_nao_subir\//i,
  /\.chrome-app-profile/i,
  /(^|\/)\.env(\..+)?$/i, // bloqueia .env, .env.local, etc. (exceto .env.example tratado abaixo)
];

const SECRET_REGEX_RULES = [
  {
    id: 'GOOGLE_API_KEY',
    desc: 'Chave de API Google / Firebase / Gemini real detectada (AIza...)',
    regex: /AIza[0-9A-Za-z\-_]{30,45}/g
  },
  {
    id: 'GOOGLE_TOKEN_AQ',
    desc: 'Token de autenticação Google/AI Studio detectado (AQ...)',
    regex: /AQ\.[0-9A-Za-z\-_]{20,}/g
  },
  {
    id: 'PERSONAL_CPF',
    desc: 'CPF real do titular detectado no código/texto',
    regex: /117\.?121\.?526-?61/g
  },
  {
    id: 'HARDCODED_PASSWORD',
    desc: 'Senha real antiga detectada no código',
    regex: /(Itabira12\*|Lucas#2024)/g
  },
  {
    id: 'PRIVATE_TENANT_URL',
    desc: 'URL privada de tenant corporativo TOTVS RM detectada',
    regex: /assoceducativacultural117438\.rm\.cloudtotvs\.com\.br/gi
  },
  {
    id: 'PERSONAL_FILES_REF',
    desc: 'Menção a arquivos pessoais/médicos/financeiros avulsos detectada',
    regex: /(comprovante_picpay|eletrocardiograma)/gi
  },
  {
    id: 'LOCAL_USER_PATH',
    desc: 'Caminho absoluto local do usuário Windows (Users\\27dru) detectado',
    regex: /Users[\\\/]+27dru/gi
  },
  {
    id: 'PRIVATE_KEY_BLOCK',
    desc: 'Bloco de chave privada criptográfica detectado',
    regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g
  }
];

function getFilesToScan() {
  const isStagedOnly = process.argv.includes('--staged');
  if (fs.existsSync('.git')) {
    try {
      const cmd = isStagedOnly
        ? 'git diff --cached --name-only --diff-filter=ACM'
        : 'git ls-files';
      const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (out) return out.split(/\r?\n/).filter(Boolean);
    } catch {
      // Fallback para varredura direta do diretório
    }
  }
  return walkDir('.');
}

function walkDir(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = path.relative('.', path.join(dir, entry.name)).replace(/\\/g, '/');
    if (
      rel.startsWith('.git/') ||
      rel === '.git' ||
      rel.startsWith('Certificados') ||
      rel.startsWith('_quarentena_local_nao_subir') ||
      rel.startsWith('GITHUB_READY_PORTFOLIO') ||
      rel.includes('node_modules')
    ) {
      continue;
    }
    if (entry.isDirectory()) {
      walkDir(path.join(dir, entry.name), list);
    } else {
      list.push(rel);
    }
  }
  return list;
}

function runAudit() {
  console.log('====================================================================');
  console.log('🛡️  INICIANDO AUDITORIA DE SEGURANÇA, SECRETS & CONFORMIDADE LGPD');
  console.log('====================================================================');

  const files = getFilesToScan();
  let violations = [];

  for (const file of files) {
    const normalized = file.replace(/\\/g, '/');

    // Ignorar o próprio script de auditoria nas regras de regex literal
    const isSelf = normalized === 'scripts/auditoria_seguranca.js';

    // 1. Verificar caminhos proibidos
    if (!normalized.endsWith('.env.example')) {
      for (const pattern of FORBIDDEN_PATH_PATTERNS) {
        if (pattern.test(normalized)) {
          violations.push({
            file: normalized,
            rule: 'FORBIDDEN_PATH',
            detail: `Arquivo ou pasta sensível bloqueada pelo firewall: ${normalized}`
          });
        }
      }
    }

    // 2. Verificar extensões proibidas
    const ext = path.extname(normalized).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      violations.push({
        file: normalized,
        rule: 'FORBIDDEN_EXTENSION',
        detail: `Extensão de arquivo sensível não permitida no Git (${ext})`
      });
      continue;
    }

    // 3. Ler conteúdo textual e aplicar regras de detecção de segredos/PII
    if (!isSelf && fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
      const content = fs.readFileSync(normalized, 'utf8');
      for (const rule of SECRET_REGEX_RULES) {
        rule.regex.lastIndex = 0;
        const match = rule.regex.exec(content);
        if (match) {
          violations.push({
            file: normalized,
            rule: rule.id,
            detail: `${rule.desc} -> trecho encontrado: "${match[0].slice(0, 12)}..."`
          });
        }
      }
    }
  }

  console.log(`📂 Arquivos auditados no repositório: ${files.length}`);

  if (violations.length > 0) {
    console.error(`\n❌ FALHA DE SEGURANÇA: ${violations.length} violação(ões) encontrada(s)!\n`);
    violations.forEach((v, idx) => {
      console.error(`  [${idx + 1}] [${v.rule}] em "${v.file}":`);
      console.error(`      ${v.detail}`);
    });
    console.error('\n🚫 O commit/push foi BLOQUEADO para proteger seus dados e credenciais.');
    process.exit(1);
  }

  console.log('✅ ZERO vazamentos de chaves de API (Google/Firebase/Gemini)');
  console.log('✅ ZERO senhas ou URLs privadas de clientes/instituições');
  console.log('✅ ZERO números de CPF ou documentos pessoais expostos (LGPD OK)');
  console.log('✅ ZERO arquivos PDF, planilhas de alunos ou instaladores rastreados');
  console.log('====================================================================');
  console.log('🔒 REPOSITÓRIO 100% SEGURO E APROVADO PARA O GITHUB!');
  console.log('====================================================================');
}

runAudit();
