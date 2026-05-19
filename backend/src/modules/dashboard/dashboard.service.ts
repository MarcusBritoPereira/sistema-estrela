/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, Inject } from '@nestjs/common';
import * as sql from 'mssql';
import {
  MOCK_KPIS,
  MOCK_VENDAS_DIA,
  MOCK_VENDAS_MES,
  MOCK_RANKING_VENDEDORES,
  getMockVendorDetails,
  MOCK_PRODUTOS_MAIS_VENDIDOS,
  MOCK_PRODUTOS_MENOS_VENDIDOS,
  MOCK_INSIGHTS,
  MOCK_DECISION_COCKPIT,
  MOCK_EXECUTIVE_OVERVIEW,
  MOCK_EXECUTIVE_ALERTS,
} from '../../common/mock/contingency-data';

// Situacao '2' = Faturado no sistema Máxima/ERP
const SITUACAO_FATURADO = "'2'";

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DATABASE_CONNECTION') private pool: sql.ConnectionPool,
  ) {}

  private sanitizeMonths(value: number): number {
    if (!Number.isInteger(value)) return 12;
    return Math.min(Math.max(value, 1), 60);
  }

  private sanitizeTop(value: number): number {
    if (!Number.isInteger(value)) return 10;
    return Math.min(Math.max(value, 1), 100);
  }

  async getKpis(periodo: number = 30) {
    try {
      const dias = this.sanitizeDays(periodo);

      const kpisResult = await this.pool.request().input('dias', sql.Int, dias)
        .query(`
        SELECT
          COUNT(DISTINCT Pedido) AS totalPedidos,
          ISNULL(SUM(ValTotal), 0) AS faturamentoTotal,
          ISNULL(AVG(ValTotal), 0) AS ticketMedio,
          ISNULL(SUM(Lucro), 0) AS lucroTotal
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
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

      const clientesResult = await this.pool
        .request()
        .input('dias', sql.Int, dias).query(`
        SELECT COUNT(DISTINCT CGCCPF) AS totalClientes
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
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
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getKpis:',
        err,
      );
      return MOCK_KPIS;
    }
  }

  async getVendasPorDia(dias: number = 30) {
    try {
      const result = await this.pool
        .request()
        .input('dias', sql.Int, this.sanitizeDays(dias)).query(`
        SELECT
          CAST(DT_Data AS DATE) AS data,
          COUNT(DISTINCT Pedido) AS qtdPedidos,
          ISNULL(SUM(ValTotal), 0) AS faturamento
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND DT_Data IS NOT NULL
        GROUP BY CAST(DT_Data AS DATE)
        ORDER BY data
      `);
      return result.recordset;
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getVendasPorDia:',
        err,
      );
      return MOCK_VENDAS_DIA;
    }
  }

  async getVendasPorMes(meses: number = 12) {
    try {
      const result = await this.pool
        .request()
        .input('meses', sql.Int, this.sanitizeMonths(meses)).query(`
        SELECT
          YEAR(DT_Data) AS ano,
          MONTH(DT_Data) AS mes,
          FORMAT(DT_Data, 'MMM/yy', 'pt-BR') AS label,
          COUNT(DISTINCT Pedido) AS qtdPedidos,
          ISNULL(SUM(ValTotal), 0) AS faturamento,
          ISNULL(SUM(Lucro), 0) AS lucro
        FROM Pedido
        WHERE DT_Data >= DATEADD(MONTH, -@meses, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND DT_Data IS NOT NULL
        GROUP BY YEAR(DT_Data), MONTH(DT_Data), FORMAT(DT_Data, 'MMM/yy', 'pt-BR')
        ORDER BY ano, mes
      `);
      return result.recordset;
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getVendasPorMes:',
        err,
      );
      return MOCK_VENDAS_MES;
    }
  }

  async getRankingVendedores(periodo: number = 30) {
    try {
      const result = await this.pool
        .request()
        .input('periodo', sql.Int, this.sanitizeDays(periodo)).query(`
        SELECT TOP 10
          CAST(p.Area AS VARCHAR) AS area,
          ISNULL(a.DESCRICAO, p.Area) AS nomeVendedor,
          COUNT(DISTINCT p.Pedido) AS qtdPedidos,
          ISNULL(SUM(p.ValTotal), 0) AS faturamento,
          ISNULL(AVG(p.ValTotal), 0) AS ticketMedio,
          ISNULL(SUM(p.Lucro), 0) AS lucro
        FROM Pedido p
        LEFT JOIN Area a ON CAST(a.AREA AS VARCHAR) = CAST(p.Area AS VARCHAR)
        WHERE p.DT_Data >= DATEADD(DAY, -@periodo, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND p.ValTotal > 0
          AND p.Area != ''
        GROUP BY p.Area, a.DESCRICAO
        ORDER BY faturamento DESC
      `);
      return result.recordset;
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getRankingVendedores:',
        err,
      );
      return MOCK_RANKING_VENDEDORES;
    }
  }

  async getVendorDetails(area: string, periodo: number = 30) {
    try {
      const req = this.pool.request();
      req.input('area', sql.VarChar, area);
      req.input('periodo', sql.Int, this.sanitizeDays(periodo));

      // 1. Dados do Vendedor
      const areaQuery = `
        SELECT TOP 1
          CAST(AREA AS VARCHAR) AS area,
          ISNULL(DESCRICAO, 'Vendedor ' + @area) AS nomeVendedor
        FROM Area
        WHERE CAST(AREA AS VARCHAR) = @area
      `;
      const areaRes = await req.query(areaQuery);
      let vendedorInfo = areaRes.recordset[0];
      if (!vendedorInfo) {
        vendedorInfo = {
          area,
          nomeVendedor: `Vendedor / Rota ${area}`,
        };
      }

      // 2. KPIs Comerciais do Vendedor no período
      const kpisQuery = `
        SELECT
          COUNT(DISTINCT p.Pedido) AS qtdPedidos,
          ISNULL(SUM(p.ValTotal), 0) AS faturamentoTotal,
          ISNULL(SUM(p.Lucro), 0) AS lucroTotal,
          COUNT(DISTINCT p.CGCCPF) AS totalClientesAtendidos,
          MAX(p.DT_Data) AS ultimaVenda
        FROM Pedido p
        WHERE CAST(p.Area AS VARCHAR) = @area
          AND p.DT_Data >= DATEADD(DAY, -@periodo, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND p.ValTotal > 0
      `;
      const kpisRes = await req.query(kpisQuery);
      const kpisData = kpisRes.recordset[0] || {
        qtdPedidos: 0,
        faturamentoTotal: 0,
        lucroTotal: 0,
        totalClientesAtendidos: 0,
        ultimaVenda: null,
      };
      const fatTotal = this.toNumber(kpisData.faturamentoTotal);
      const qtdTotal = this.toNumber(kpisData.qtdPedidos);
      const ticketMedio = qtdTotal > 0 ? fatTotal / qtdTotal : 0;

      // 3. Últimos 50 Pedidos do Vendedor no período
      const pedidosQuery = `
        SELECT TOP 50
          p.Pedido AS pedido,
          p.DT_Data AS data,
          p.ValTotal AS valorTotal,
          CAST(p.CGCCPF AS VARCHAR) AS cgc,
          ISNULL(c.NOME, CAST(p.CGCCPF AS VARCHAR)) AS nomeCliente,
          ISNULL(c.CondPag, 'À VISTA') AS condPag,
          ISNULL(c.PRAZO, '0') AS prazo
        FROM Pedido p
        LEFT JOIN cadcli c ON c.CGC2 = p.CGCCPF
        WHERE CAST(p.Area AS VARCHAR) = @area
          AND p.DT_Data >= DATEADD(DAY, -@periodo, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND p.ValTotal > 0
        ORDER BY p.DT_Data DESC
      `;
      const pedidosRes = await req.query(pedidosQuery);
      const pedidos = pedidosRes.recordset.map((p) => ({
        pedido: p.pedido,
        data: p.data,
        valorTotal: this.toNumber(p.valorTotal),
        cgc: p.cgc,
        nomeCliente: p.nomeCliente,
        condPag: p.condPag,
        prazo: p.prazo,
      }));

      // 4. Top 15 Produtos do Vendedor no período
      const produtosQuery = `
        SELECT TOP 15
          i.CodRed AS codProduto,
          ISNULL(MAX(pr.Descricao), CAST(i.CodRed AS VARCHAR)) AS nomeProduto,
          ISNULL(MAX(f.Descricao), 'Geral') AS familia,
          SUM(i.Quantidade) AS quantidade,
          SUM(i.ValorNegTot) AS valorTotal
        FROM Itens i
        INNER JOIN Pedido p ON p.Pedido = i.Pedido
        LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
        LEFT JOIN Familia f ON f.Codigo = pr.Familia
        WHERE CAST(p.Area AS VARCHAR) = @area
          AND p.DT_Data >= DATEADD(DAY, -@periodo, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND p.ValTotal > 0
        GROUP BY i.CodRed
        ORDER BY valorTotal DESC
      `;
      const produtosRes = await req.query(produtosQuery);
      const topProdutos = produtosRes.recordset.map((item) => ({
        codProduto: item.codProduto,
        nomeProduto: item.nomeProduto,
        familia: item.familia,
        quantidade: this.toNumber(item.quantidade),
        valorTotal: this.toNumber(item.valorTotal),
        precoMedio:
          this.toNumber(item.quantidade) > 0
            ? this.toNumber(item.valorTotal) / this.toNumber(item.quantidade)
            : 0,
      }));

      return {
        vendedor: {
          ...vendedorInfo,
          faturamentoTotal: fatTotal,
          qtdPedidos: qtdTotal,
          ticketMedio,
          lucroTotal: this.toNumber(kpisData.lucroTotal),
          totalClientesAtendidos: this.toNumber(
            kpisData.totalClientesAtendidos,
          ),
          ultimaVenda: kpisData.ultimaVenda,
        },
        pedidos,
        topProdutos,
      };
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getVendorDetails:',
        err,
      );
      return getMockVendorDetails(area);
    }
  }

  async getProdutosMaisVendidos(periodo: number = 30, top: number = 10) {
    try {
      const result = await this.pool
        .request()
        .input('periodo', sql.Int, this.sanitizeDays(periodo))
        .input('top', sql.Int, this.sanitizeTop(top)).query(`
        SELECT TOP (@top)
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
        WHERE p.DT_Data >= DATEADD(DAY, -@periodo, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND i.Quantidade > 0
        GROUP BY i.CodRed, pr.Descricao, f.Descricao
        ORDER BY faturamento DESC
      `);
      return result.recordset;
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getProdutosMaisVendidos:',
        err,
      );
      return MOCK_PRODUTOS_MAIS_VENDIDOS;
    }
  }

  async getProdutosMenosVendidos(periodo: number = 30, top: number = 10) {
    try {
      const result = await this.pool
        .request()
        .input('periodo', sql.Int, this.sanitizeDays(periodo))
        .input('top', sql.Int, this.sanitizeTop(top)).query(`
        SELECT TOP (@top)
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
        WHERE p.DT_Data >= DATEADD(DAY, -@periodo, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND i.Quantidade > 0
        GROUP BY i.CodRed, pr.Descricao, f.Descricao
        ORDER BY faturamento ASC, SUM(i.Quantidade) ASC
      `);
      return result.recordset;
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getProdutosMenosVendidos:',
        err,
      );
      return MOCK_PRODUTOS_MENOS_VENDIDOS;
    }
  }

  async getInsightsAutomaticos() {
    try {
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
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getInsightsAutomaticos:',
        err,
      );
      return MOCK_INSIGHTS;
    }
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

  private getMonthlyRevenueGoal(): number {
    const goal = Number(process.env.EXECUTIVE_MONTHLY_REVENUE_GOAL || 0);
    return Number.isFinite(goal) && goal > 0 ? goal : 0;
  }

  private calculateMonthlyProjection(currentRevenue: number) {
    const now = new Date();
    const elapsedDays = Math.max(now.getUTCDate(), 1);
    const daysInMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    ).getUTCDate();
    return Math.round((currentRevenue / elapsedDays) * daysInMonth * 100) / 100;
  }

  private calculateRiskScore(
    active: number,
    atRisk: number,
    lost: number,
  ): number {
    const total = active + atRisk + lost;
    if (!total) return 0;
    return Number((((atRisk * 0.6 + lost) / total) * 100).toFixed(1));
  }

  private classifyDailyCockpitStatus(
    monthlyGoal: number,
    projectedGoalPercent: number,
    weeklyGrowth: number,
    marginPercent: number,
    criticalAlerts: number,
  ): 'saudavel' | 'atencao' | 'critico' {
    if (
      criticalAlerts >= 2 ||
      weeklyGrowth <= -20 ||
      (monthlyGoal > 0 && projectedGoalPercent < 85) ||
      (marginPercent > 0 && marginPercent < 8)
    ) {
      return 'critico';
    }

    if (
      criticalAlerts >= 1 ||
      weeklyGrowth < 0 ||
      (monthlyGoal > 0 && projectedGoalPercent < 100) ||
      (marginPercent > 0 && marginPercent < 15)
    ) {
      return 'atencao';
    }

    return 'saudavel';
  }

  private getDailyCockpitHeadline(status: string): string {
    if (status === 'critico') {
      return 'Diretoria deve atuar hoje: há risco relevante de meta, margem ou perda comercial.';
    }

    if (status === 'atencao') {
      return 'Operação exige acompanhamento: existem desvios que podem comprometer o fechamento.';
    }

    return 'Indicadores principais saudáveis: manter ritmo e monitorar oportunidades do dia.';
  }

  private buildDecisionItem(
    prioridade: number,
    tema: string,
    severidade: 'critica' | 'alta' | 'media' | 'baixa',
    titulo: string,
    descricao: string,
    impactoEstimado: number,
    responsavelSugerido: string,
    acao: string,
    prazo: string,
  ) {
    return {
      prioridade,
      tema,
      severidade,
      titulo,
      descricao,
      impactoEstimado,
      responsavelSugerido,
      acao,
      prazo,
    };
  }

  async getDailyDecisionCockpit() {
    try {
      const [resumoResult, topQuedaVendedorResult, clienteRiscoResult] =
        await Promise.all([
          this.pool.request().query(`
            SELECT
              ISNULL(SUM(CASE WHEN CAST(DT_Data AS DATE) = CAST(GETDATE() AS DATE) THEN ValTotal END), 0) AS faturamentoHoje,
              COUNT(DISTINCT CASE WHEN CAST(DT_Data AS DATE) = CAST(GETDATE() AS DATE) THEN Pedido END) AS pedidosHoje,
              COUNT(DISTINCT CASE WHEN CAST(DT_Data AS DATE) = CAST(GETDATE() AS DATE) THEN CGCCPF END) AS clientesHoje,
              ISNULL(SUM(CASE WHEN CAST(DT_Data AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE) THEN ValTotal END), 0) AS faturamentoOntem,
              ISNULL(SUM(CASE WHEN DT_Data >= DATEADD(DAY, -7, GETDATE()) THEN ValTotal END), 0) AS faturamentoSemana,
              ISNULL(SUM(CASE WHEN DT_Data >= DATEADD(DAY, -14, GETDATE()) AND DT_Data < DATEADD(DAY, -7, GETDATE()) THEN ValTotal END), 0) AS faturamentoSemanaAnterior,
              COUNT(DISTINCT CASE WHEN DT_Data >= DATEADD(DAY, -7, GETDATE()) THEN Pedido END) AS pedidosSemana,
              COUNT(DISTINCT CASE WHEN DT_Data >= DATEADD(DAY, -7, GETDATE()) THEN UsuCad END) AS vendedoresAtivosSemana,
              ISNULL(SUM(CASE WHEN MONTH(DT_Data) = MONTH(GETDATE()) AND YEAR(DT_Data) = YEAR(GETDATE()) THEN ValTotal END), 0) AS faturamentoMes,
              COUNT(DISTINCT CASE WHEN MONTH(DT_Data) = MONTH(GETDATE()) AND YEAR(DT_Data) = YEAR(GETDATE()) THEN Pedido END) AS pedidosMes,
              ISNULL(SUM(CASE WHEN MONTH(DT_Data) = MONTH(GETDATE()) AND YEAR(DT_Data) = YEAR(GETDATE()) THEN Lucro END), 0) AS lucroMes,
              COUNT(DISTINCT CASE WHEN MONTH(DT_Data) = MONTH(GETDATE()) AND YEAR(DT_Data) = YEAR(GETDATE()) THEN CGCCPF END) AS clientesMes
            FROM Pedido
            WHERE DT_Data >= DATEADD(DAY, -45, GETDATE())
              AND Situacao = ${SITUACAO_FATURADO}
              AND ValTotal > 0
          `),
          this.pool.request().query(`
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
            SELECT TOP 1
              a.UsuCad AS nomeVendedor,
              a.atual,
              b.anterior,
              CASE WHEN b.anterior > 0 THEN ((a.atual - b.anterior) / b.anterior) * 100 ELSE 0 END AS variacao,
              CASE WHEN b.anterior > a.atual THEN b.anterior - a.atual ELSE 0 END AS impactoEstimado
            FROM atual a
            INNER JOIN anterior b ON b.UsuCad = a.UsuCad
            WHERE b.anterior > 0 AND a.atual < b.anterior * 0.8
            ORDER BY impactoEstimado DESC
          `),
          this.pool.request().query(`
            SELECT TOP 1
              p.CGCCPF AS documentoCliente,
              ISNULL(NULLIF(c.NOME, ''), CAST(p.CGCCPF AS VARCHAR)) AS nomeCliente,
              MAX(p.DT_Data) AS ultimaCompra,
              DATEDIFF(DAY, MAX(p.DT_Data), GETDATE()) AS diasSemComprar,
              SUM(p.ValTotal) AS faturamentoHistorico
            FROM Pedido p
            LEFT JOIN cadcli c ON c.CGC2 = p.CGCCPF
            WHERE p.DT_Data >= DATEADD(DAY, -180, GETDATE())
              AND p.Situacao = ${SITUACAO_FATURADO}
              AND p.ValTotal > 0
              AND p.CGCCPF IS NOT NULL
            GROUP BY p.CGCCPF, c.NOME
            HAVING DATEDIFF(DAY, MAX(p.DT_Data), GETDATE()) >= 30
            ORDER BY faturamentoHistorico DESC
          `),
        ]);

      const resumo = resumoResult.recordset[0] || {};
      const faturamentoHoje = this.toNumber(resumo.faturamentoHoje);
      const faturamentoOntem = this.toNumber(resumo.faturamentoOntem);
      const faturamentoSemana = this.toNumber(resumo.faturamentoSemana);
      const faturamentoSemanaAnterior = this.toNumber(
        resumo.faturamentoSemanaAnterior,
      );
      const faturamentoMes = this.toNumber(resumo.faturamentoMes);
      const lucroMes = this.toNumber(resumo.lucroMes);
      const metaMensal = this.getMonthlyRevenueGoal();
      const previsaoFechamentoMes =
        this.calculateMonthlyProjection(faturamentoMes);
      const crescimentoHoje = this.calcGrowth(
        faturamentoHoje,
        faturamentoOntem,
      );
      const crescimentoSemana = this.calcGrowth(
        faturamentoSemana,
        faturamentoSemanaAnterior,
      );
      const margemMesPercentual = faturamentoMes
        ? Number(((lucroMes / faturamentoMes) * 100).toFixed(1))
        : 0;
      const percentualMetaProjetada = metaMensal
        ? Number(((previsaoFechamentoMes / metaMensal) * 100).toFixed(1))
        : 0;
      const gapMetaProjetada = Math.max(metaMensal - previsaoFechamentoMes, 0);

      const decisoesHoje: ReturnType<typeof this.buildDecisionItem>[] = [];

      if (metaMensal > 0 && percentualMetaProjetada < 100) {
        decisoesHoje.push(
          this.buildDecisionItem(
            1,
            'meta',
            percentualMetaProjetada < 85 ? 'critica' : 'alta',
            'Fechamento projetado abaixo da meta mensal',
            `Projeção atual atinge ${percentualMetaProjetada}% da meta configurada.`,
            gapMetaProjetada,
            'Diretoria comercial',
            'Revisar plano de recuperação da semana, priorizar clientes A/B parados e acompanhar vendedores abaixo da tendência.',
            'Hoje até 12h',
          ),
        );
      }

      if (crescimentoSemana < 0) {
        decisoesHoje.push(
          this.buildDecisionItem(
            2,
            'comercial',
            crescimentoSemana <= -20 ? 'critica' : 'alta',
            'Semana atual abaixo da semana anterior',
            `Faturamento semanal varia ${crescimentoSemana}% em relação aos 7 dias anteriores.`,
            Math.max(faturamentoSemanaAnterior - faturamentoSemana, 0),
            'Gerência comercial',
            'Comparar pedidos perdidos por vendedor, clientes sem recompra e produtos com queda de giro.',
            'Hoje',
          ),
        );
      }

      if (topQuedaVendedorResult.recordset.length) {
        const vendedor = topQuedaVendedorResult.recordset[0];
        decisoesHoje.push(
          this.buildDecisionItem(
            3,
            'vendedor',
            this.toNumber(vendedor.variacao) <= -35 ? 'critica' : 'alta',
            `Queda relevante em ${vendedor.nomeVendedor}`,
            `Vendedor caiu ${Math.abs(this.toNumber(vendedor.variacao)).toFixed(1)}% contra a semana anterior.`,
            this.toNumber(vendedor.impactoEstimado),
            'Gerente responsável pela carteira',
            'Abrir carteira do vendedor, ligar para clientes recorrentes sem pedido e revisar mix vendido nos últimos 7 dias.',
            'Hoje até 16h',
          ),
        );
      }

      if (clienteRiscoResult.recordset.length) {
        const cliente = clienteRiscoResult.recordset[0];
        decisoesHoje.push(
          this.buildDecisionItem(
            4,
            'cliente',
            this.toNumber(cliente.faturamentoHistorico) >= 10000
              ? 'alta'
              : 'media',
            `Cliente relevante sem comprar há ${cliente.diasSemComprar} dias`,
            `${cliente.nomeCliente} tem histórico recente de compra e está fora da rotina de recompra.`,
            this.toNumber(cliente.faturamentoHistorico),
            'Vendedor da carteira',
            'Priorizar contato com oferta baseada nas últimas categorias compradas e registrar retorno comercial.',
            'Até amanhã',
          ),
        );
      }

      if (margemMesPercentual > 0 && margemMesPercentual < 15) {
        decisoesHoje.push(
          this.buildDecisionItem(
            5,
            'margem',
            margemMesPercentual < 8 ? 'critica' : 'alta',
            'Margem bruta aproximada abaixo do nível de atenção',
            `Margem mensal estimada em ${margemMesPercentual}%.`,
            0,
            'Diretoria financeira/comercial',
            'Auditar descontos, famílias vendidas com baixa margem e vendedores com desvio contra a média.',
            'Hoje',
          ),
        );
      }

      if (!decisoesHoje.length) {
        decisoesHoje.push(
          this.buildDecisionItem(
            1,
            'crescimento',
            'baixa',
            'Sem desvio crítico detectado no cockpit diário',
            'Indicadores comerciais principais não acionaram gatilhos de risco nesta leitura.',
            0,
            'Diretoria',
            'Manter cadência diária, buscar oportunidades em clientes A/B e acompanhar produtos de maior giro.',
            'Rotina diária',
          ),
        );
      }

      const criticalAlerts = decisoesHoje.filter((item) =>
        ['critica', 'alta'].includes(item.severidade),
      ).length;
      const status = this.classifyDailyCockpitStatus(
        metaMensal,
        percentualMetaProjetada,
        crescimentoSemana,
        margemMesPercentual,
        criticalAlerts,
      );

      return {
        faseImplementacao: 'fase-1-cockpit-executivo-diario',
        generatedAt: new Date().toISOString(),
        status,
        headline: this.getDailyCockpitHeadline(status),
        indicadores: {
          hoje: {
            faturamento: faturamentoHoje,
            pedidos: this.toNumber(resumo.pedidosHoje),
            clientes: this.toNumber(resumo.clientesHoje),
            crescimentoVsOntemPercentual: crescimentoHoje,
          },
          semana: {
            faturamento: faturamentoSemana,
            faturamentoAnterior: faturamentoSemanaAnterior,
            pedidos: this.toNumber(resumo.pedidosSemana),
            vendedoresAtivos: this.toNumber(resumo.vendedoresAtivosSemana),
            crescimentoPercentual: crescimentoSemana,
          },
          mes: {
            faturamento: faturamentoMes,
            pedidos: this.toNumber(resumo.pedidosMes),
            clientes: this.toNumber(resumo.clientesMes),
            lucroBrutoAproximado: lucroMes,
            margemBrutaPercentual: margemMesPercentual,
            metaMensal,
            previsaoFechamentoMes,
            percentualMetaProjetada,
            gapMetaProjetada,
          },
        },
        decisoesHoje: decisoesHoje.sort((a, b) => a.prioridade - b.prioridade),
      };
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getDailyDecisionCockpit:',
        err,
      );
      return MOCK_DECISION_COCKPIT;
    }
  }

  async getExecutiveOverview(periodo: number = 30) {
    try {
      const dias = this.sanitizeDays(periodo);
      const diasAnterior = dias * 2;
      const diasRisco = dias * 3;

      const comercialResult = await this.pool
        .request()
        .input('dias', sql.Int, dias)
        .input('diasAnterior', sql.Int, diasAnterior).query(`
        SELECT
          COUNT(DISTINCT Pedido) AS pedidos,
          ISNULL(SUM(ValTotal), 0) AS faturamento,
          ISNULL(AVG(ValTotal), 0) AS ticketMedio,
          ISNULL(SUM(Lucro), 0) AS lucro,
          COUNT(DISTINCT CGCCPF) AS clientesAtivos,
          COUNT(DISTINCT UsuCad) AS vendedoresAtivos,
          ISNULL(SUM(CASE WHEN DT_Data >= DATEADD(DAY, -@dias, GETDATE()) THEN ValTotal END), 0) AS faturamentoAtual,
          ISNULL(SUM(CASE WHEN DT_Data >= DATEADD(DAY, -@diasAnterior, GETDATE()) AND DT_Data < DATEADD(DAY, -@dias, GETDATE()) THEN ValTotal END), 0) AS faturamentoAnterior,
          ISNULL(SUM(CASE WHEN MONTH(DT_Data) = MONTH(GETDATE()) AND YEAR(DT_Data) = YEAR(GETDATE()) THEN ValTotal END), 0) AS faturamentoMesAtual
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -@diasAnterior, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
      `);

      const mixResult = await this.pool
        .request()
        .input('dias', sql.Int, dias)
        .input('diasAnterior', sql.Int, diasAnterior).query(`
        SELECT ISNULL(AVG(CAST(itemCount AS FLOAT)), 0) AS mixMedioProdutos
        FROM (
          SELECT p.Pedido, COUNT(DISTINCT i.CodRed) AS itemCount
          FROM Pedido p
          INNER JOIN Itens i ON i.Pedido = p.Pedido
          WHERE p.DT_Data >= DATEADD(DAY, -@dias, GETDATE())
            AND p.Situacao = ${SITUACAO_FATURADO}
            AND p.ValTotal > 0
          GROUP BY p.Pedido
        ) x
      `);

      const vendedoresResult = await this.pool
        .request()
        .input('dias', sql.Int, dias)
        .input('diasAnterior', sql.Int, diasAnterior)
        .input('diasRisco', sql.Int, diasRisco).query(`
        WITH atual AS (
          SELECT UsuCad, SUM(ValTotal) AS faturamentoAtual, COUNT(DISTINCT Pedido) AS pedidosAtual, SUM(Lucro) AS lucroAtual
          FROM Pedido
          WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
            AND Situacao = ${SITUACAO_FATURADO}
            AND ValTotal > 0
            AND UsuCad IS NOT NULL AND UsuCad != ''
            AND UPPER(UsuCad) NOT IN ('FRONT', 'ALESSANDRO', 'CAROLINA')
          GROUP BY UsuCad
        ), anterior AS (
          SELECT UsuCad, SUM(ValTotal) AS faturamentoAnterior
          FROM Pedido
          WHERE DT_Data >= DATEADD(DAY, -@diasAnterior, GETDATE())
            AND DT_Data < DATEADD(DAY, -@dias, GETDATE())
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

      const clientesResult = await this.pool
        .request()
        .input('dias', sql.Int, dias)
        .input('diasAnterior', sql.Int, diasAnterior)
        .input('diasRisco', sql.Int, diasRisco).query(`
        WITH atual AS (
          SELECT CGCCPF, SUM(ValTotal) AS faturamentoAtual, COUNT(DISTINCT Pedido) AS pedidosAtual, MAX(DT_Data) AS ultimaCompra
          FROM Pedido
          WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
            AND Situacao = ${SITUACAO_FATURADO}
            AND ValTotal > 0
            AND CGCCPF IS NOT NULL
          GROUP BY CGCCPF
        ), anterior AS (
          SELECT CGCCPF, SUM(ValTotal) AS faturamentoAnterior
          FROM Pedido
          WHERE DT_Data >= DATEADD(DAY, -@diasAnterior, GETDATE())
            AND DT_Data < DATEADD(DAY, -@dias, GETDATE())
            AND Situacao = ${SITUACAO_FATURADO}
            AND ValTotal > 0
            AND CGCCPF IS NOT NULL
          GROUP BY CGCCPF
        ), historico AS (
          SELECT CGCCPF, MAX(DT_Data) AS ultimaCompraHistorica
          FROM Pedido
          WHERE DT_Data < DATEADD(DAY, -@dias, GETDATE())
            AND Situacao = ${SITUACAO_FATURADO}
            AND ValTotal > 0
            AND CGCCPF IS NOT NULL
          GROUP BY CGCCPF
        )
        SELECT
          (SELECT COUNT(*) FROM atual) AS clientesAtivos,
          (SELECT COUNT(*) FROM atual a LEFT JOIN anterior b ON b.CGCCPF = a.CGCCPF WHERE ISNULL(b.faturamentoAnterior, 0) = 0) AS clientesNovosOuRecuperados,
          (SELECT COUNT(*) FROM historico h LEFT JOIN atual a ON a.CGCCPF = h.CGCCPF WHERE a.CGCCPF IS NULL AND h.ultimaCompraHistorica >= DATEADD(DAY, -@diasRisco, GETDATE())) AS clientesEmRisco,
          (SELECT COUNT(*) FROM anterior b LEFT JOIN atual a ON a.CGCCPF = b.CGCCPF WHERE a.CGCCPF IS NULL) AS clientesPerdidos
      `);

      const curvaClientesResult = await this.pool
        .request()
        .input('dias', sql.Int, dias)
        .input('diasAnterior', sql.Int, diasAnterior).query(`
        WITH clientes AS (
          SELECT CGCCPF, SUM(ValTotal) AS faturamento
          FROM Pedido
          WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
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

      const produtosResult = await this.pool
        .request()
        .input('dias', sql.Int, dias)
        .input('diasAnterior', sql.Int, diasAnterior).query(`
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
          WHERE p.DT_Data >= DATEADD(DAY, -@dias, GETDATE())
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

      const financeiroResult = await this.pool
        .request()
        .input('dias', sql.Int, dias)
        .input('diasAnterior', sql.Int, diasAnterior).query(`
        SELECT
          ISNULL(SUM(ValTotal), 0) AS faturamento,
          ISNULL(SUM(Lucro), 0) AS lucroBrutoAproximado,
          CASE WHEN ISNULL(SUM(ValTotal), 0) > 0 THEN ISNULL(SUM(Lucro), 0) / SUM(ValTotal) * 100 ELSE 0 END AS margemBrutaPercentual,
          ISNULL(SUM(ValTotal - Lucro), 0) AS cmvAproximado
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
      `);

      const concentracaoResult = await this.pool
        .request()
        .input('dias', sql.Int, dias).query(`
        WITH clientes AS (
          SELECT TOP 10 CGCCPF, SUM(ValTotal) AS faturamento
          FROM Pedido
          WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
            AND Situacao = ${SITUACAO_FATURADO}
            AND ValTotal > 0
            AND CGCCPF IS NOT NULL
          GROUP BY CGCCPF
          ORDER BY faturamento DESC
        ), total AS (
          SELECT SUM(ValTotal) AS faturamentoTotal
          FROM Pedido
          WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
            AND Situacao = ${SITUACAO_FATURADO}
            AND ValTotal > 0
            AND CGCCPF IS NOT NULL
        )
        SELECT
          ISNULL(SUM(c.faturamento), 0) AS faturamentoTop10Clientes,
          ISNULL(MAX(t.faturamentoTotal), 0) AS faturamentoTotalClientes,
          CASE WHEN ISNULL(MAX(t.faturamentoTotal), 0) > 0
            THEN ISNULL(SUM(c.faturamento), 0) / MAX(t.faturamentoTotal) * 100
            ELSE 0 END AS percentualTop10Clientes
        FROM clientes c
        CROSS JOIN total t
      `);

      const geograficoResult = await this.pool
        .request()
        .input('dias', sql.Int, dias)
        .query(
          `
        SELECT TOP 10
          COALESCE(CAST(Cidade AS VARCHAR), CAST(Municipio AS VARCHAR), 'NÃO INFORMADO') AS localidade,
          COUNT(DISTINCT Pedido) AS pedidos,
          ISNULL(SUM(ValTotal), 0) AS faturamento
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -@dias, GETDATE())
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
      const concentracao = concentracaoResult.recordset[0] || {};

      const faturamentoAtual = this.toNumber(comercial.faturamentoAtual);
      const faturamentoAnterior = this.toNumber(comercial.faturamentoAnterior);
      const crescimento = this.calcGrowth(
        faturamentoAtual,
        faturamentoAnterior,
      );
      const metaMensal = this.getMonthlyRevenueGoal();
      const faturamentoMes = this.toNumber(comercial.faturamentoMesAtual);
      const previsaoFechamentoMes =
        this.calculateMonthlyProjection(faturamentoMes);
      const percentualMeta =
        metaMensal > 0
          ? Number(((faturamentoMes / metaMensal) * 100).toFixed(1))
          : 0;
      const percentualMetaProjetada =
        metaMensal > 0
          ? Number(((previsaoFechamentoMes / metaMensal) * 100).toFixed(1))
          : 0;
      const clientesAtivos = this.toNumber(clientes.clientesAtivos);
      const clientesEmRisco = this.toNumber(clientes.clientesEmRisco);
      const clientesPerdidos = this.toNumber(clientes.clientesPerdidos);
      const scoreRiscoCarteira = this.calculateRiskScore(
        clientesAtivos,
        clientesEmRisco,
        clientesPerdidos,
      );

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
            metaMensal,
            faturamentoMes,
            previsaoFechamentoMes,
            percentualMeta,
            percentualMetaProjetada,
            tendenciaMeta:
              metaMensal > 0 && previsaoFechamentoMes >= metaMensal
                ? 'acima-da-meta'
                : metaMensal > 0
                  ? 'abaixo-da-meta'
                  : 'meta-nao-configurada',
            rankingVendedores: vendedoresResult.recordset.map((v) => ({
              ...v,
              crescimentoPercentual: this.calcGrowth(
                this.toNumber(v.faturamento),
                this.toNumber(v.faturamentoAnterior),
              ),
              scorePerformance: Math.min(
                100,
                Math.max(
                  0,
                  Number(
                    (
                      this.calcGrowth(
                        this.toNumber(v.faturamento),
                        this.toNumber(v.faturamentoAnterior),
                      ) + 50
                    ).toFixed(1),
                  ),
                ),
              ),
            })),
          },
          clientes: {
            ativos: clientesAtivos,
            novosOuRecuperados: this.toNumber(
              clientes.clientesNovosOuRecuperados,
            ),
            emRisco: clientesEmRisco,
            perdidos: clientesPerdidos,
            scoreRiscoCarteira,
            recomendacao:
              scoreRiscoCarteira >= 35
                ? 'Priorizar recuperação de clientes A/B sem compra e revisar carteira comercial.'
                : 'Manter rotina de positivação e monitorar clientes sem compra.',
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
            lucroBrutoAproximado: this.toNumber(
              financeiro.lucroBrutoAproximado,
            ),
            margemBrutaPercentual: Number(
              this.toNumber(financeiro.margemBrutaPercentual).toFixed(1),
            ),
            cmvAproximado: this.toNumber(financeiro.cmvAproximado),
            concentracaoTop10ClientesPercentual: Number(
              this.toNumber(concentracao.percentualTop10Clientes).toFixed(1),
            ),
            faturamentoTop10Clientes: this.toNumber(
              concentracao.faturamentoTop10Clientes,
            ),
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
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getExecutiveOverview:',
        err,
      );
      return MOCK_EXECUTIVE_OVERVIEW;
    }
  }

  async getExecutiveAlerts() {
    try {
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
          ISNULL(NULLIF(MAX(c.NOME), ''), CAST(p.CGCCPF AS VARCHAR)) AS documentoCliente,
          MAX(p.DT_Data) AS ultimaCompra,
          DATEDIFF(DAY, MAX(p.DT_Data), GETDATE()) AS diasSemComprar,
          ISNULL(SUM(p.ValTotal), 0) AS faturamentoHistorico
        FROM Pedido p
        LEFT JOIN cadcli c ON c.CGC2 = p.CGCCPF
        WHERE p.DT_Data >= DATEADD(DAY, -120, GETDATE())
          AND p.DT_Data < DATEADD(DAY, -30, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND p.ValTotal > 0
          AND p.CGCCPF IS NOT NULL
        GROUP BY p.CGCCPF
        HAVING MAX(p.DT_Data) < DATEADD(DAY, -30, GETDATE())
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
    } catch (err) {
      console.warn(
        '[Contingência] Banco offline, retornando mock em getExecutiveAlerts:',
        err,
      );
      return MOCK_EXECUTIVE_ALERTS;
    }
  }
}
