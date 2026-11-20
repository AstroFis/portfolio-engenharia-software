# Manual_TOTVS.md - Regras Gerais e Diretrizes do Assistente

Este documento serve como a base de regras e memória operacional do assistente de automação escolar para o sistema TOTVS Educacional.

---

## 🏫 1. Sistema Utilizado
* **Plataforma:** TOTVS Educacional (Portal Corpore.Net).
* **Interface & Tecnologia:** Aplicação web baseada em ASP.NET e componentes DevExpress (`UpdatePanels`, tabelas `dxgv`, callbacks assíncronos a cada interação).
* **Modo de Acesso:** Navegação automatizada controlada via Puppeteer (visível/assistida), com tratamento de esperas resilientes.

---

## 🔄 2. Regra de Espelhamento (Disciplinas Integradas)
* **Conceito:** Determinadas turmas possuem disciplinas integradas e interdependentes (por exemplo, turmas que cursam simultaneamente **"Física"** e **"Práticas de Física"**, como as turmas D / itinerários formativos).
* **Diretriz de Execução:**
  1. Quando for solicitado o lançamento de notas de uma **turma espelhada**, o robô deve obrigatoriamente replicar as **mesmas notas para ambas as disciplinas**.
  2. O lançamento ocorre primeiro na disciplina principal (Física) e, em seguida, na disciplina espelhada (Práticas de Física), utilizando a mesma base de notas dos alunos.
* **Turmas Normais:**
  * Turmas regulares ou sem disciplinas espelhadas recebem o lançamento estritamente na disciplina padrão correspondente.

---

## 🛡️ 3. Regra de Proteção de Dados (Regra do Zero)
* **Nota 0 vs. Aluno Ausente:**
  * Uma nota digitada como `0` na planilha de notas offline geralmente representa um aluno faltoso ou que ainda fará 2ª chamada/recuperação.
  * No TOTVS, lançar `0` formaliza reprovação ou zera a nota no sistema antes da oportunidade de avaliação.
  * **Comportamento Obrigatório:** Se a nota na planilha for `0`, o campo no TOTVS deve ser mantido **em branco** (vazio). Notas válidas superiores a zero são lançadas normalmente (ex: `25,00`).

---

## ⚡ 4. Tratamento de Pop-ups e Alertas
* O sistema TOTVS exibe caixas de diálogo nativas (ex.: *"Digitação efetuada com sucesso"*).
* O robô deve manter um interceptador ativo (`page.on('dialog')`) para aceitar (`dialog.accept()`) esses avisos imediatamente, prevenindo congelamento da execução.
