import { Injectable, Inject } from '@nestjs/common';
import * as sql from 'mssql';

// Situacao '2' = Faturado no sistema Máxima/ERP
const SITUACAO_FATURADO = "'2'";

@Injectable()
export class DashboardService {
  constructor(@Inject('DATABASE_CONNECTION') private pool: sql.ConnectionPool) {}

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
        ? (((mes.faturamentoMes - mesAnt.faturamentoMesAnterior) /
            mesAnt.faturamentoMesAnterior) * 100).toFixed(1)
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
      GROUP BY UsuCad
      ORDER BY faturamento DESC
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
        ? (((comp.semanaAtual - comp.semanaAnterior) / comp.semanaAnterior) * 100).toFixed(1)
        : null;

    const crescMes =
      mesComp.mesAnterior > 0
        ? (((mesComp.mesAtual - mesComp.mesAnterior) / mesComp.mesAnterior) * 100).toFixed(1)
        : null;

    const insights: string[] = [];

    if (totMes.faturamentoMes > 0) {
      insights.push(
        `💰 Faturamento do mês: R$ ${Number(totMes.faturamentoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${totMes.totalPedidosMes} pedidos.`
      );
    }

    if (crescMes !== null) {
      const dir = parseFloat(crescMes) >= 0 ? '📈 cresceu' : '📉 caiu';
      insights.push(`${dir} ${Math.abs(parseFloat(crescMes))}% em relação ao mês anterior.`);
    }

    if (crescSemana !== null) {
      const dir = parseFloat(crescSemana) >= 0 ? 'cresceram' : 'caíram';
      insights.push(`📊 Vendas da semana ${dir} ${Math.abs(parseFloat(crescSemana))}% vs. semana passada.`);
    }

    if (vendedorDestaque.recordset.length > 0) {
      const v = vendedorDestaque.recordset[0];
      insights.push(
        `🏆 Operador destaque da semana: ${v.nome} — R$ ${Number(v.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${v.qtdPedidos} pedidos.`
      );
    }

    if (produtoDestaque.recordset.length > 0) {
      const p = produtoDestaque.recordset[0];
      insights.push(`📦 Produto mais vendido na semana: "${p.nome}" com ${p.qtd} unidades.`);
    }

    return insights;
  }
}
