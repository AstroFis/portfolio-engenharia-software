/**
 * ia_plano_aula.js
 * Módulo de Inteligência Artificial para geração e preenchimento de Plano de Aula no TOTVS RM.
 * Utiliza o Google Generative AI (Gemini) para converter comandos livres do professor em
 * planos de aula estruturados e compatíveis com a grade do TOTVS.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ quiet: true });

const apiKey = process.env.GEMINI_API_KEY || 'SUA_CHAVE_API_AQUI';
const genAI = new GoogleGenerativeAI(apiKey);

const fs = require('fs');
const path = require('path');

// Carrega a base Bernoulli se disponível
let bancoBernoulli = [];
try {
  const caminhoBanco = path.join(__dirname, 'Banco_de_Dados', 'banco_bernoulli_fisica.json');
  if (fs.existsSync(caminhoBanco)) {
    bancoBernoulli = JSON.parse(fs.readFileSync(caminhoBanco, 'utf-8'));
  }
} catch (e) {}

/**
 * Converte instrução livre do professor ou capítulo do Bernoulli em lista de aulas formatadas:
 * Suporta padrão Bernoulli: [Código]: [Título] [Subtópico]
 * e ciclo de avaliação: Revisão -> Aplicação -> Correção
 */
/**
 * Extrai código, título do capítulo e temas/subtópicos extras informados pelo professor
 */
function extrairDadosCapituloEtemas(promptProfessor = '', capituloCodigo = '', capituloTitulo = '', serie = '') {
  let codigo = (capituloCodigo || '').trim();
  let titulo = (capituloTitulo || '').trim();
  let temasExtra = '';
  let promptStr = (promptProfessor || '').trim();

  // 1. Se não veio código explicitamente, tenta extrair do início do prompt (ex: "A6:", "A6 -")
  if (!codigo && promptStr) {
    const mCod = promptStr.match(/^([A-Za-z0-9]{1,4})\s*[:\-]\s*(.*)$/);
    if (mCod) {
      codigo = mCod[1].toUpperCase();
      promptStr = mCod[2].trim();
    }
  }

  // 2. Se temos código mas não temos título válido, busca na matriz Bernoulli
  if (codigo && (!titulo || titulo.toLowerCase() === codigo.toLowerCase())) {
    const achado = bancoBernoulli.find(b => {
      if (b.codigo.toUpperCase() !== codigo.toUpperCase()) return false;
      if (serie) {
        if (serie.includes('1') && (b.metadados.includes('1ª Série') || b.metadados.includes('EM1'))) return true;
        if (serie.includes('2') && (b.metadados.includes('2ª Série') || b.metadados.includes('EM2'))) return true;
        if (serie.includes('3') && (b.metadados.includes('3ª Série') || b.metadados.includes('4V'))) return true;
        return false;
      }
      return true;
    }) || bancoBernoulli.find(b => b.codigo.toUpperCase() === codigo.toUpperCase());

    if (achado) {
      titulo = achado.titulo;
    }
  }

  // 3. Se temos o título, verificar se o prompt tem temas adicionais além do título
  if (promptStr) {
    let limpo = promptStr;
    if (codigo) {
      const regCod = new RegExp(`^${codigo}\\s*[:\\-]\\s*`, 'i');
      limpo = limpo.replace(regCod, '').trim();
    }

    if (titulo) {
      const idxTit = limpo.toLowerCase().indexOf(titulo.toLowerCase());
      if (idxTit !== -1) {
        const resto = limpo.substring(idxTit + titulo.length).trim();
        temasExtra = resto.replace(/^[,:\-–—\s]+/, '').trim();
      } else {
        temasExtra = limpo;
      }
    } else {
      const partes = limpo.split(/[,–—]/);
      titulo = partes[0].trim();
      temasExtra = partes.slice(1).join(', ').trim();
    }
  }

  if (!titulo) {
    titulo = 'Conteúdo Programático';
  }

  if (codigo) {
    const regCod = new RegExp(`^${codigo}\\s*[:\\-]\\s*`, 'i');
    titulo = titulo.replace(regCod, '').trim();
  }

  return { codigo, titulo, temasExtra };
}

/**
 * Converte instrução livre do professor ou capítulo do Bernoulli em lista de aulas formatadas:
 * Padrão rigoroso exigido: [Código]: [Nome do Capítulo]: [Conteúdo gerado pela IA baseado nos temas do capítulo]
 * Exemplo: A6: Mecânica Celeste: Somos Poeiras das Estrelas: Leis de Kepler e introdução aos conceitos fundamentais
 */
async function gerarPlanoComIA(promptProfessor, aulaInicial = 1, qtdAulas = 4, opcoes = {}) {
  const numInicio = parseInt(aulaInicial, 10) || 1;
  const total = parseInt(qtdAulas, 10) || 4;
  const { capituloCodigo, capituloTitulo, serie, incluirAvaliacao } = opcoes;

  // Extrai código, título do capítulo e temas específicos
  const { codigo, titulo, temasExtra } = extrairDadosCapituloEtemas(promptProfessor, capituloCodigo, capituloTitulo, serie);

  // Formata o prefixo oficial obrigatório: "A6: Nome do Capitulo: "
  const prefixo = codigo ? `${codigo}: ${titulo}: ` : `${titulo}: `;

  // 1. Tentar gerar via Google Gemini API se chave estiver ativa
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `Você é a Jarvizinha, assistente de automação educacional do professor Lucas Drumond.
Sua missão é gerar um plano de aulas claro, conciso e profissional para preenchimento de diário escolar no sistema TOTVS RM.

PADRÃO OBRIGATÓRIO DE CADA LINHA:
${prefixo}[Conteúdo gerado pela IA baseado nos temas do capítulo]

Regras críticas:
1. O texto de CADA aula DEVE iniciar OBRIGATORIAMENTE com o prefixo exato: "${prefixo}"
2. Após o prefixo, adicione o conteúdo específico da aula baseado nos temas: "${temasExtra || titulo}".
3. Caso haja avaliação: siga a regra do sanduíche (Revisão -> Aplicação -> Correção).
4. Máximo de 160 caracteres por aula no total.
5. Alinhado rigorosamente à BNCC e à série especificada (${serie || 'Ensino Médio'}).
6. Responda EXCLUSIVAMENTE em formato JSON VÁLIDO (sem markdown):
[
  { "num": ${numInicio}, "text": "${prefixo}Texto da aula 1" },
  { "num": ${numInicio + 1}, "text": "${prefixo}Texto da aula 2" }
]`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Capítulo: "${codigo ? codigo + ': ' : ''}${titulo}". Temas específicos: "${temasExtra || 'Geral do capítulo'}". Aula inicial: ${numInicio}. Total: ${total}. Incluir avaliação: ${incluirAvaliacao ? 'Sim' : 'Não'}.` }
    ]);

    const respostaTexto = result.response.text().trim();
    const jsonLimpo = respostaTexto.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(jsonLimpo);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Garante que todas as aulas tenham o prefixo obrigatório
      return parsed.map(item => {
        let txt = (item.text || '').trim();
        if (!txt.startsWith(prefixo)) {
          // Se começou sem o código, adiciona o prefixo
          txt = `${prefixo}${txt.replace(new RegExp(`^${titulo}:?\\s*`, 'i'), '')}`;
        }
        return {
          num: item.num,
          text: txt.length > 180 ? txt.substring(0, 177) + '...' : txt
        };
      });
    }
  } catch (err) {
    // Fallback silencioso para o motor pedagógico local
  }

  // 2. Motor Pedagógico Local Especializado Bernoulli
  const etapasPedagogicas = [
    'Introdução aos conceitos fundamentais e discussão de fenômenos',
    'Modelagem matemática, leis físicas e exemplos guiados',
    'Resolução de exercícios de fixação e análise de casos',
    'Aplicações no cotidiano, tecnologia e síntese teórica',
    'Aprofundamento conceitual e discussão interdisciplinar',
    'Resolução comentada de questões do ENEM e vestibulares',
    'Atividade prática investigativa e interpretação de dados',
    'Revisão e consolidação das habilidades trabalhadas'
  ];

  // Se houver temas específicos digitados pelo professor, decompõe para distribuir entre as aulas
  let listaTemas = [];
  if (temasExtra) {
    listaTemas = temasExtra.split(/[,;]|\s+e\s+/i).map(t => t.trim()).filter(Boolean);
  }

  const aulas = [];
  for (let i = 0; i < total; i++) {
    const numAula = numInicio + i;
    let conteudoAula = '';

    // Avaliação formativa
    if (incluirAvaliacao && i === total - 3 && total >= 3) {
      conteudoAula = `Revisão para a Avaliação ${incluirAvaliacao}`;
    } else if (incluirAvaliacao && i === total - 2 && total >= 3) {
      conteudoAula = `Aplicação da Avaliação ${incluirAvaliacao}`;
    } else if (incluirAvaliacao && i === total - 1 && total >= 3) {
      conteudoAula = `Correção da Avaliação ${incluirAvaliacao} e comentários`;
    } else if (listaTemas.length > 0) {
      // Combina o tema do professor com a etapa pedagógica correspondente
      const temaAtual = listaTemas[i % listaTemas.length];
      const etapa = etapasPedagogicas[i % etapasPedagogicas.length];
      conteudoAula = `${temaAtual}: ${etapa}`;
    } else {
      conteudoAula = etapasPedagogicas[i % etapasPedagogicas.length];
    }

    let textoFinal = `${prefixo}${conteudoAula}`;
    if (textoFinal.length > 180) {
      textoFinal = textoFinal.substring(0, 177) + '...';
    }

    aulas.push({
      num: numAula,
      text: textoFinal
    });
  }

  return aulas;
}

/**
 * Injeta o plano de aulas diretamente na tabela do TOTVS RM
 */
async function injetarPlanoDeAulaNoTotvs(page, aulas) {
  const resultados = [];

  for (const aula of aulas) {
    const res = await page.evaluate(async (num, text) => {
      const tds = Array.from(document.querySelectorAll('td.dxgv'));
      const tdAula = tds.find(td => td.innerText.trim() === num.toString());
      if (!tdAula) return { success: false, error: `Aula ${num} não encontrada na tabela.` };

      const tr = tdAula.closest('tr');
      const btn = tr.querySelector('div[data-args*="StartEdit"]');
      if (!btn) return { success: false, error: `Botão de edição da aula ${num} não encontrado.` };

      btn.click();

      let attempts = 0;
      while (!document.querySelector('textarea[id*="xmConteudoEfet_I"]') && attempts < 35) {
        await new Promise(r => setTimeout(r, 200));
        attempts++;
      }

      const textarea = document.querySelector('textarea[id*="xmConteudoEfet_I"]');
      if (!textarea) return { success: false, error: 'Campo de texto do conteúdo não abriu.' };

      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.dispatchEvent(new Event('blur', { bubbles: true }));

      await new Promise(r => setTimeout(r, 400));

      const saveBtn = Array.from(document.querySelectorAll('div.dxb, span, input')).find(b => {
        const t = b.innerText || b.value || '';
        return t.trim() === 'Salvar';
      });

      if (saveBtn) saveBtn.click();

      let saveAttempts = 0;
      while (document.querySelector('textarea[id*="xmConteudoEfet_I"]') && saveAttempts < 35) {
        await new Promise(r => setTimeout(r, 300));
        saveAttempts++;
      }

      return { success: true };
    }, aula.num, aula.text);

    resultados.push({ aula: aula.num, ...res });
    await new Promise(r => setTimeout(r, 1200));
  }

  return resultados;
}

module.exports = {
  gerarPlanoComIA,
  injetarPlanoDeAulaNoTotvs
};
