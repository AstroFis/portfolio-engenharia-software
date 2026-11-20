const fs = require('fs');
const path = require('path');

const aulasPlanejadas = [
  "Apresentação da disciplina e Metodologia Científica aplicada à Física.",
  "Ensino por Investigação: Proposição de problema e coleta de dados iniciais.",
  "Atividade Prática: Execução de medidas de tempo e espaço em campo.",
  "Métodos Ativos: Análise de dados e cálculo da velocidade média das medidas.",
  "A1: Grandezas Físicas, Sistema Internacional (SI) e Notação Científica.",
  "A1: Conversão de unidades e algarismos significativos em medidas reais.",
  "A1: Conceitos fundamentais de movimento: Referencial, trajetória e posição.",
  "Aula destinada aos trabalhos da P1.",
  "B1: Introdução à Óptica - Fontes de luz e meios de propagação. ATIVIDADE DO BULLYING E A PERCEPÇÃO DAS CORES.",
  "B1: Princípios da Óptica Geométrica (Propagação retilínea e independência).",
  "B1: Fenômenos ópticos: Sombra, penumbra e fases da Lua.",
  "B1: Experimento Investigativo: Câmara Escura de Orifício.",
  "A1: Movimento Uniforme (MU) e a Função Horária da Posição.",
  "A1: Interpretação de gráficos de posição em função do tempo (s x t).",
  "A1: Construção de gráficos cinemáticos com dados experimentais reais.",
  "Revisão de conceitos e resolução de exercícios dos Capítulos A1 e B1.",
  "Avaliação P1.",
  "Correção e feedback da Avaliação P1.",
  "B1: Formação de Imagens e Reflexão da luz em Espelhos Planos.",
  "B1: Atividade Demonstrativa: Campo visual e rotação de espelhos planos.",
  "B1: Leis da Refração e o comportamento da luz ao mudar de meio.",
  "B1: Investigação Prática: Dispersão da luz e o disco de Newton.",
  "A2: Introdução à composição de movimentos: Princípio da Independência de Galileu.",
  "A2: Estudo do Movimento Relativo: Velocidade de aproximação e afastamento.",
  "A2: Análise de situações cotidianas: Barco atravessando um rio.",
  "A2: Exercícios investigativos sobre composição de movimentos.",
  "B1: Resolução de Situações-Problema envolvendo Óptica Geométrica.",
  "A2: Lançamento Horizontal: Fundamentos teóricos e equações.",
  "A2: Experimento Prático: Simulando um Lançamento Horizontal em sala.",
  "A2: Lançamento Oblíquo no Vácuo e a trajetória parabólica.",
  "A2: Demonstração: Alcance máximo e o efeito do ângulo de lançamento.",
  "A2: Movimento Circular Uniforme (MCU): Período, Frequência e Velocidade Angular.",
  "A2: Estudo de Relações de Transmissão: Coroas, catracas e engrenagens.",
  "A2: Aplicação do MCU no contexto de Satélites e órbitas.",
  "Revisão integradora: Cinemática Vetorial e Óptica (B1 e A2).",
  "Aprofundamento e Plantão de Dúvidas para a P2.",
  "Avaliação P2.",
  "Correção da Avaliação P2 e análise de resultados.",
  "Atividade de recuperação paralela: Revisitando conceitos críticos de Cinemática.",
  "Fechamento da Etapa: Autoavaliação e panorama da próxima etapa."
];

const basePath = path.join(__dirname, 'planilha_base.csv');
const outputPath = path.join(__dirname, 'DIARIO_FINAL_PREENCHIDO.csv');

const baseContent = fs.readFileSync(basePath, 'utf8').split('\n');
let finalCsv = baseContent[0] + '\n'; // Header

for (let i = 1; i < baseContent.length; i++) {
    let row = baseContent[i].trim();
    if (!row) continue;
    
    // O CSV original é: Aula;Data;Início;Término;Conteúdo previsto
    // Vamos garantir que se divide corretamente
    let parts = row.split(';');
    if (parts.length >= 4) {
        // Aula;Data;Inicio;Termino;Conteudo
        let content = aulasPlanejadas[i - 1] || '';
        parts[4] = content;
        finalCsv += parts.join(';') + '\n';
    }
}

fs.writeFileSync(outputPath, finalCsv, 'utf8');
console.log('Diário gerado com sucesso em DIARIO_FINAL_PREENCHIDO.csv');
