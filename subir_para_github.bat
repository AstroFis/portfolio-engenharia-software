@echo off
chcp 65001 > nul
title Upload Seguro para o GitHub — Portfólio Lucas Cabral

echo ====================================================================
echo 🛡️  UPLOAD SEGURO PARA O GITHUB (PORTFÓLIO DE ENGENHARIA & IA)
echo ====================================================================
echo Candidato: Lucas Drumond de Magalhães Cabral
echo E-mail: 27.drummond@gmail.com
echo ====================================================================
echo.

:: 1. Verificar se o Git está instalado
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERRO: O Git não foi encontrado no seu sistema.
    echo Por favor, certifique-se de que o Git está instalado.
    pause
    exit /b 1
)

:: 2. Executar Auditoria de Segurança Obrigatória
echo 🔍 [Passo 1/4] Executando Auditoria de Segurança & Conformidade LGPD...
node scripts\auditoria_seguranca.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ BLOQUEIO DE SEGURANÇA: A auditoria detectou arquivos sensíveis ou credenciais!
    echo O upload foi cancelado preventivamente para proteger seus dados.
    pause
    exit /b 1
)

echo.
echo ✅ AUDITORIA APROVADA: 100%% Seguro, livre de chaves de API, senhas e documentos pessoais.
echo.

:: 3. Configurar Identidade do Git se necessário
git config user.name >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚙️  Configurando identidade Git...
    git config --global user.name "Lucas Drumond Cabral"
    git config --global user.email "27.drummond@gmail.com"
)

:: 4. Solicitar a URL do repositório no GitHub
echo ====================================================================
echo 🌐 [Passo 2/4] Conexão com seu GitHub
echo ====================================================================
echo Crie um repositório NOVO e VAZIO no GitHub (ex: portfolio-engenharia-software):
echo   1. Acesse: https://github.com/new
echo   2. Digite o nome: portfolio-engenharia-software (ou o nome que preferir)
echo   3. Deixe desmarcada a opção "Add a README file"
echo   4. Clique em "Create repository"
echo ====================================================================
echo.
set /p REPO_URL="Cole aqui a URL HTTPS do seu repositório GitHub: "

if "%REPO_URL%"=="" (
    echo ❌ URL não informada. O processo foi cancelado.
    pause
    exit /b 1
)

echo.
echo 📦 [Passo 3/4] Inicializando repositório Git local e preparando commit...

if not exist ".git" (
    git init
    git branch -M main
)

:: Ativar hooks de segurança pre-commit
git config core.hooksPath .githooks

git add .
git commit -m "feat: portfolio oficial de engenharia de software, rpa e ia - Lucas Drumond Cabral"

:: Configurar ou atualizar URL remota
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

echo.
echo 🚀 [Passo 4/4] Enviando código para o GitHub...
echo (Se o GitHub solicitar login, abrirá uma janelinha do navegador para você autorizar)
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ====================================================================
    echo 🎉 SUCESSO ABSOLUTO!
    echo Seu portfólio de programação foi publicado no GitHub com segurança total!
    echo Acesse: %REPO_URL%
    echo ====================================================================
) else (
    echo.
    echo ⚠️ Houve uma falha no envio para o GitHub.
    echo Verifique se a URL informada está correta e se você possui permissão no repositório.
)

echo.
pause
