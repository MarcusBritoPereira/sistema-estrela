/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, Inject } from '@nestjs/common';
import * as sql from 'mssql';

// Situacao '2' = Faturado no sistema Máxima/ERP
const SITUACAO_FATURADO = "'2'";

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DATABASE_CONNECTION') private pool: sql.ConnectionPool,
  ) {}

  async getKpis(periodo: string = '30') {
    const dias = parseInt(periodo, 10);

    const kpisResult = await this.pool.request().query(`
      SELECT
        COUNT(DISTINCT Pedido) AS totalPedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamentoTotal,
        ISNULL(AVG(ValTotal), 0) AS ticketMedio,
        ISNULL(SUM(Lucro), 0) AS lucroTotal
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
    `);

    const hojeResult = await this.pool.request().query(`
      SELECT
        COUNT(DISTINCT Pedido) AS pedidosHoje,
        ISNULL(SUM(ValTotal), 0) AS faturamentoHoje
      FROM Pedido
      WHERE CAST(DT_Data AS DATE) = CAST(GETDATE() AS DATE)
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
    `);

    const clientesResult = await this.pool.request().query(`
      SELECT COUNT(DISTINCT CGCCPF) AS totalClientes
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND CGCCPF IS NOT NULL
    `);

    const mesAtualResult = await this.pool.request().query(`
      SELECT
        COUNT(DISTINCT Pedido) AS pedidosMes,
        ISNULL(SUM(ValTotal), 0) AS faturamentoMes
      FROM Pedido
      WHERE MONTH(DT_Data) = MONTH(GETDATE())
        AND YEAR(DT_Data) = YEAR(GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
    `);

    const mesAnteriorResult = await this.pool.request().query(`
      SELECT ISNULL(SUM(ValTotal), 0) AS faturamentoMesAnterior
      FROM Pedido
      WHERE MONTH(DT_Data) = MONTH(DATEADD(MONTH, -1, GETDATE()))
        AND YEAR(DT_Data) = YEAR(DATEADD(MONTH, -1, GETDATE()))
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
    `);

    const kpis = kpisResult.recordset[0];
    const hoje = hojeResult.recordset[0];
    const clientes = clientesResult.recordset[0];
    const mes = mesAtualResult.recordset[0];
    const mesAnt = mesAnteriorResult.recordset[0];

    const crescimento =
      mesAnt.faturamentoMesAnterior > 0
        ? (
            ((mes.faturamentoMes - mesAnt.faturamentoMesAnterior) /
              mesAnt.faturamentoMesAnterior) *
            100
          ).toFixed(1)
        : '0';

    return {
      faturamentoTotal: kpis.faturamentoTotal,
      totalPedidos: kpis.totalPedidos,
      ticketMedio: kpis.ticketMedio,
      lucroTotal: kpis.lucroTotal,
      faturamentoHoje: hoje.faturamentoHoje,
      pedidosHoje: hoje.pedidosHoje,
      totalClientes: clientes.totalClientes,
      faturamentoMes: mes.faturamentoMes,
      pedidosMes: mes.pedidosMes,
      faturamentoMesAnterior: mesAnt.faturamentoMesAnterior,
      crescimentoMensal: crescimento,
    };
  }

  async getVendasPorDia(dias: number = 30) {
    const result = await this.pool.request().query(`
      SELECT
        CAST(DT_Data AS DATE) AS data,
        COUNT(DISTINCT Pedido) AS qtdPedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamento
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
        AND DT_Data IS NOT NULL
      GROUP BY CAST(DT_Data AS DATE)
      ORDER BY data
    `);
    return result.recordset;
  }

  async getVendasPorMes(meses: number = 12) {
    const result = await this.pool.request().query(`
      SELECT
        YEAR(DT_Data) AS ano,
        MONTH(DT_Data) AS mes,
        FORMAT(DT_Data, 'MMM/yy', 'pt-BR') AS label,
        COUNT(DISTINCT Pedido) AS qtdPedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamento,
        ISNULL(SUM(Lucro), 0) AS lucro
      FROM Pedido
      WHERE DT_Data >= DATEADD(MONTH, -${meses}, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
        AND DT_Data IS NOT NULL
      GROUP BY YEAR(DT_Data), MONTH(DT_Data), FORMAT(DT_Data, 'MMM/yy', 'pt-BR')
      ORDER BY ano, mes
    `);
    return result.recordset;
  }

  async getRankingVendedores(periodo: number = 30) {
    const result = await this.pool.request().query(`
      SELECT TOP 10
        UsuCad AS nomeVendedor,
        COUNT(DISTINCT Pedido) AS qtdPedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamento,
        ISNULL(AVG(ValTotal), 0) AS ticketMedio,
        ISNULL(SUM(Lucro), 0) AS lucro
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -${periodo}, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
        AND UsuCad IS NOT NULL
        AND UsuCad != ''
        AND UPPER(UsuCad) NOT IN ('FRONT', 'ALESSANDRO', 'CAROLINA')
      GROUP BY UsuCad
      ORDER BY qtdPedidos DESC, faturamento DESC
    `);
    return result.recordset;
  }

  async getProdutosMaisVendidos(periodo: number = 30, top: number = 10) {
    const result = await this.pool.request().query(`
      SELECT TOP ${top}
        i.CodRed AS codProduto,
        ISNULL(pr.Descricao, CAST(i.CodRed AS VARCHAR)) AS nomeProduto,
        ISNULL(f.Descricao, '') AS familia,
        SUM(i.Quantidade) AS qtdVendida,
        ISNULL(SUM(i.ValorNegTot), 0) AS faturamento,
        ISNULL(AVG(i.ValorNegUni), 0) AS precoMedio
      FROM Itens i
      INNER JOIN Pedido p ON p.Pedido = i.Pedido
      LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
      LEFT JOIN Familia f ON f.Codigo = pr.Familia
      WHERE p.DT_Data >= DATEADD(DAY, -${periodo}, GETDATE())
        AND p.Situacao = ${SITUACAO_FATURADO}
        AND i.Quantidade > 0
      GROUP BY i.CodRed, pr.Descricao, f.Descricao
      ORDER BY faturamento DESC
    `);
    return result.recordset;
  }

  async getInsightsAutomaticos() {
    const comparativo = await this.pool.request().query(`
      SELECT
        ISNULL(SUM(CASE WHEN DT_Data >= DATEADD(DAY,-7,GETDATE()) THEN ValTotal END), 0) AS semanaAtual,
        ISNULL(SUM(CASE WHEN DT_Data >= DATEADD(DAY,-14,GETDATE()) AND DT_Data < DATEADD(DAY,-7,GETDATE()) THEN ValTotal END), 0) AS semanaAnterior
      FROM Pedido
      WHERE Situacao = ${SITUACAO_FATURADO} AND ValTotal > 0
    `);

    const mesResult = await this.pool.request().query(`
      SELECT
        ISNULL(SUM(CASE WHEN MONTH(DT_Data)=MONTH(GETDATE()) AND YEAR(DT_Data)=YEAR(GETDATE()) THEN ValTotal END), 0) AS mesAtual,
        ISNULL(SUM(CASE WHEN MONTH(DT_Data)=MONTH(DATEADD(MONTH,-1,GETDATE())) AND YEAR(DT_Data)=YEAR(DATEADD(MONTH,-1,GETDATE())) THEN ValTotal END), 0) AS mesAnterior
      FROM Pedido
      WHERE Situacao = ${SITUACAO_FATURADO} AND ValTotal > 0
    `);

    const vendedorDestaque = await this.pool.request().query(`
      SELECT TOP 1
        UsuCad AS nome,
        SUM(ValTotal) AS faturamento,
        COUNT(DISTINCT Pedido) AS qtdPedidos
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -7, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO} AND ValTotal > 0
        AND UsuCad IS NOT NULL AND UsuCad != ''
        AND UPPER(UsuCad) NOT IN ('FRONT', 'ALESSANDRO', 'CAROLINA')
      GROUP BY UsuCad
      ORDER BY faturamento DESC
    `);

    const produtoDestaque = await this.pool.request().query(`
      SELECT TOP 1
        ISNULL(pr.Descricao, CAST(i.CodRed AS VARCHAR)) AS nome,
        SUM(i.Quantidade) AS qtd
      FROM Itens i
      INNER JOIN Pedido p ON p.Pedido = i.Pedido
      LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
      WHERE p.DT_Data >= DATEADD(DAY, -7, GETDATE())
        AND p.Situacao = ${SITUACAO_FATURADO}
        AND i.Quantidade > 0
      GROUP BY i.CodRed, pr.Descricao
      ORDER BY qtd DESC
    `);

    const totalMesResult = await this.pool.request().query(`
      SELECT
        COUNT(DISTINCT Pedido) AS totalPedidosMes,
        ISNULL(SUM(ValTotal), 0) AS faturamentoMes,
        ISNULL(AVG(ValTotal), 0) AS ticketMedio
      FROM Pedido
      WHERE MONTH(DT_Data) = MONTH(GETDATE())
        AND YEAR(DT_Data) = YEAR(GETDATE())
        AND Situacao = ${SITUACAO_FATURADO} AND ValTotal > 0
    `);

    const comp = comparativo.recordset[0];
    const mesComp = mesResult.recordset[0];
    const totMes = totalMesResult.recordset[0];

    const crescSemana =
      comp.semanaAnterior > 0
        ? (
            ((comp.semanaAtual - comp.semanaAnterior) / comp.semanaAnterior) *
            100
          ).toFixed(1)
        : null;

    const crescMes =
      mesComp.mesAnterior > 0
        ? (
            ((mesComp.mesAtual - mesComp.mesAnterior) / mesComp.mesAnterior) *
            100
          ).toFixed(1)
        : null;

    const insights: string[] = [];

    if (totMes.faturamentoMes > 0) {
      insights.push(
        `💰 Faturamento do mês: R$ ${Number(totMes.faturamentoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${totMes.totalPedidosMes} pedidos.`,
      );
    }

    if (crescMes !== null) {
      const dir = parseFloat(crescMes) >= 0 ? '📈 cresceu' : '📉 caiu';
      insights.push(
        `${dir} ${Math.abs(parseFloat(crescMes))}% em relação ao mês anterior.`,
      );
    }

    if (crescSemana !== null) {
      const dir = parseFloat(crescSemana) >= 0 ? 'cresceram' : 'caíram';
      insights.push(
        `📊 Vendas da semana ${dir} ${Math.abs(parseFloat(crescSemana))}% vs. semana passada.`,
      );
    }

    if (vendedorDestaque.recordset.length > 0) {
      const v = vendedorDestaque.recordset[0];
      insights.push(
        `🏆 Operador destaque da semana: ${v.nome} — R$ ${Number(v.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${v.qtdPedidos} pedidos.`,
      );
    }

    if (produtoDestaque.recordset.length > 0) {
      const p = produtoDestaque.recordset[0];
      insights.push(
        `📦 Produto mais vendido na semana: "${p.nome}" com ${p.qtd} unidades.`,
      );
    }

    return insights;
  }

  private sanitizeDays(days: number, fallback = 30): number {
    if (!Number.isFinite(days) || days <= 0) return fallback;
    return Math.min(Math.max(Math.floor(days), 1), 366);
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private calcGrowth(current: number, previous: number): number {
    if (!previous) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  async getExecutiveOverview(periodo: number = 30) {
    const dias = this.sanitizeDays(periodo);

    const comercialResult = await this.pool.request().query(`
      SELECT
        COUNT(DISTINCT Pedido) AS pedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamento,
        ISNULL(AVG(ValTotal), 0) AS ticketMedio,
        ISNULL(SUM(Lucro), 0) AS lucro,
        COUNT(DISTINCT CGCCPF) AS clientesAtivos,
        COUNT(DISTINCT UsuCad) AS vendedoresAtivos,
        ISNULL(SUM(CASE WHEN DT_Data >= DATEADD(DAY, -${dias}, GETDATE()) THEN ValTotal END), 0) AS faturamentoAtual,
        ISNULL(SUM(CASE WHEN DT_Data >= DATEADD(DAY, -${dias * 2}, GETDATE()) AND DT_Data < DATEADD(DAY, -${dias}, GETDATE()) THEN ValTotal END), 0) AS faturamentoAnterior
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -${dias * 2}, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
    `);

    const mixResult = await this.pool.request().query(`
      SELECT ISNULL(AVG(CAST(itemCount AS FLOAT)), 0) AS mixMedioProdutos
      FROM (
        SELECT p.Pedido, COUNT(DISTINCT i.CodRed) AS itemCount
        FROM Pedido p
        INNER JOIN Itens i ON i.Pedido = p.Pedido
        WHERE p.DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND p.ValTotal > 0
        GROUP BY p.Pedido
      ) x
    `);

    const vendedoresResult = await this.pool.request().query(`
      WITH atual AS (
        SELECT UsuCad, SUM(ValTotal) AS faturamentoAtual, COUNT(DISTINCT Pedido) AS pedidosAtual, SUM(Lucro) AS lucroAtual
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND UsuCad IS NOT NULL AND UsuCad != ''
          AND UPPER(UsuCad) NOT IN ('FRONT', 'ALESSANDRO', 'CAROLINA')
        GROUP BY UsuCad
      ), anterior AS (
        SELECT UsuCad, SUM(ValTotal) AS faturamentoAnterior
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -${dias * 2}, GETDATE())
          AND DT_Data < DATEADD(DAY, -${dias}, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND UsuCad IS NOT NULL AND UsuCad != ''
          AND UPPER(UsuCad) NOT IN ('FRONT', 'ALESSANDRO', 'CAROLINA')
        GROUP BY UsuCad
      )
      SELECT TOP 10
        a.UsuCad AS nomeVendedor,
        a.pedidosAtual AS pedidos,
        a.faturamentoAtual AS faturamento,
        ISNULL(a.lucroAtual, 0) AS lucro,
        ISNULL(a.faturamentoAtual / NULLIF(a.pedidosAtual, 0), 0) AS ticketMedio,
        ISNULL(b.faturamentoAnterior, 0) AS faturamentoAnterior
      FROM atual a
      LEFT JOIN anterior b ON b.UsuCad = a.UsuCad
      ORDER BY a.pedidosAtual DESC, a.faturamentoAtual DESC
    `);

    const clientesResult = await this.pool.request().query(`
      WITH atual AS (
        SELECT CGCCPF, SUM(ValTotal) AS faturamentoAtual, COUNT(DISTINCT Pedido) AS pedidosAtual, MAX(DT_Data) AS ultimaCompra
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND CGCCPF IS NOT NULL
        GROUP BY CGCCPF
      ), anterior AS (
        SELECT CGCCPF, SUM(ValTotal) AS faturamentoAnterior
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -${dias * 2}, GETDATE())
          AND DT_Data < DATEADD(DAY, -${dias}, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND CGCCPF IS NOT NULL
        GROUP BY CGCCPF
      ), historico AS (
        SELECT CGCCPF, MAX(DT_Data) AS ultimaCompraHistorica
        FROM Pedido
        WHERE DT_Data < DATEADD(DAY, -${dias}, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND CGCCPF IS NOT NULL
        GROUP BY CGCCPF
      )
      SELECT
        (SELECT COUNT(*) FROM atual) AS clientesAtivos,
        (SELECT COUNT(*) FROM atual a LEFT JOIN anterior b ON b.CGCCPF = a.CGCCPF WHERE ISNULL(b.faturamentoAnterior, 0) = 0) AS clientesNovosOuRecuperados,
        (SELECT COUNT(*) FROM historico h LEFT JOIN atual a ON a.CGCCPF = h.CGCCPF WHERE a.CGCCPF IS NULL AND h.ultimaCompraHistorica >= DATEADD(DAY, -${dias * 3}, GETDATE())) AS clientesEmRisco,
        (SELECT COUNT(*) FROM anterior b LEFT JOIN atual a ON a.CGCCPF = b.CGCCPF WHERE a.CGCCPF IS NULL) AS clientesPerdidos
    `);

    const curvaClientesResult = await this.pool.request().query(`
      WITH clientes AS (
        SELECT CGCCPF, SUM(ValTotal) AS faturamento
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND CGCCPF IS NOT NULL
        GROUP BY CGCCPF
      ), ranked AS (
        SELECT *, SUM(faturamento) OVER () AS totalFaturamento,
          SUM(faturamento) OVER (ORDER BY faturamento DESC ROWS UNBOUNDED PRECEDING) AS acumulado
        FROM clientes
      )
      SELECT
        SUM(CASE WHEN acumulado <= totalFaturamento * 0.8 THEN 1 ELSE 0 END) AS clientesA,
        SUM(CASE WHEN acumulado > totalFaturamento * 0.8 AND acumulado <= totalFaturamento * 0.95 THEN 1 ELSE 0 END) AS clientesB,
        SUM(CASE WHEN acumulado > totalFaturamento * 0.95 THEN 1 ELSE 0 END) AS clientesC
      FROM ranked
    `);

    const produtosResult = await this.pool.request().query(`
      WITH produtos AS (
        SELECT
          i.CodRed,
          ISNULL(pr.Descricao, CAST(i.CodRed AS VARCHAR)) AS nomeProduto,
          ISNULL(f.Descricao, 'Sem família') AS familia,
          SUM(i.Quantidade) AS qtdVendida,
          SUM(i.ValorNegTot) AS faturamento,
          ISNULL(SUM(p.Lucro), 0) AS lucroAproximado
        FROM Itens i
        INNER JOIN Pedido p ON p.Pedido = i.Pedido
        LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
        LEFT JOIN Familia f ON f.Codigo = pr.Familia
        WHERE p.DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND i.Quantidade > 0
        GROUP BY i.CodRed, pr.Descricao, f.Descricao
      ), ranked AS (
        SELECT *, SUM(faturamento) OVER () AS totalFaturamento,
          SUM(faturamento) OVER (ORDER BY faturamento DESC ROWS UNBOUNDED PRECEDING) AS acumulado
        FROM produtos
      )
      SELECT
        COUNT(*) AS produtosVendidos,
        SUM(qtdVendida) AS unidadesVendidas,
        SUM(CASE WHEN acumulado <= totalFaturamento * 0.8 THEN 1 ELSE 0 END) AS produtosA,
        SUM(CASE WHEN acumulado > totalFaturamento * 0.8 AND acumulado <= totalFaturamento * 0.95 THEN 1 ELSE 0 END) AS produtosB,
        SUM(CASE WHEN acumulado > totalFaturamento * 0.95 THEN 1 ELSE 0 END) AS produtosC,
        MAX(faturamento) AS maiorFaturamentoProduto
      FROM ranked
    `);

    const financeiroResult = await this.pool.request().query(`
      SELECT
        ISNULL(SUM(ValTotal), 0) AS faturamento,
        ISNULL(SUM(Lucro), 0) AS lucroBrutoAproximado,
        CASE WHEN ISNULL(SUM(ValTotal), 0) > 0 THEN ISNULL(SUM(Lucro), 0) / SUM(ValTotal) * 100 ELSE 0 END AS margemBrutaPercentual,
        ISNULL(SUM(ValTotal - Lucro), 0) AS cmvAproximado
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
    `);

    const geograficoResult = await this.pool
      .request()
      .query(
        `
      SELECT TOP 10
        COALESCE(CAST(Cidade AS VARCHAR), CAST(Municipio AS VARCHAR), 'NÃO INFORMADO') AS localidade,
        COUNT(DISTINCT Pedido) AS pedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamento
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -${dias}, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
      GROUP BY COALESCE(CAST(Cidade AS VARCHAR), CAST(Municipio AS VARCHAR), 'NÃO INFORMADO')
      ORDER BY faturamento DESC
    `,
      )
      .catch(() => ({ recordset: [] }));

    const comercial = comercialResult.recordset[0];
    const clientes = clientesResult.recordset[0];
    const produtos = produtosResult.recordset[0];
    const financeiro = financeiroResult.recordset[0];
    const mix = mixResult.recordset[0];
    const curvaClientes = curvaClientesResult.recordset[0] || {};

    const faturamentoAtual = this.toNumber(comercial.faturamentoAtual);
    const faturamentoAnterior = this.toNumber(comercial.faturamentoAnterior);
    const crescimento = this.calcGrowth(faturamentoAtual, faturamentoAnterior);

    return {
      periodoDias: dias,
      generatedAt: new Date().toISOString(),
      pilares: {
        comercial: {
          faturamento: faturamentoAtual,
          faturamentoPeriodoAnterior: faturamentoAnterior,
          crescimentoPercentual: crescimento,
          pedidos: this.toNumber(comercial.pedidos),
          ticketMedio: this.toNumber(comercial.ticketMedio),
          mixMedioProdutosPorPedido: this.toNumber(mix.mixMedioProdutos),
          vendedoresAtivos: this.toNumber(comercial.vendedoresAtivos),
          rankingVendedores: vendedoresResult.recordset.map((v) => ({
            ...v,
            crescimentoPercentual: this.calcGrowth(
              this.toNumber(v.faturamento),
              this.toNumber(v.faturamentoAnterior),
            ),
          })),
        },
        clientes: {
          ativos: this.toNumber(clientes.clientesAtivos),
          novosOuRecuperados: this.toNumber(
            clientes.clientesNovosOuRecuperados,
          ),
          emRisco: this.toNumber(clientes.clientesEmRisco),
          perdidos: this.toNumber(clientes.clientesPerdidos),
          curvaABC: {
            A: this.toNumber(curvaClientes.clientesA),
            B: this.toNumber(curvaClientes.clientesB),
            C: this.toNumber(curvaClientes.clientesC),
          },
        },
        produtos: {
          produtosVendidos: this.toNumber(produtos.produtosVendidos),
          unidadesVendidas: this.toNumber(produtos.unidadesVendidas),
          curvaABC: {
            A: this.toNumber(produtos.produtosA),
            B: this.toNumber(produtos.produtosB),
            C: this.toNumber(produtos.produtosC),
          },
          maiorFaturamentoProduto: this.toNumber(
            produtos.maiorFaturamentoProduto,
          ),
        },
        financeiro: {
          faturamento: this.toNumber(financeiro.faturamento),
          lucroBrutoAproximado: this.toNumber(financeiro.lucroBrutoAproximado),
          margemBrutaPercentual: Number(
            this.toNumber(financeiro.margemBrutaPercentual).toFixed(1),
          ),
          cmvAproximado: this.toNumber(financeiro.cmvAproximado),
          limitacoes: [
            'Inadimplência, aging, contas a pagar/receber e fluxo de caixa dependem de tabelas financeiras ainda não mapeadas.',
          ],
        },
        operacaoLogistica: {
          status: 'dependente-de-tabelas-operacionais',
          disponivelAgora: [
            'giro por produto',
            'curva ABC',
            'sinais de ruptura por tendência de venda',
          ],
          pendenteMapeamento: [
            'entregas',
            'motoristas',
            'rotas',
            'separação',
            'carregamento',
            'avarias',
          ],
        },
        geografico: {
          vendasPorLocalidade: geograficoResult.recordset,
          observacao: geograficoResult.recordset.length
            ? 'Mapa comercial disponível a partir de localidade do pedido.'
            : 'Colunas de cidade/região não foram confirmadas na tabela Pedido.',
        },
      },
    };
  }

  async getExecutiveAlerts() {
    const quedaVendedores = await this.pool.request().query(`
      WITH atual AS (
        SELECT UsuCad, SUM(ValTotal) AS atual
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -7, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND UsuCad IS NOT NULL AND UsuCad != ''
          AND UPPER(UsuCad) NOT IN ('FRONT', 'ALESSANDRO', 'CAROLINA')
        GROUP BY UsuCad
      ), anterior AS (
        SELECT UsuCad, SUM(ValTotal) AS anterior
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -14, GETDATE())
          AND DT_Data < DATEADD(DAY, -7, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND UsuCad IS NOT NULL AND UsuCad != ''
          AND UPPER(UsuCad) NOT IN ('FRONT', 'ALESSANDRO', 'CAROLINA')
        GROUP BY UsuCad
      )
      SELECT TOP 5 a.UsuCad AS nomeVendedor, a.atual, b.anterior,
        CASE WHEN b.anterior > 0 THEN ((a.atual - b.anterior) / b.anterior) * 100 ELSE 0 END AS variacao
      FROM atual a
      INNER JOIN anterior b ON b.UsuCad = a.UsuCad
      WHERE b.anterior > 0 AND a.atual < b.anterior * 0.8
      ORDER BY variacao ASC
    `);

    const clientesRisco = await this.pool.request().query(`
      SELECT TOP 10
        CAST(CGCCPF AS VARCHAR) AS documentoCliente,
        MAX(DT_Data) AS ultimaCompra,
        DATEDIFF(DAY, MAX(DT_Data), GETDATE()) AS diasSemComprar,
        ISNULL(SUM(ValTotal), 0) AS faturamentoHistorico
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -120, GETDATE())
        AND DT_Data < DATEADD(DAY, -30, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
        AND CGCCPF IS NOT NULL
      GROUP BY CGCCPF
      HAVING MAX(DT_Data) < DATEADD(DAY, -30, GETDATE())
      ORDER BY faturamentoHistorico DESC
    `);

    const margemCaindo = await this.pool.request().query(`
      SELECT
        CASE WHEN SUM(CASE WHEN DT_Data >= DATEADD(DAY, -7, GETDATE()) THEN ValTotal END) > 0
          THEN SUM(CASE WHEN DT_Data >= DATEADD(DAY, -7, GETDATE()) THEN Lucro END) / SUM(CASE WHEN DT_Data >= DATEADD(DAY, -7, GETDATE()) THEN ValTotal END) * 100 ELSE 0 END AS margemAtual,
        CASE WHEN SUM(CASE WHEN DT_Data >= DATEADD(DAY, -14, GETDATE()) AND DT_Data < DATEADD(DAY, -7, GETDATE()) THEN ValTotal END) > 0
          THEN SUM(CASE WHEN DT_Data >= DATEADD(DAY, -14, GETDATE()) AND DT_Data < DATEADD(DAY, -7, GETDATE()) THEN Lucro END) / SUM(CASE WHEN DT_Data >= DATEADD(DAY, -14, GETDATE()) AND DT_Data < DATEADD(DAY, -7, GETDATE()) THEN ValTotal END) * 100 ELSE 0 END AS margemAnterior
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -14, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
    `);

    const ruptura = await this.pool.request().query(`
      SELECT TOP 10
        i.CodRed AS codProduto,
        ISNULL(pr.Descricao, CAST(i.CodRed AS VARCHAR)) AS nomeProduto,
        SUM(CASE WHEN p.DT_Data >= DATEADD(DAY, -7, GETDATE()) THEN i.Quantidade ELSE 0 END) AS qtdSemanaAtual,
        SUM(CASE WHEN p.DT_Data >= DATEADD(DAY, -30, GETDATE()) THEN i.Quantidade ELSE 0 END) AS qtd30Dias
      FROM Itens i
      INNER JOIN Pedido p ON p.Pedido = i.Pedido
      LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
      WHERE p.DT_Data >= DATEADD(DAY, -30, GETDATE())
        AND p.Situacao = ${SITUACAO_FATURADO}
        AND i.Quantidade > 0
      GROUP BY i.CodRed, pr.Descricao
      HAVING SUM(CASE WHEN p.DT_Data >= DATEADD(DAY, -7, GETDATE()) THEN i.Quantidade ELSE 0 END) > (SUM(i.Quantidade) / 30.0) * 10
      ORDER BY qtdSemanaAtual DESC
    `);

    const margem = margemCaindo.recordset[0];
    const alerts: Array<{
      type: string;
      severity: string;
      title: string;
      description: string;
      action: string;
    }> = [];

    quedaVendedores.recordset.forEach((v) => {
      alerts.push({
        type: 'comercial',
        severity: this.toNumber(v.variacao) <= -35 ? 'critical' : 'warning',
        title: `Queda de desempenho: ${v.nomeVendedor}`,
        description: `Faturamento semanal caiu ${Math.abs(this.toNumber(v.variacao)).toFixed(1)}% vs. semana anterior.`,
        action:
          'Revisar carteira, clientes sem compra e mix vendido pelo vendedor.',
      });
    });

    clientesRisco.recordset.slice(0, 5).forEach((c) => {
      alerts.push({
        type: 'clientes',
        severity:
          this.toNumber(c.faturamentoHistorico) > 10000
            ? 'critical'
            : 'warning',
        title: `Cliente relevante sem comprar há ${c.diasSemComprar} dias`,
        description: `Cliente ${c.documentoCliente} tem histórico de R$ ${this.toNumber(c.faturamentoHistorico).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        action:
          'Priorizar contato comercial e oferta baseada nas últimas categorias compradas.',
      });
    });

    if (
      this.toNumber(margem.margemAnterior) > 0 &&
      this.toNumber(margem.margemAtual) <
        this.toNumber(margem.margemAnterior) - 2
    ) {
      alerts.push({
        type: 'financeiro',
        severity: 'warning',
        title: 'Margem bruta em queda',
        description: `Margem semanal saiu de ${this.toNumber(margem.margemAnterior).toFixed(1)}% para ${this.toNumber(margem.margemAtual).toFixed(1)}%.`,
        action:
          'Auditar descontos, mix de produtos e vendedores com margem abaixo da média.',
      });
    }

    ruptura.recordset.slice(0, 5).forEach((p) => {
      alerts.push({
        type: 'estoque',
        severity: 'info',
        title: `Demanda acelerada: ${p.nomeProduto}`,
        description: `Produto vendeu ${p.qtdSemanaAtual} unidades na semana e pode exigir reposição preventiva.`,
        action: 'Conferir saldo em estoque e compras pendentes.',
      });
    });

    if (!alerts.length) {
      alerts.push({
        type: 'estrategico',
        severity: 'info',
        title: 'Operação sem anomalias críticas detectadas',
        description:
          'Não encontramos quedas fortes de vendedores, clientes críticos parados ou queda relevante de margem nas regras atuais.',
        action:
          'Acompanhar diariamente e configurar metas para ativar alertas preditivos mais fortes.',
      });
    }

    return alerts;
  }
}
