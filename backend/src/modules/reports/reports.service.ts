import { Injectable, Inject } from '@nestjs/common';
import * as sql from 'mssql';

const SITUACAO_FATURADO = "'2'";

@Injectable()
export class ReportsService {
  constructor(
    @Inject('DATABASE_CONNECTION') private pool: sql.ConnectionPool,
  ) {}

  private getDateWhereClause(
    prefix: string,
    dias?: number,
    startDate?: string,
    endDate?: string,
  ): string {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (
      startDate &&
      endDate &&
      dateRegex.test(startDate) &&
      dateRegex.test(endDate)
    ) {
      return `${prefix}DT_Data >= CAST('${startDate} 00:00:00' AS DATETIME) AND ${prefix}DT_Data <= CAST('${endDate} 23:59:59' AS DATETIME)`;
    }
    const d = dias && !isNaN(dias) ? dias : 30;
    return `${prefix}DT_Data >= DATEADD(DAY, -${d}, GETDATE())`;
  }

  async getConsolidadoFaturamento(
    dias: number = 30,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.getDateWhereClause('', dias, startDate, endDate);
    const result = await this.pool.request().query(`
      SELECT
        CAST(DT_Data AS DATE) AS data,
        COUNT(DISTINCT Pedido) AS qtdPedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamento,
        ISNULL(AVG(ValTotal), 0) AS ticketMedio
      FROM Pedido
      WHERE ${dateFilter}
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
        AND DT_Data IS NOT NULL
      GROUP BY CAST(DT_Data AS DATE)
      ORDER BY data DESC
    `);
    return result.recordset;
  }

  async getGiroEstoque(
    dias: number = 30,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.getDateWhereClause('p.', dias, startDate, endDate);
    const result = await this.pool.request().query(`
      SELECT TOP 100
        i.CodRed AS codProduto,
        ISNULL(pr.Descricao, CAST(i.CodRed AS VARCHAR)) AS nomeProduto,
        ISNULL(f.Descricao, 'Diversos') AS familia,
        SUM(i.Quantidade) AS qtdVendida,
        ISNULL(AVG(i.ValorNegUni), 0) AS precoMedio,
        ISNULL(SUM(i.ValorNegTot), 0) AS faturamento
      FROM Itens i
      INNER JOIN Pedido p ON p.Pedido = i.Pedido
      LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
      LEFT JOIN Familia f ON f.Codigo = pr.Familia
      WHERE ${dateFilter}
        AND p.Situacao = ${SITUACAO_FATURADO}
        AND i.Quantidade > 0
      GROUP BY i.CodRed, pr.Descricao, f.Descricao
      ORDER BY faturamento DESC
    `);
    return result.recordset;
  }

  async getDesempenhoEquipe(
    dias: number = 30,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.getDateWhereClause('', dias, startDate, endDate);
    const result = await this.pool.request().query(`
      SELECT
        ISNULL(UsuCad, 'NÃO INFORMADO') AS nomeVendedor,
        COUNT(DISTINCT Pedido) AS qtdPedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamento,
        ISNULL(AVG(ValTotal), 0) AS ticketMedio
      FROM Pedido
      WHERE ${dateFilter}
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
        AND UsuCad IS NOT NULL AND UsuCad != ''
      GROUP BY UsuCad
      ORDER BY faturamento DESC
    `);
    return result.recordset;
  }

  async getCarteiraClientes(
    dias: number = 30,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.getDateWhereClause('', dias, startDate, endDate);
    const result = await this.pool.request().query(`
      SELECT TOP 100
        ISNULL(CAST(CGCCPF AS VARCHAR), 'BALCÃO / CONSUMIDOR FINAL') AS documentoCliente,
        COUNT(DISTINCT Pedido) AS qtdPedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamentoTotal,
        MAX(DT_Data) AS dataUltimaCompra
      FROM Pedido
      WHERE ${dateFilter}
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
      GROUP BY CGCCPF
      ORDER BY faturamentoTotal DESC
    `);
    return result.recordset;
  }
}
