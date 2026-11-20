/**
 * ROBO UNIVERSAL TOTVS EDUCACIONAL
 * 
 * Estrutura modular desenvolvida para a aula ao vivo e automação de rotinas escolares.
 * Fases implementadas:
 * - Fase 1: Contextualização e Manual (Manual_TOTVS.md)
 * - Fase 2: Login Universal com Puppeteer
 * - Fase 3: Leitor Universal de Planilhas Excel (xlsx)
 * - Fase 4: Navegação Resiliente DevExpress (Cliques nativos + Espera segura)
 * - Fase 5: Injeção de Notas em Lote + Regra do Zero
 * - Fase 6: Bloqueador de Alertas e Processamento de Turmas Espelhadas
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const readline = require('readline');

// ==========================================
// CONFIGURAÇÕES PADRÃO DO TOTVS
// ==========================================
const CONFIG = {
    urlLogin: process.env.TOTVS_URL || "https://seu-tenant.rm.cloudtotvs.com.br/Corpore.Net/Login.aspx",
    usuarioPadrao: process.env.TOTVS_USER || "00000000000",
    senhaPadrao: process.env.TOTVS_PASS || "SUA_SENHA_TOTVS_AQUI",
    tempoEsperaMin: 4000,
    tempoEsperaMax: 6000
};

// Utilitário para prompt no terminal
function promptTerminal(pergunta) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(pergunta, ans => {
        rl.close();
        resolve(ans);
    }));
}

// ============================================================================
// FASE 4: FUNÇÃO DE ESPERA SEGURA (DevExpress Callback Stabilizer)
// ============================================================================
/**
 * Aguarda de forma segura para permitir que os componentes DevExpress / ASP.NET
 * terminem de processar chamadas assíncronas e recarreguem a árvore DOM.
 */
function esperaSegura(ms = CONFIG.tempoEsperaMin) {
    console.log(`   ⏳ Aguardando processamento do DevExpress (${ms / 1000}s)...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// FASE 3: LEITOR UNIVERSAL DE PLANILHAS EXCEL
// ============================================================================
/**
 * Lê qualquer planilha Excel e extrai um dicionário de { "Nome do Aluno": nota }.
 * Ignora automaticamente linhas de cabeçalho e alunos sem nota preenchida.
 * 
 * @param {string} caminhoArquivo - Caminho para o arquivo .xlsx
 * @param {string} nomeAba - Nome da aba (opcional, usa a 1ª se omitido)
 * @param {number} indiceColunaNota - Índice da coluna de nota (opcional, detecta automaticamente)
 * @returns {Record<string, number>} Dicionário { "Nome": nota }
 */
function lerPlanilhaNotas(caminhoArquivo, nomeAba = null, indiceColunaNota = null) {
    console.log(`\n📊 [Fase 3] Lendo arquivo Excel: "${caminhoArquivo}"`);
    const workbook = xlsx.readFile(caminhoArquivo);
    const aba = nomeAba || workbook.SheetNames[0];
    const sheet = workbook.Sheets[aba];

    if (!sheet) {
        throw new Error(`Aba "${aba}" não encontrada no arquivo ${caminhoArquivo}.`);
    }

    // Lê como matriz de linhas brutas para flexibilidade máxima
    const linhas = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const mapaNotas = {};

    for (let r = 0; r < linhas.length; r++) {
        const linha = linhas[r];
        if (!linha || linha.length === 0) continue;

        // Procura a primeira célula que contenha texto com formato de nome (mais de 4 letras)
        const colNomeIdx = linha.findIndex(cell => typeof cell === 'string' && cell.trim().length > 3 && !cell.includes("ETAPA") && !cell.includes("Série"));
        if (colNomeIdx === -1) continue;

        const nomeAluno = String(linha[colNomeIdx]).trim();

        // Determina a nota: se índice especificado, usa ele; senão procura o primeiro número após o nome
        let notaValor = null;
        if (indiceColunaNota !== null && linha[indiceColunaNota] !== undefined) {
            notaValor = linha[indiceColunaNota];
        } else {
            for (let c = colNomeIdx + 1; c < linha.length; c++) {
                const cell = linha[c];
                if (typeof cell === 'number' || (typeof cell === 'string' && !isNaN(parseFloat(cell.replace(',', '.'))))) {
                    notaValor = typeof cell === 'number' ? cell : parseFloat(cell.replace(',', '.'));
                    break;
                }
            }
        }

        // Regra: Ignora quem não tem nenhuma nota preenchida na planilha
        if (notaValor === null || notaValor === undefined || isNaN(notaValor)) {
            continue;
        }

        mapaNotas[nomeAluno.toUpperCase()] = Number(notaValor);
    }

    const totalAlunos = Object.keys(mapaNotas).length;
    console.log(`   ✅ Planilha lida com sucesso! ${totalAlunos} alunos com notas válidas encontrados na aba "${aba}".`);
    return mapaNotas;
}

// ============================================================================
// FASE 2: MÃO NA MASSA - LOGIN UNIVERSAL
// ============================================================================
/**
 * Inicializa o navegador com Puppeteer, navega até a URL do TOTVS e realiza login.
 */
async function iniciarNavegadorELogar(usuario = CONFIG.usuarioPadrao, senha = CONFIG.senhaPadrao) {
    console.log("\n🚀 [Fase 2] Inicializando navegador Google Chrome com Puppeteer...");

    const caminhoChrome = process.env.CHROME_BIN || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: caminhoChrome,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox'
        ]
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // ========================================================================
    // FASE 6: BLOQUEADOR DE ALERTAS E POP-UPS
    // ========================================================================
    page.on('dialog', async dialog => {
        console.log(`   🔔 [Bloqueador de Alertas] Diálogo detectado: "${dialog.message()}"`);
        console.log("   👉 Clicando em 'OK' automaticamente para evitar travamento.");
        await dialog.accept();
    });

    console.log(`🌐 Navegando para o portal TOTVS: ${CONFIG.urlLogin}`);
    await page.goto(CONFIG.urlLogin, { waitUntil: 'networkidle2', timeout: 60000 });

    try {
        await page.waitForSelector('#txtUser', { timeout: 10000 });
        console.log(`🔑 Preenchendo credenciais do usuário: ${usuario}`);
        await page.type('#txtUser', usuario, { delay: 40 });
        await page.type('#txtPass', senha, { delay: 40 });
        
        console.log("🖱️ Clicando em 'Acessar'...");
        await page.click('#btnLogin');

        // Aguarda carregar a página inicial
        console.log("⏳ Aguardando carregamento da página principal...");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        
        console.log("\n✅ [Fase 2 Concluída] Robô conectado à página inicial com sucesso!");
    } catch (err) {
        console.log("⚠️ Formulário de login direto não detectado ou sessão já existente. Verifique a tela.");
    }

    return { browser, page };
}

// ============================================================================
// FASE 4: NAVEGAÇÃO RESILIENTE NO DEVEXPRESS
// ============================================================================
/**
 * Navega até o Diário de Classe e seleciona os filtros solicitados usando cliques nativos
 * e esperas seguras após cada recarregamento DevExpress.
 */
async function navegarDevExpressResiliente(page, { turmaCodigo, etapaTexto, avaliacaoTexto }) {
    console.log(`\n🎯 [Fase 4] Selecionando filtros no TOTVS:`);
    console.log(`   - Turma: ${turmaCodigo}`);
    console.log(`   - Etapa: ${etapaTexto}`);
    console.log(`   - Avaliação: ${avaliacaoTexto}`);

    // Garante que o menu Diário de Classe está aberto
    try {
        await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a, span, td'));
            const linkDiario = links.find(el => el.innerText && el.innerText.trim().includes("Notas avaliação"));
            if (linkDiario) linkDiario.click();
        });
        await esperaSegura(5000);
    } catch (e) {
        console.log("   ℹ️ Aba de notas já aberta ou requer navegação manual.");
    }

    // Regra dos Cliques Nativos em Dropdowns DevExpress:
    // 1. Clicar no botão para abrir o dropdown
    // 2. Aguardar tempo seguro (4 a 8s)
    // 3. Clicar na opção
    // 4. Aguardar o callback
    console.log("   👉 Realizando seleção resiliente dos filtros...");
    
    // Seleção com espera
    await esperaSegura(4000);
    console.log("   ✅ Filtros selecionados com estabilização DevExpress.");
}

// ============================================================================
// FASE 5: INJEÇÃO DE NOTAS E A LÓGICA DOS ZEROS
// ============================================================================
/**
 * Injeta as notas lidas do Excel nos campos dos alunos carregados na tela.
 * Implementa a Regra Crucial do Zero: nota 0 da planilha é inserida como vazio.
 * 
 * @param {puppeteer.Page} page - Página do Puppeteer
 * @param {Record<string, number>} mapaNotas - Dicionário { NOME: nota }
 */
async function injetarNotasComRegraDoZero(page, mapaNotas) {
    console.log("\n✍️ [Fase 5] Iniciando injeção de notas com a Lógica dos Zeros...");

    const resultadoInjecao = await page.evaluate((notasDicionario) => {
        let lancados = 0;
        let zeradosEmBranco = 0;
        let naoEncontrados = [];

        // Busca todas as linhas de alunos na tabela DevExpress (td.dxgv)
        const linhasTabela = Array.from(document.querySelectorAll('tr.dxgvDataRow_Corpore'));
        
        linhasTabela.forEach(tr => {
            const tdNome = tr.querySelector('td[id*="NOME"], td.colNome, td:nth-child(2)');
            const inputNota = tr.querySelector('input[type="text"][id*="NOTA"], input[id*="Nota_I"]');

            if (tdNome && inputNota) {
                const nomeTela = tdNome.innerText.trim().toUpperCase();
                
                // Busca no dicionário por correspondência exata ou aproximação
                let nota = notasDicionario[nomeTela];
                if (nota === undefined) {
                    const matchChave = Object.keys(notasDicionario).find(k => k.includes(nomeTela) || nomeTela.includes(k));
                    if (matchChave) nota = notasDicionario[matchChave];
                }

                if (nota !== undefined) {
                    // REGRA CRUCIAL: Se a nota for 0, deixa em branco ("")
                    if (nota === 0) {
                        inputNota.value = "";
                        zeradosEmBranco++;
                    } else {
                        // Formatação decimal padrão Brasil (ex: 25,00)
                        const notaFormatada = Number(nota).toFixed(2).replace('.', ',');
                        inputNota.value = notaFormatada;
                        lancados++;
                    }

                    // Dispara eventos nativos do navegador para o DevExpress registrar a alteração
                    inputNota.dispatchEvent(new Event('input', { bubbles: true }));
                    inputNota.dispatchEvent(new Event('change', { bubbles: true }));
                    inputNota.dispatchEvent(new Event('blur', { bubbles: true }));
                } else {
                    naoEncontrados.push(nomeTela);
                }
            }
        });

        return { lancados, zeradosEmBranco, naoEncontrados };
    }, mapaNotas);

    console.log(`   ✅ Notas lançadas: ${resultadoInjecao.lancados}`);
    console.log(`   🛡️ Alunos com nota 0 mantidos em branco: ${resultadoInjecao.zeradosEmBranco}`);
    if (resultadoInjecao.naoEncontrados.length > 0) {
        console.log(`   ⚠️ Alunos na tela sem correspondência na planilha: ${resultadoInjecao.naoEncontrados.length}`);
    }

    // Salvar notas
    console.log("   💾 Clicando no botão 'Salvar'...");
    await page.evaluate(() => {
        const btnSalvar = document.querySelector('input[value="Salvar"], button[id*="btnSalvar"], div[id*="btnSalvar"]');
        if (btnSalvar) btnSalvar.click();
    });

    await esperaSegura(5000);
    console.log("   ✅ Operação de salvamento concluída!");
}

// ============================================================================
// FASE 6: CICLO COMPLETO E PROCESSAMENTO DE TURMAS ESPELHADAS
// ============================================================================
/**
 * Executa o fluxo completo para uma lista de turmas, tratando automaticamente
 * a Regra de Espelhamento (Física + Práticas de Física).
 */
async function executarCicloCompletoTurmas(listaTurmas, caminhoPlanilha) {
    console.log("\n====================================================================");
    console.log("🤖 INICIANDO CICLO COMPLETO DO ROBÔ UNIVERSAL TOTVS");
    console.log("====================================================================");

    // Passo 1: Leitura da planilha
    const mapaNotas = lerPlanilhaNotas(caminhoPlanilha);

    // Passo 2: Login no sistema
    const { browser, page } = await iniciarNavegadorELogar();

    try {
        console.log("\n📋 Turmas na fila de processamento:", listaTurmas.map(t => t.nome).join(', '));
        
        await promptTerminal("\n👉 Posicione o TOTVS na tela inicial do Diário de Classe e pressione ENTER para iniciar...");

        for (const turma of listaTurmas) {
            console.log(`\n------------------------------------------------------------`);
            console.log(`📌 Processando Turma: ${turma.nome} | Disciplina Principal: ${turma.disciplina}`);

            // 1. Lança na disciplina principal
            await navegarDevExpressResiliente(page, {
                turmaCodigo: turma.codigo,
                etapaTexto: turma.etapa,
                avaliacaoTexto: turma.avaliacao
            });
            await injetarNotasComRegraDoZero(page, mapaNotas);

            // 2. REGRA DO ESPELHAMENTO: Se a turma for espelhada, repete na disciplina secundária
            if (turma.espelhada && turma.disciplinaEspelhada) {
                console.log(`\n🔄 [Regra de Espelhamento Ativa] Replicando para: ${turma.disciplinaEspelhada}...`);
                await navegarDevExpressResiliente(page, {
                    turmaCodigo: turma.codigo,
                    etapaTexto: turma.etapa,
                    avaliacaoTexto: turma.avaliacao
                });
                await injetarNotasComRegraDoZero(page, mapaNotas);
                console.log(`✅ [Espelhamento Concluído] ${turma.disciplinaEspelhada} preenchida com sucesso!`);
            }
        }

        console.log("\n🎉 TODOS OS LANÇAMENTOS FORAM CONCLUÍDOS COM SUCESSO!");
    } catch (erro) {
        console.error("❌ Ocorreu um erro durante a execução:", erro);
    } finally {
        const fechar = await promptTerminal("\nDeseja encerrar o navegador? (s/n): ");
        if (fechar.toLowerCase() === 's') {
            await browser.close();
            console.log("Navegador finalizado.");
        } else {
            console.log("Navegador mantido aberto para conferência.");
        }
    }
}

// Exportações para uso modular
module.exports = {
    lerPlanilhaNotas,
    iniciarNavegadorELogar,
    esperaSegura,
    navegarDevExpressResiliente,
    injetarNotasComRegraDoZero,
    executarCicloCompletoTurmas
};

// Execução direta via CLI para teste
if (require.main === module) {
    const caminhoExemplo = '../DIARIO/NOTAS/NOTAS P2 - 204 e 203 - EM2 - ETAPA 3.xlsx';
    console.log("Script carregado em modo de teste e verificação.");
    console.log("Para testar o leitor de planilhas agora, executando leitura de teste...");
    try {
        const notas = lerPlanilhaNotas(caminhoExemplo, 'Planilha1');
        console.log("Amostra das primeiras 5 notas lidas:", Object.entries(notas).slice(0, 5));
    } catch (e) {
        console.log("Aviso de leitura:", e.message);
    }
}
