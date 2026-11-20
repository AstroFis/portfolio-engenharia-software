const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const prompt = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
    console.log("=== Automação de Diário com IA (Modo Lote Avançado) ===\n");

    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        apiKey = await prompt("Cole sua chave da API do Google Gemini: ");
    }
    if (!apiKey) {
        console.log("❌ Chave obrigatória para o modo de planejamento em lote.");
        process.exit(1);
    }
    
    const banco = JSON.parse(fs.readFileSync('banco_bernoulli_fisica.json', 'utf-8'));
    
    console.log("\n--- Informações do Módulo ---");
    const frente_capitulo = await prompt("Qual a Frente e Capítulo? (ex: A3): ");
    const serie = await prompt("Qual a série? (ex: 1ª Série, 4V): ");
    
    const aulaDb = banco.find(a => a.codigo.toUpperCase() === frente_capitulo.toUpperCase() && a.metadados.includes(serie));
    
    if (!aulaDb) {
        console.log(`\n❌ Aula não encontrada no banco de dados para ${frente_capitulo} - ${serie}.`);
        process.exit(1);
    }
    
    console.log(`\n✅ Capítulo: "${aulaDb.titulo}"`);
    
    const numAulas = parseInt(await prompt("Quantas aulas você vai dedicar para este capítulo inteiro? (ex: 6): "), 10);
    const aulaInicialTotvs = parseInt(await prompt("Qual o NÚMERO da primeira aula na tabela do TOTVS? (ex: 42): "), 10);
    
    let conteudosGerados = [];
    
    console.log("\n🧠 Pedindo para a IA planejar a sequência pedagógica...");
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const promptIA = `Você é um excelente professor de Física de Ensino Médio. 
Você vai ministrar o capítulo "${aulaDb.titulo}" ao longo de exatamente ${numAulas} aulas.
Divida esse capítulo em uma sequência lógica de aprendizagem contendo teoria, aprofundamento, exemplos e aulas focadas em "Resolução de exercícios".
Para cada aula, crie um subtópico descritivo de até 10 palavras.

REGRA DE FORMATAÇÃO DO TEXTO FINAL PARA CADA AULA:
"${frente_capitulo.toUpperCase()}: ${aulaDb.titulo} [Seu Subtópico]" (sem hífen antes do subtópico, apenas um espaço).

Retorne APENAS um array em formato JSON válido contendo as ${numAulas} strings.
Não adicione formatação de markdown como \`\`\`json. Apenas o array literal.
Exemplo esperado de retorno:
[
  "${frente_capitulo.toUpperCase()}: ${aulaDb.titulo} Introdução e conceitos fundamentais",
  "${frente_capitulo.toUpperCase()}: ${aulaDb.titulo} Aprofundamento teórico",
  "${frente_capitulo.toUpperCase()}: ${aulaDb.titulo} Resolução de exercícios de fixação"
]`;
        
        const result = await model.generateContent(promptIA);
        let textoResposta = result.response.text().trim();
        // Remove possiveis backticks de markdown
        textoResposta = textoResposta.replace(/```json/g, '').replace(/```/g, '').trim();
        
        conteudosGerados = JSON.parse(textoResposta);
        
        if(conteudosGerados.length !== numAulas) {
            console.log("⚠️ A IA gerou uma quantidade diferente de aulas. Ajustando...");
            conteudosGerados = conteudosGerados.slice(0, numAulas);
        }
        
    } catch (err) {
        console.log("❌ Erro ao consultar a IA ou ao interpretar a resposta:", err.message);
        process.exit(1);
    }
    
    console.log("\n📚 Cronograma Gerado pela IA:");
    conteudosGerados.forEach((conteudo, i) => {
        console.log(`Aula ${aulaInicialTotvs + i}: ${conteudo}`);
    });
    
    const confirma = await prompt("\nO cronograma ficou bom? Podemos preencher no TOTVS? (s/n): ");
    if (confirma.toLowerCase() !== 's') {
        console.log("Operação cancelada. Você pode rodar novamente para gerar um novo cronograma.");
        process.exit(0);
    }

    console.log("\nAbrindo o navegador de forma furtiva...");
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();
    
    console.log("Fazendo login automático no TOTVS...");
    await page.goto("https://seu-tenant.rm.cloudtotvs.com.br/Corpore.Net/Login.aspx", { waitUntil: 'networkidle2' });
    
    try {
        await page.waitForSelector('#txtUser', { timeout: 10000 });
        await require('../totvs_login').preencherCredenciais(page);
        await page.click('#btnLogin');
        console.log("Login enviado! Aguardando o portal carregar...");
        await page.waitForSelector('text=Diário de classe', { timeout: 15000 });
        console.log("✅ Login bem-sucedido!");
    } catch (e) {
        console.log("⚠️ Faça o login na tela.");
    }

    console.log("\n========================================================");
    console.log("🤖 Agora, dentro do TOTVS que está aberto:");
    console.log("1. Clique em 'Diário de Classe'.");
    console.log("2. Selecione a sua turma e a Etapa correspondente.");
    console.log("3. Quando a tabela de aulas carregar na tela,");
    console.log("   VOLTE AQUI NO TERMINAL E APERTE ENTER!");
    console.log("========================================================");
    
    await prompt("Pressione ENTER somente quando a lista de aulas estiver carregada...");
    
    console.log("\n🚀 Iniciando injeção em lote no TOTVS...");
    
    // Função auxiliar para injetar na página
    await page.evaluate(() => {
        window.editRow = async (num, text) => {
            return new Promise((resolve) => {
                const tds = Array.from(document.querySelectorAll('td.dxgv'));
                let tdAula = tds.find(td => td.innerText.trim() === num.toString());
                if (!tdAula) return resolve(false);
                
                const tr = tdAula.closest('tr');
                const btn = tr.querySelector('div[data-args*="StartEdit"]');
                if (!btn) return resolve(false);
                
                btn.click();
                
                let attempts = 0;
                const checkTextarea = setInterval(() => {
                    const textarea = document.querySelector('textarea[id*="xmConteudoEfet_I"]');
                    if (textarea) {
                        clearInterval(checkTextarea);
                        textarea.value = text;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.dispatchEvent(new Event('change', { bubbles: true }));
                        textarea.dispatchEvent(new Event('blur', { bubbles: true }));
                        
                        const saveBtn = Array.from(document.querySelectorAll('div.dxb, span')).find(b => b.innerText.trim() === 'Salvar');
                        if (saveBtn) {
                            saveBtn.click();
                            const checkSave = setInterval(() => {
                                if (!document.querySelector('textarea[id*="xmConteudoEfet_I"]')) {
                                    clearInterval(checkSave);
                                    resolve(true);
                                }
                            }, 500);
                        } else resolve(false);
                    }
                    attempts++;
                    if (attempts > 20) { clearInterval(checkTextarea); resolve(false); }
                }, 500);
            });
        };
    });

    // Loop pelas aulas geradas
    for (let i = 0; i < numAulas; i++) {
        const aulaAtual = aulaInicialTotvs + i;
        const textoDaAula = conteudosGerados[i];
        
        console.log(`⏳ Preenchendo Aula ${aulaAtual}...`);
        
        const success = await page.evaluate(async (num, txt) => {
            return await window.editRow(num, txt);
        }, aulaAtual, textoDaAula);
        
        if (success) {
            console.log(`   ✅ Sucesso!`);
        } else {
            console.log(`   ❌ Falha ao encontrar/salvar a Aula ${aulaAtual}.`);
        }
    }
    
    console.log("\n🎉 Concluído! O cronograma inteiro foi salvo no TOTVS.");
    console.log("Você pode fechar o navegador.");
    rl.close();
}

main().catch(err => console.log(err));
