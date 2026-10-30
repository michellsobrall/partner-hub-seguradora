# ==============================================================================
# Partner Hub v1.6.0 - Script Automatizado de Versionamento e Push para o GitHub
# ==============================================================================

param(
    [string]$RepoUrl = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Partner Hub v1.6.0 - Preparando Repositorio Git" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Inicializa o repositório caso ainda não exista
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Inicializando repositório Git local..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "[1/4] Repositório Git já inicializado." -ForegroundColor Green
}

# 2. Garante a branch principal como 'main'
git branch -M main

# 3. Adiciona os arquivos respeitando o .gitignore (.env locais ignorados)
Write-Host "[2/4] Adicionando arquivos das Sprints 00 a 06..." -ForegroundColor Yellow
git add .

# 4. Cria o commit consolidado se houver alterações pendentes
$status = git status --porcelain
if ($status) {
    Write-Host "[3/4] Criando commit da release v1.6.0..." -ForegroundColor Yellow
    git commit -m "feat: release Partner Hub v1.6.0 (Sprints 00 a 06 completas com JWT e RBAC)"
    Write-Host "Commit criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "[3/4] Nenhuma alteração pendente para commit." -ForegroundColor Green
}

# 5. Conecta ao repositório remoto do GitHub e envia (Push)
if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
    # Se o usuário tiver o GitHub CLI (gh) instalado e autenticado, oferece criação automática
    if (Get-Command "gh" -ErrorAction SilentlyContinue) {
        Write-Host "[4/4] GitHub CLI (gh) detectado! Criando repositório 'partner-hub-seguradora'..." -ForegroundColor Yellow
        gh repo create partner-hub-seguradora --private --source=. --remote=origin --push
        Write-Host "Projeto enviado para o GitHub com sucesso!" -ForegroundColor Green
        exit 0
    }

    Write-Host ""
    Write-Host "Informe a URL do seu repositório no GitHub (ex: https://github.com/SEU-USUARIO/partner-hub.git)" -ForegroundColor Cyan
    $RepoUrl = Read-Host "URL do Repositório GitHub"
}

if (-not [string]::IsNullOrWhiteSpace($RepoUrl)) {
    Write-Host "[4/4] Configurando remote 'origin' e enviando para o GitHub..." -ForegroundColor Yellow
    $existingRemote = git remote
    if ($existingRemote -contains "origin") {
        git remote set-url origin $RepoUrl
    } else {
        git remote add origin $RepoUrl
    }

    git push -u origin main
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " Sucesso! Código publicado em: $RepoUrl" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "Commit local concluído! Quando criar o repositório no GitHub, rode:" -ForegroundColor Yellow
    Write-Host "  .\publish-github.ps1 -RepoUrl https://github.com/SEU-USUARIO/partner-hub.git" -ForegroundColor White
}

