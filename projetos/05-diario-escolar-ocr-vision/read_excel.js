const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'CAPITULOS', 'EM1_2026_BERNOULLI_FISICA_CONTEUDOS.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, {defval: ''});

const results = [];

data.forEach(row => {
    let frente = '';
    let capitulo = '';
    let assunto = '';

    for (const key in row) {
        if (key.toLowerCase().includes('frente')) frente = String(row[key]).trim();
        if (key.toLowerCase().includes('capítulo') || key.toLowerCase().includes('capitulo')) capitulo = String(row[key]).trim();
        if (key.toLowerCase().includes('assunto') || key.toLowerCase().includes('conteúdo') || key.toLowerCase().includes('tópico')) assunto = String(row[key]).trim();
    }

    if (frente || capitulo || assunto) {
        let code = frente + capitulo;
        if (code === 'A1' || code === 'A2' || code === 'B1') {
            results.push(`Frente ${frente} - Capítulo ${capitulo}: ${assunto}`);
        }
    }
});

console.log(JSON.stringify(results, null, 2));
