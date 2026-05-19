#!/bin/bash

# ==============================================================================
# Script de Deploy Automatizado - Sistema Estrela BI
# Target OS: Debian GNU/Linux 11/12/13
# ==============================================================================

# Cores para output formatado
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0;5m' # Sem Cor
CLEAR='\033[0m'

echo -e "${BLUE}======================================================================${CLEAR}"
echo -e "${GREEN}          🌟 INICIANDO DEPLOY AUTOMATIZADO - DISTRIBUIDORA ESTRELA 🌟${CLEAR}"
echo -e "${BLUE}======================================================================${CLEAR}"

# 1. Verificar privilégios de root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Erro: Por favor, execute este script como root ou usando sudo.${CLEAR}"
  exit 1
fi

# Detectar diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# 2. Verificar/Instalar Docker e Docker Compose no Debian
echo -e "\n${BLUE}[Passo 1/6] Verificando dependências do sistema...${CLEAR}"
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠️ Docker não encontrado. Instalando Docker...${CLEAR}"
  apt-get update
  apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}✅ Docker instalado com sucesso!${CLEAR}"
else
  echo -e "${GREEN}✅ Docker já está instalado.${CLEAR}"
fi

if ! docker compose version &> /dev/null; then
  echo -e "${YELLOW}⚠️ Docker Compose (V2) não encontrado. Instalando compose plugin...${CLEAR}"
  apt-get install -y docker-compose-plugin
  echo -e "${GREEN}✅ Docker Compose plugin instalado com sucesso!${CLEAR}"
else
  echo -e "${GREEN}✅ Docker Compose já está instalado.${CLEAR}"
fi

# Verificar/Instalar Nginx e Certbot
if ! command -v nginx &> /dev/null; then
  echo -e "${YELLOW}⚠️ Nginx não encontrado. Instalando Nginx...${CLEAR}"
  apt-get update
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
  echo -e "${GREEN}✅ Nginx instalado com sucesso!${CLEAR}"
else
  echo -e "${GREEN}✅ Nginx já está instalado.${CLEAR}"
fi

if ! command -v certbot &> /dev/null; then
  echo -e "${YELLOW}⚠️ Certbot não encontrado. Instalando Certbot...${CLEAR}"
  apt-get install -y certbot python3-certbot-nginx
  echo -e "${GREEN}✅ Certbot instalado com sucesso!${CLEAR}"
else
  echo -e "${GREEN}✅ Certbot já está instalado.${CLEAR}"
fi

# 3. Gerar chaves e segredos JWT de alta entropia automaticamente
echo -e "\n${BLUE}[Passo 2/6] Configurando chaves de segurança e segredos...${CLEAR}"
BACKEND_ENV="$PROJECT_ROOT/backend/.env.production"
FRONTEND_ENV="$PROJECT_ROOT/frontend/.env.production"

# Gerar chaves aleatórias caso não existam
JWT_SEC=$(openssl rand -hex 32)
JWT_ACC=$(openssl rand -hex 32)
JWT_REF=$(openssl rand -hex 32)

# Parâmetros de Banco de Dados Padrão (conforme respondido pelo usuário)
DEFAULT_DB_SERVER="100.76.189.43"
DEFAULT_DB_USER="bi_user"
DEFAULT_DB_NAME="DistribuidoraEstrela"
DEFAULT_DB_PORT="1433"

# Perguntar interativamente pela senha do banco de dados (secreto)
echo -e "${YELLOW}Configure a conexão com o banco SQL Server real da Distribuidora Estrela:${CLEAR}"
read -p "Servidor SQL Server [$DEFAULT_DB_SERVER]: " DB_SERVER
DB_SERVER=${DB_SERVER:-$DEFAULT_DB_SERVER}

read -p "Usuário do Banco [$DEFAULT_DB_USER]: " DB_USER
DB_USER=${DB_USER:-$DEFAULT_DB_USER}

read -s -p "Senha do usuário $DB_USER (obrigatório): " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
  echo -e "${RED}❌ Erro: A senha do banco de dados não pode ser vazia!${CLEAR}"
  exit 1
fi

read -p "Nome do Banco [$DEFAULT_DB_NAME]: " DB_NAME
DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}

read -p "Porta do Banco [$DEFAULT_DB_PORT]: " DB_PORT
DB_PORT=${DB_PORT:-$DEFAULT_DB_PORT}

# Gerar arquivos .env
echo -e "\n${YELLOW}Injetando variáveis de ambiente em $BACKEND_ENV...${CLEAR}"

cat <<EOT > "$BACKEND_ENV"
PORT=3000
NODE_ENV=production

# SQL Server Configuration
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SERVER=$DB_SERVER
DB_NAME=$DB_NAME
DB_PORT=$DB_PORT

# JWT Configuration
JWT_SECRET=$JWT_SEC
JWT_ACCESS_SECRET=$JWT_ACC
JWT_REFRESH_SECRET=$JWT_REF
JWT_EXPIRES_IN=24h
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d

# Bootstrap User Configuration
AUTH_BOOTSTRAP_ID=marcus-admin
AUTH_BOOTSTRAP_EMAIL=marcusrodrigo2@gmail.com
AUTH_BOOTSTRAP_PASSWORD_HASH=\$2b\$12\$1zQCu8bfPEVwsgQpKe0ncuaETZW4XRrAnD/pTDgI1rEuna4cQJ3sa
AUTH_BOOTSTRAP_NAME=Marcus Rodrigo
AUTH_BOOTSTRAP_ROLE=ADMIN

# Configurações de API & Mocks
FORCE_MOCK=false
DATABASE_URL="sqlserver://$DB_SERVER:$DB_PORT;database=$DB_NAME;user=$DB_USER;password=$DB_PASSWORD;encrypt=false;trustServerCertificate=true"
EOT

echo -e "${GREEN}✅ Arquivo .env.production do backend criado com chaves JWT geradas automaticamente!${CLEAR}"

# Configurar frontend env
echo -e "\n${YELLOW}Injetando variáveis de ambiente em $FRONTEND_ENV...${CLEAR}"
cat <<EOT > "$FRONTEND_ENV"
# Usa path relativo no proxy Nginx para suportar tanto o IP quanto o domínio de forma automática!
NEXT_PUBLIC_API_URL=/api
PORT=3000
HOSTNAME=0.0.0.0
EOT
echo -e "${GREEN}✅ Arquivo .env.production do frontend criado com proxy relativo (/api)!${CLEAR}"

# 4. Rodar o Docker Compose
echo -e "\n${BLUE}[Passo 3/6] Iniciando contêineres com Docker Compose...${CLEAR}"
cd "$PROJECT_ROOT"

# Forçar derrubada anterior se houver
docker compose -f deploy/docker-compose.yml down --remove-orphans

echo -e "${YELLOW}Construindo e iniciando contêineres de backend e frontend em background...${CLEAR}"
docker compose -f deploy/docker-compose.yml up -d --build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Contêineres Docker inicializados com sucesso!${CLEAR}"
else
  echo -e "${RED}❌ Erro ao construir ou iniciar contêineres Docker.${CLEAR}"
  exit 1
fi

# 5. Configurar o Nginx
echo -e "\n${BLUE}[Passo 4/6] Configurando Proxy Reverso Nginx...${CLEAR}"
NGINX_CONF_DEST="/etc/nginx/sites-available/sistema-estrela"
NGINX_LINK_DEST="/etc/nginx/sites-enabled/sistema-estrela"

# Copiar arquivo de configuração do Nginx do projeto
cp "$SCRIPT_DIR/nginx.conf" "$NGINX_CONF_DEST"

# Criar link simbólico para ativar o site se não existir
if [ ! -f "$NGINX_LINK_DEST" ]; then
  ln -s "$NGINX_CONF_DEST" "$NGINX_LINK_DEST"
fi

# Remover o site 'default' do Nginx para evitar conflito de portas
if [ -f "/etc/nginx/sites-enabled/default" ]; then
  rm "/etc/nginx/sites-enabled/default"
fi

# Testar e reiniciar Nginx
nginx -t
if [ $? -eq 0 ]; then
  systemctl restart nginx
  echo -e "${GREEN}✅ Nginx configurado e reiniciado com sucesso!${CLEAR}"
else
  echo -e "${RED}❌ Erro na configuração do Nginx. Revertendo site default.${CLEAR}"
  exit 1
fi

# 6. Exibir Resumo e Próximos Passos
echo -e "\n${BLUE}======================================================================${CLEAR}"
echo -e "${GREEN}              🎉 DEPLOY LOCAL CONCLUÍDO COM SUCESSO! 🎉${CLEAR}"
echo -e "${BLUE}======================================================================${CLEAR}"
echo -e "${YELLOW}O sistema já está rodando e acessível no endereço do VPS:${CLEAR}"
echo -e "${GREEN}👉 URL Principal (HTTP): http://187.77.19.176${CLEAR}"
echo -e "${GREEN}👉 Endereço da API (HTTP): http://187.77.19.176/api${CLEAR}"
echo -e "${BLUE}======================================================================${CLEAR}"

echo -e "\n${YELLOW}🔒 PRÓXIMO PASSO (HTTPS automático com Let's Encrypt):${CLEAR}"
echo -e "Assim que você registrar e apontar o domínio ${BLUE}distribuidoraestrela.cloud${CLEAR} para o IP ${BLUE}187.77.19.176${CLEAR},"
echo -e "basta executar o comando abaixo no VPS para instalar o HTTPS automaticamente:"
echo -e "${GREEN}sudo certbot --nginx -d distribuidoraestrela.cloud -d www.distribuidoraestrela.cloud${CLEAR}"
echo -e "\nO Certbot cuidará de todo o SSL e renovará os certificados automaticamente a cada 90 dias!"
echo -e "${BLUE}======================================================================${CLEAR}"
