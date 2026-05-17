# Plano de análise e correção — Estrela BI

## Objetivo

Transformar o Estrela BI de um painel de vendas em um centro de inteligência operacional, comercial e estratégica para diretoria, gerência e time comercial.

## Fase 1 — Diagnóstico técnico e segurança crítica

### UI/UX
- Revisar responsividade dos dashboards em telas de diretoria, notebooks e tablets.
- Padronizar estados de carregamento, erro, vazio e indisponibilidade por módulo.
- Trocar URLs fixas `localhost` por variável de ambiente pública no frontend.
- Definir hierarquia visual por perfil: CEO, gerente, vendedor e operação.

### Segurança
- Substituir login simulado por autenticação real com JWT, refresh token e expiração curta.
- Proteger rotas do backend com guards por perfil de acesso.
- Remover credenciais padrão do código e exigir variáveis de ambiente.
- Parametrizar consultas SQL para reduzir risco de SQL injection.
- Restringir CORS por domínio permitido.
- Criar auditoria de acessos e consultas sensíveis.

### Inteligência de dados
- Validar dicionário real do SQL Server com descoberta de tabelas e colunas.
- Classificar tabelas por domínio: comercial, clientes, produtos, financeiro, logística e metas.
- Documentar lacunas: contas a receber, contas a pagar, estoque físico, entregas, motoristas, rotas, metas e inadimplência.

## Fase 2 — Produto de BI executivo

### Comercial
- Consolidar faturamento diário, semanal, mensal e anual.
- Criar comparações contra período anterior e tendência de fechamento.
- Medir pedidos, ticket médio, mix por pedido, positivação, ranking e crescimento por vendedor.
- Adicionar metas individuais, regionais e por categoria quando a tabela de metas estiver disponível.

### Clientes
- Criar segmentação: ativos, inativos, novos, recorrentes, recuperados e perdidos.
- Calcular frequência de compra, tempo sem comprar, ticket médio e curva ABC.
- Implantar score de risco de abandono e score de potencial de expansão.
- Mapear vendas por cidade/região assim que as colunas geográficas forem confirmadas.

### Produtos
- Mostrar produtos mais vendidos, menos vendidos, maior margem, menor margem e curva ABC.
- Medir giro por produto e por família/categoria.
- Identificar tendência de ruptura por aceleração de venda.
- Incluir excesso/parado somente após mapear saldos de estoque e datas de entrada.

### Financeiro
- Calcular margem bruta, CMV aproximado e lucro bruto com os campos comerciais já disponíveis.
- Integrar inadimplência, aging, previsão de recebimento, caixa, pagar/receber e capital de giro quando as tabelas financeiras forem identificadas.
- Criar alertas de queda de margem e concentração de faturamento com baixa margem.

### Operação e logística
- Iniciar com indicadores indiretos vindos de venda e giro de produtos.
- Mapear tabelas de entregas, expedição, motoristas, rotas, separação, carregamento, perdas e avarias.
- Depois do mapeamento, calcular OTIF, prazo médio, atrasos, custo por rota e eficiência logística.

## Fase 3 — IA executiva

### Capacidades obrigatórias
- Responder perguntas executivas como: “Por que o faturamento caiu esta semana?”.
- Explicar impactos por vendedor, cliente, produto, margem e região.
- Gerar recomendações acionáveis, não apenas descrever gráficos.
- Criar alertas automáticos para queda comercial, cliente importante parado, margem caindo e demanda acelerada.

### Evolução recomendada
- Trocar regras por palavras-chave por motor híbrido: catálogo semântico de métricas + LLM + SQL seguro parametrizado.
- Usar somente consultas autorizadas e limitar comandos a leitura.
- Registrar pergunta, consulta executada, tempo de resposta e usuário.
- Criar camada de validação para impedir vazamento de dados sensíveis.

## Fase 4 — Governança e qualidade

### Observabilidade
- Monitorar latência por endpoint, erros SQL e falhas de conexão.
- Criar healthcheck do backend, banco e frontend.
- Registrar eventos de exportação de relatórios.

### Qualidade
- Adicionar testes unitários para serviços de métricas.
- Adicionar testes e2e para login, dashboard, IA e relatórios.
- Criar fixtures ou banco de teste com dados comerciais sintéticos.
- Validar build em pipeline CI antes de deploy.

## Entregas priorizadas

1. Autenticação real e proteção de rotas.
2. Variáveis de ambiente e remoção de credenciais hardcoded.
3. Parametrização de SQL e CORS restrito.
4. Dicionário de dados do SQL Server real.
5. Painel executivo de 5 pilares com lacunas explícitas.
6. Alertas automáticos comerciais, clientes, estoque e financeiro.
7. IA executiva com diagnóstico causal e recomendações.
8. Metas, previsão de fechamento e scores de performance.
9. Mapa comercial e território inteligente.
10. Integração logística/financeira completa após mapear tabelas.
