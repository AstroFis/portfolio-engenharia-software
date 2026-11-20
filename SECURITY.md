# 🛡️ Política de Segurança, DevSecOps & Conformidade LGPD (`SECURITY.md`)

Este repositório foi projetado sob o princípio de **Defesa em Profundidade (*Defense-in-Depth*)** e **Privacidade desde a Concepção (*Privacy by Design*)**, em conformidade com a **Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)** e as boas práticas de Governança de TI (**COBIT 4.1** e **ITIL**).

---

## 🔒 1. Camadas de Proteção Implementadas

1. **Isolamento Total de Documentos Pessoais (`.gitignore`):**
   - Os arquivos binários `.pdf` originais da pasta `Certificados/` contêm dados pessoais sensíveis (CPF, número de matrícula funcional/acadêmica, assinaturas físicas e dados de terceiros).
   - Por determinação de segurança, **nenhum arquivo `.pdf`, `.xlsx`, `.csv`, `.msi` ou `.exe` é rastreado pelo Git**. O catálogo público (`CATALOGO_CERTIFICADOS.md` e `index.html`) expõe exclusivamente metadados curriculares e códigos de verificação institucional.

2. **Sanitização Profunda de Código-Fonte (`./projetos/`):**
   - Todas as chaves de API (`Google Gemini`, `Firebase`), tokens OAuth, senhas de banco/portais e URLs de tenants privados foram removidos e substituídos por variáveis de ambiente documentadas em arquivos `.env.example`.
   - Dados de demonstração em sistemas corporativos (`seedData.ts`) foram anonimizados (telefones, CNPJs e CPFs mascarados).

3. **Firewall Pre-Commit Automatizado (`.githooks/pre-commit` + `scripts/auditoria_seguranca.js`):**
   - Antes de qualquer `git commit`, o hook nativo do Git executa o scanner `scripts/auditoria_seguranca.js`.
   - Caso qualquer arquivo *staged* contenha chaves `AIza...`, tokens `AQ...`, padrões de CPF, senhas, caminhos locais de usuário ou extensões proibidas, **o commit é automaticamente abortado**.

4. **Auditoria Contínua em Nuvem (`.github/workflows/security-scan.yml`):**
   - Pipeline do GitHub Actions que executa a mesma bateria de verificação a cada `push` ou `pull_request` na branch principal.

---

## 🧪 Como Executar a Auditoria Manualmente

Para verificar a integridade e segurança do repositório a qualquer momento, execute na raiz do projeto:

```bash
node scripts/auditoria_seguranca.js
```
