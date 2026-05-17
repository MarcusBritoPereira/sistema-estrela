# Sistema de Business Intelligence com IA e SQL Server

Sistema SaaS de Business Intelligence (BI) inteligente e moderno com conexão direta ao SQL Server.

## 🚀 Tecnologias

### Frontend
- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Zustand
- Recharts
- Axios

### Backend
- NestJS
- TypeScript
- Prisma ORM / `mssql`
- JWT Authentication
- Swagger
- OpenAI API

## 📋 Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- Acesso ao banco de dados SQL Server
- Chave de API da OpenAI

## ⚙️ Instalação

### Usando Docker (Recomendado)

1. Clone o repositório
2. Configure as variáveis de ambiente baseadas no arquivo `.env.example` nos diretórios `frontend` e `backend`
3. Execute:
```bash
docker-compose up -d --build
```

O sistema estará disponível em:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs

### Instalação Manual

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Estrutura do Banco de Dados SQL Server

O sistema se conecta diretamente à base `DistribuidoraEstrela` e realiza a leitura e mapeamento de tabelas (Vendas, Produtos, Clientes, Vendedores) automaticamente usando inteligência comercial adaptativa.

## 🛡️ Variáveis de Ambiente

As variáveis de ambiente devem ser configuradas nos diretórios:
- `backend/.env`
- `frontend/.env.local`

Consulte a documentação em ambos os diretórios para detalhes de cada variável de ambiente.
