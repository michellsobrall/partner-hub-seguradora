#!/usr/bin/env bash
# ==============================================================================
# Partner Hub v1.7.0 - Script de Deploy Automatizado para AWS EC2 (Ubuntu 22.04/24.04)
# ==============================================================================
set -e

echo "=========================================================="
echo " Partner Hub v1.7.0 - Setup & Deploy AWS Ubuntu"
echo "=========================================================="

# 1. Instala Docker e Docker Compose v2 caso ainda não estejam instalados
if ! command -v docker &> /dev/null; then
  echo "[1/4] Instalando Docker Engine e Docker Compose plugin..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg git
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER" || true
else
  echo "[1/4] Docker já instalado."
fi

# 2. Cria o arquivo .env se ainda não existir
if [ ! -f ".env" ]; then
  echo "[2/4] Criando arquivo .env a partir do .env.example..."
  cp .env.example .env
  echo "ATENÇÃO: Edite o arquivo .env (nano .env) para inserir sua ASAAS_API_KEY e MAIL_PASSWORD!"
else
  echo "[2/4] Arquivo .env já presente."
fi

# 3. Constrói e sobe os containers em background
echo "[3/4] Construindo e iniciando containers (PostgreSQL, Backend Spring Boot e Frontend React)..."
sudo docker compose up -d --build

# 4. Exibe status
echo "[4/4] Status dos containers:"
sudo docker compose ps

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || hostname -I | awk '{print $1}')
echo "=========================================================="
echo " Deploy concluído com sucesso!"
echo " - Frontend Web:  http://${PUBLIC_IP}:5173"
echo " - API Backend:   http://${PUBLIC_IP}:8080/api/v1/health"
echo " - Webhook Asaas: http://${PUBLIC_IP}:8080/api/v1/finance/webhooks/asaas"
echo "=========================================================="

