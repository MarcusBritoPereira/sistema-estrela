# Catálogo semântico de métricas — Estrela BI

## Regras globais

- Fonte transacional principal: SQL Server da Distribuidora Estrela.
- Pedido faturado: `Situacao = '2'` no ERP.
- Valores comerciais válidos: `ValTotal > 0`.
- Datas comerciais: `DT_Data`.
- Todas as métricas com filtros vindos da API devem usar parâmetros SQL (`@dias`, `@startDate`, `@endDate`, etc.).

## Comercial

| Métrica | Fórmula | Origem | Limitações |
| --- | --- | --- | --- |
| Faturamento total | `SUM(Pedido.ValTotal)` | `Pedido` | Considera apenas pedidos faturados e valor positivo. |
| Total de pedidos | `COUNT(DISTINCT Pedido.Pedido)` | `Pedido` | Pode divergir de notas fiscais quando houver faturamento parcial. |
| Ticket médio | `AVG(Pedido.ValTotal)` | `Pedido` | Calculado no nível de pedido. |
| Lucro bruto aproximado | `SUM(Pedido.Lucro)` | `Pedido` | Depende da qualidade do campo `Lucro` no ERP. |
| Crescimento percentual | `(atual - anterior) / anterior * 100` | Agregações por período | Se período anterior for zero, crescimento é tratado como 100% quando atual > 0. |
| Previsão de fechamento mensal | `faturamento do mês / dia atual * dias do mês` | `Pedido` | Projeção linear; não considera sazonalidade, dias úteis ou feriados. |
| Atingimento de meta projetado | `previsaoFechamentoMes / EXECUTIVE_MONTHLY_REVENUE_GOAL * 100` | `Pedido` + variável de ambiente | Exige configuração explícita de meta mensal. |

## Clientes

| Métrica | Fórmula | Origem | Limitações |
| --- | --- | --- | --- |
| Clientes ativos | `COUNT(DISTINCT CGCCPF)` no período | `Pedido` | Cliente sem documento pode ser agrupado como balcão/consumidor final. |
| Dias sem comprar | `DATEDIFF(DAY, MAX(DT_Data), GETDATE())` | `Pedido` | Baseado na última compra faturada. |
| Curva ABC de clientes | Participação acumulada no faturamento | `Pedido`, `cadcli` | Classificação depende do período informado. |
| Score de risco da carteira | `(clientesEmRisco * 0.6 + clientesPerdidos) / totalCarteira * 100` | `Pedido` | Score heurístico para priorização comercial, não modelo estatístico. |

## Produtos

| Métrica | Fórmula | Origem | Limitações |
| --- | --- | --- | --- |
| Quantidade vendida | `SUM(Itens.Quantidade)` | `Itens`, `Pedido` | Considera itens ligados a pedidos faturados. |
| Faturamento por produto | `SUM(Itens.ValorNegTot)` | `Itens`, `Produto` | Descrição depende do cadastro de produtos. |
| Preço médio | `AVG(Itens.ValorNegUni)` | `Itens` | Não substitui análise de margem real. |

## Financeiro e CNPJ

| Métrica | Fórmula | Origem | Limitações |
| --- | --- | --- | --- |
| Faturamento mensal por CNPJ | `SUM(NFSAIDA.ValTotal)` por depósito | `NFSAIDA` | CNPJ é mapeado por depósito no backend. |
| Fôlego restante | `limiteMensal - faturamentoMensal` | `NFSAIDA` + configuração | Limites são configuração operacional, não regra fiscal automática. |
| Concentração Top 10 clientes | `SUM(faturamento dos 10 maiores clientes) / faturamento total de clientes * 100` | `Pedido` | Mede dependência comercial de poucos clientes no período analisado. |
