/**
 * leitor_notas.js
 * Leitor desacoplado de notas escolares (Planilhas Excel .xlsx, .csv ou JSON).
 * 
 * Regra do Zero / Ausência:
 * - 0 ou vazio vira null (deve ser deixado em branco no sistema, nunca "0,00").
 */

const fs = require('fs');
const xlsx = require('xlsx');

function normalizarNome(nome) {
  if (!nome) return '';
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Lê arquivo Excel (.xlsx / .xls) e extrai mapa de notas: { "Nome do Aluno": 15.5, ... }
 */
function lerPlanilhaExcel(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }

  const wb = xlsx.readFile(caminhoArquivo);
  const notasPorAluno = {};

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    for (const row of rows) {
      if (!row || row.length < 2) continue;

      const rawNome = row[0];
      const rawNota = row[1];

      if (typeof rawNome !== 'string') continue;

      const nomeLimpo = rawNome.trim();
      const nomeLower = nomeLimpo.toLowerCase();

      // Ignora linhas de cabeçalho
      if (['aluno', 'nome', 'estudante', 'total'].includes(nomeLower)) continue;

      if (rawNota !== undefined && rawNota !== null && rawNota !== '') {
        // Converte vírgula para ponto se vier texto
        const notaStr = String(rawNota).replace(',', '.').trim();
        const num = parseFloat(notaStr);
        if (!isNaN(num)) {
          // REGRA DE OURO: nota 0 vira "" (em branco) para não prejudicar ausente
          notasPorAluno[nomeLimpo] = num === 0 ? null : num;
        } else {
          notasPorAluno[nomeLimpo] = null;
        }
      } else {
        notasPorAluno[nomeLimpo] = null;
      }
    }
  }

  return notasPorAluno;
}

module.exports = {
  lerPlanilhaExcel,
  normalizarNome
};
