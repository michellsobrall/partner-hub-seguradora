# Script auxiliar para rodar o Backend Partner Hub no Windows
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   PARTNER HUB - INICIALIZADOR BACKEND   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verifica se o Java está instalado
$javaCmd = Get-Command java -ErrorAction SilentlyContinue

if ($javaCmd) {
    Write-Host "[OK] Java detectado: $(java -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
    
    # Verifica se Maven está instalado
    $mvnCmd = Get-Command mvn -ErrorAction SilentlyContinue
    if ($mvnCmd) {
        Write-Host "[OK] Maven detectado no PATH. Iniciando com mvn spring-boot:run..." -ForegroundColor Green
        mvn spring-boot:run
        exit
    }
}

# 2. Se Java ou Maven não estiverem instalados, executa via Docker (já testado e aprovado!)
Write-Host "[INFO] Maven ou Java não encontrados localmente. Utilizando o Docker Compose..." -ForegroundColor Yellow
Set-Location ..
docker compose up -d --build backend
Write-Host "[OK] Backend construído e iniciado via Docker!" -ForegroundColor Green
Write-Host "Acesse o Health Check em: http://localhost:8080/api/v1/health" -ForegroundColor Cyan
