# Plano de implementações — Estrela BI

## Objetivo

Aplicar integralmente as melhorias técnicas, de segurança, produto, governança e IA propostas para transformar o Estrela BI em uma plataforma corporativa segura, auditável e evolutiva.

## Regra de execução faseada

As fases serão executadas em ordem. Ao final de cada fase devem ser entregues:

1. Código/documentação implementados.
2. Testes e builds compatíveis com o escopo da fase.
3. Commit no branch atual.
4. Pull request registrado.
5. Relatório de conclusão com evidências e pendências.
6. Autorização explícita do responsável para iniciar a próxima fase.

## Fase 0 — Segurança base, configuração e deploy mínimo

### Escopo

- Remover credenciais e hosts internos hardcoded.
- Exigir variáveis de ambiente obrigatórias para SQL Server e Prisma.
- Criar exemplos de ambiente para backend e frontend.
- Restringir CORS por variável `CORS_ORIGIN`.
- Desabilitar Swagger por padrão em produção, permitindo ativação por `SWAGGER_ENABLED=true`.
- Desabilitar endpoints de descoberta de banco por padrão via `DATABASE_DISCOVERY_ENABLED=false`.
- Centralizar URL da API do frontend em `NEXT_PUBLIC_API_URL`.
- Remover IPs internos de mensagens de erro exibidas ao usuário.
- Atualizar Docker Compose para consumir arquivos de ambiente.

### Critérios de aceite

- Nenhum segredo real deve permanecer no código versionado.
- O frontend não deve chamar `http://localhost:3000` diretamente fora do cliente centralizado.
- Endpoints `/database/*` devem retornar erro de permissão quando a flag administrativa não estiver habilitada.
- Backend deve compilar.
- Frontend deve passar lint e build.

## Fase 1 — Autenticação, autorização e auditoria

### Escopo

- Criar `AuthModule` com login real.
- Implementar hash de senha com `bcrypt`.
- Implementar JWT access token e refresh token com rotação.
- Criar `JwtAuthGuard` e `RolesGuard`.
- Definir perfis: `ADMIN`, `DIRETORIA`, `GERENTE`, `VENDEDOR`, `FINANCEIRO`.
- Proteger todos os controllers de dashboard, clientes, relatórios, IA e banco.
- Implementar logout e limpeza de sessão no frontend.
- Persistir auditoria de login, logout, exportações, alteração de limites e perguntas de IA.

### Critérios de aceite

- Usuário sem token não acessa APIs protegidas.
- Usuário sem perfil adequado recebe erro 403.
- Login real substitui redirecionamento simulado.
- Alterações sensíveis aparecem em trilha de auditoria.

## Fase 2 — Camada segura de dados e métricas

### Escopo

- Criar camada padronizada de queries SQL Server parametrizadas.
- Substituir interpolação de parâmetros por `.input(...)` nos serviços.
- Criar DTOs com validação para filtros, datas, períodos, paginação e ordenação.
- Criar catálogo semântico de métricas com definição, fórmula, origem e limitações.
- Definir limites máximos para `dias`, `periodo`, `top` e intervalos customizados.
- Revisar discovery para permitir apenas leitura controlada e identificadores validados.

### Critérios de aceite

- Nenhum parâmetro externo deve ser interpolado diretamente em SQL.
- Filtros inválidos devem retornar 400 com mensagem clara.
- Métricas principais devem ter definição documentada e teste automatizado.

## Fase 3 — Produto executivo de BI

### Escopo

- Consolidar visão executiva por cinco pilares: comercial, clientes, produtos, financeiro e operação/logística.
- Implementar metas, previsto vs realizado e previsão de fechamento.
- Criar scores de cliente em risco, potencial de expansão e performance de vendedor.
- Evoluir curva ABC de clientes e produtos.
- Melhorar análise de margem por produto, família, vendedor e cliente.
- Adicionar mapa comercial quando colunas geográficas estiverem confirmadas.
- Padronizar componentes de UI para KPI, gráficos, filtros, estados vazios, erros e loading.

### Critérios de aceite

- Diretoria consegue responder principais perguntas comerciais em uma única visão.
- Cada indicador deve exibir definição/tooltip e limitação quando aplicável.
- UI deve manter responsividade em desktop, notebook e tablet.

## Fase 4 — IA executiva híbrida e segura

### Escopo

- Transformar o assistente baseado em regras em motor híbrido: intenção + catálogo semântico + consultas permitidas + LLM.
- Garantir que o modelo nunca gere SQL livre executado no banco.
- Enviar ao LLM apenas dados agregados e autorizados.
- Registrar pergunta, intenção, métrica usada, usuário, tempo de resposta e resultado.
- Criar respostas causais com recomendações acionáveis.
- Aplicar RBAC também nas respostas da IA.

### Critérios de aceite

- Perguntas executivas devem retornar explicação, evidência e ação recomendada.
- Consultas fora do catálogo devem ser recusadas ou encaminhadas para análise segura.
- Dados sensíveis não autorizados não devem ser expostos ao modelo nem ao usuário.

## Fase 5 — Observabilidade, qualidade e CI/CD

### Escopo

- Criar endpoints `GET /health`, `GET /health/db` e `GET /health/version`.
- Implementar logs estruturados com correlation id.
- Medir latência por endpoint e por consulta SQL.
- Criar testes unitários de métricas, serviços e regras de autorização.
- Criar testes e2e para login, dashboard, relatórios, IA e permissões.
- Criar pipeline CI com lint, testes, build, Docker build, scan de segredos e auditoria de dependências.

### Critérios de aceite

- Pipeline deve bloquear merge com teste/build quebrado.
- Falhas de banco e lentidão devem ser diagnosticáveis por logs e healthchecks.
- Cobertura deve incluir os fluxos críticos de negócio.

## Ordem de execução aprovada

1. Fase 0 — Segurança base, configuração e deploy mínimo.
2. Fase 1 — Autenticação, autorização e auditoria.
3. Fase 2 — Camada segura de dados e métricas.
4. Fase 3 — Produto executivo de BI.
5. Fase 4 — IA executiva híbrida e segura.
6. Fase 5 — Observabilidade, qualidade e CI/CD.

## Status de execução

- Fase 0: concluída e registrada em PR anterior.
- Fase 1: concluída e registrada em PR anterior.
- Fase 2: concluída com validação de DTOs, parametrização de filtros externos e catálogo semântico inicial.
- Fase 3: concluída com metas, previsão de fechamento, score de risco e concentração executiva no dashboard.

