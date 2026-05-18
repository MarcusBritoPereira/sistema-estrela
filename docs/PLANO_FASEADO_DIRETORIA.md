# Plano faseado por urgência decisória da diretoria

Este plano reorganiza a evolução do Estrela BI por urgência de tomada de decisão, não apenas por disciplina técnica.

## Critérios de priorização

1. **Impacto na decisão da diretoria**: a entrega muda decisões de venda, margem, cobrança, compra ou operação?
2. **Urgência do risco**: a demora pode causar perda de faturamento, margem, caixa ou cliente?
3. **Confiabilidade dos dados disponíveis**: a métrica já pode ser calculada com dados mapeados?
4. **Esforço técnico**: a entrega cabe em uma fase curta e validável?
5. **Escalabilidade**: a entrega vira base para alertas, metas, IA e painéis por perfil?

## Fase 1 — Cockpit executivo diário

### Status

Implementada nesta etapa.

### Objetivo

Dar à diretoria uma leitura diária de saúde do negócio e uma lista priorizada de decisões para o mesmo dia.

### Entregas

- Endpoint `GET /dashboard/daily-decision-cockpit`.
- Status geral do dia: `saudavel`, `atencao` ou `critico`.
- Indicadores de hoje: faturamento, pedidos, clientes e variação contra ontem.
- Indicadores da semana: faturamento, pedidos, vendedores ativos e variação contra a semana anterior.
- Indicadores do mês: faturamento, lucro bruto aproximado, margem, meta, previsão de fechamento e gap projetado.
- Lista de decisões de hoje com prioridade, severidade, impacto estimado, responsável sugerido, ação e prazo.
- Bloco visual “Sala de decisão da diretoria” na home do dashboard.

### Critérios de aceite

- A diretoria deve conseguir responder em uma única tela:
  - estamos saudáveis, em atenção ou críticos?
  - quanto vendemos hoje, na semana e no mês?
  - vamos bater a meta mensal?
  - qual problema precisa de ação hoje?
  - qual é o impacto estimado e quem deve agir?

## Fase 2 — Alertas executivos com workflow

### Objetivo

Transformar alertas em gestão acompanhável, com dono, prazo e status.

### Entregas previstas

- Persistência de alertas executivos.
- Estados: novo, em análise, resolvido, ignorado.
- Responsável e prazo por alerta.
- Impacto financeiro estimado padronizado.
- Histórico de resolução.

## Fase 3 — Metas e performance por responsabilidade

### Objetivo

Sair de ranking simples para gestão por meta e accountability.

### Entregas previstas

- Metas por vendedor/carteira.
- Atingimento e gap individual.
- Projeção por vendedor.
- Ranking por percentual de meta, margem e recuperação de carteira.
- Painel de intervenção gerencial.

## Fase 4 — Carteira de clientes: risco e expansão

### Objetivo

Proteger receita recorrente e priorizar expansão da base existente.

### Entregas previstas

- Score individual de abandono.
- Score de expansão.
- Clientes A/B sem recompra.
- Valor em risco por cliente.
- Próxima melhor ação comercial.

## Fase 5 — Margem e rentabilidade decisória

### Objetivo

Garantir que crescimento de faturamento esteja gerando resultado.

### Entregas previstas

- Margem por vendedor, cliente, produto e família.
- Alertas de erosão de margem.
- Produtos de alto faturamento e baixa rentabilidade.
- Clientes grandes com margem abaixo do mínimo.

## Fase 6 — Financeiro executivo

### Objetivo

Conectar venda com caixa e risco financeiro.

### Entregas previstas

- Contas a receber.
- Inadimplência.
- Aging.
- Previsão de recebimento.
- Fluxo de caixa gerencial.

## Fase 7 — Estoque e compras

### Objetivo

Evitar perda de venda por ruptura e capital parado por excesso.

### Entregas previstas

- Ruptura real.
- Excesso de estoque.
- Giro e cobertura em dias.
- Sugestão de compra.
- Produtos parados.

## Fase 8 — Logística e operação

### Objetivo

Conectar promessa comercial com capacidade operacional.

### Entregas previstas

- Entregas no prazo e atrasadas.
- OTIF.
- Custo por rota.
- Gargalos de separação/carregamento.
- Avarias e devoluções.

## Fase 9 — IA executiva segura

### Objetivo

Permitir perguntas em linguagem natural com respostas auditáveis e baseadas no catálogo semântico.

### Entregas previstas

- Motor de intenção.
- Métricas permitidas por catálogo.
- Respostas causais com evidência.
- Recomendações acionáveis.
- Auditoria de perguntas, métricas e respostas.
