@echo off
chcp 65001 > nul
title Publicar Portfólio no GitHub — AstroFis
color 0B

echo ====================================================================
echo 🚀 PUBLICANDO SEU PORTFÓLIO NO GITHUB
echo ====================================================================
echo 👤 Usuário: AstroFis
echo 📦 Repositório: https://github.com/AstroFis/portfolio-engenharia-software
echo ====================================================================
echo.

cd /d "%~dp0"

echo 🔍 Verificando integridade e branch...
git status
echo.
echo 📤 Enviando os 7 projetos e documentação para o GitHub...
echo.

git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ====================================================================
    echo 🎉 SUCESSO ABSOLUTO! 
    echo Seu portfólio oficial de programação e IA foi publicado no GitHub!
    echo Acesse agora: https://github.com/AstroFis/portfolio-engenharia-software
    echo ====================================================================
) else (
    echo ====================================================================
    echo ⚠️ Caso tenha aparecido uma janela solicitando login do GitHub:
    echo Conclua o login na janela e aperte qualquer tecla para tentar novamente.
    echo ====================================================================
)

echo.
pause
