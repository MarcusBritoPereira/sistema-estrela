import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import * as sql from 'mssql';
import * as fs from 'fs';
import * as path from 'path';

const SITUACAO_FATURADO = "'2'";

const COMPANY_MAP: Record<number, { name: string; cnpj: string; defaultLimit: number }> = {
  1: { name: 'M L Munhoz Ltda', cnpj: '21.262.197/0001-07', defaultLimit: 2000000 },
  2: { name: 'Globo Distribuidora', cnpj: '09.369.910/0001-10', defaultLimit: 2000000 },
  3: { name: 'Mundial Distribuidora', cnpj: '09.408.077/0001-70', defaultLimit: 2000000 },
  4: { name: 'A C Veras Ltda', cnpj: '21.243.849/0001-66', defaultLimit: 2000000 },
  6: { name: 'Premium Distribuidora', cnpj: '55.401.528/0001-64', defaultLimit: 5000000 },
};

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

  private getLimitsFilePath(): string {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'cnpj_limits.json');
  }

  private getStoredLimits(): Record<number, number> {
    const filePath = this.getLimitsFilePath();
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        console.error('Falha ao ler arquivo de limites de CNPJ', err);
      }
    }
    const defaultLimits: Record<number, number> = {};
    for (const dep of Object.keys(COMPANY_MAP)) {
      defaultLimits[Number(dep)] = COMPANY_MAP[Number(dep)].defaultLimit;
    }
    return defaultLimits;
  }

  async saveCnpjLimit(deposito: number, limite: number): Promise<{ success: boolean }> {
    if (!COMPANY_MAP[deposito]) {
      throw new HttpException('Depósito/CNPJ não encontrado', HttpStatus.BAD_REQUEST);
    }
    const limits = this.getStoredLimits();
    limits[deposito] = Number(limite);
    const filePath = this.getLimitsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(limits, null, 2), 'utf-8');
    return { success: true };
  }

  async getFaturamentoCnpj() {
    const limits = this.getStoredLimits();
    const result = await this.pool.request().query(`
      SELECT
        Deposito,
        COUNT(*) as qtdNotas,
        ISNULL(SUM(ValTotal), 0) as faturamentoMensal
      FROM NFSAIDA
      WHERE DT_Data >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0)
        AND Situacao = '2'
      GROUP BY Deposito
    `);

    const queryMap: Record<number, { faturamento: number; qtd: number }> = {};
    result.recordset.forEach((r) => {
      queryMap[r.Deposito] = {
        faturamento: Number(r.faturamentoMensal || 0),
        qtd: Number(r.qtdNotas || 0),
      };
    });

    const empresas = Object.keys(COMPANY_MAP).map((k) => {
      const dep = Number(k);
      const info = COMPANY_MAP[dep];
      const fat = queryMap[dep] ? queryMap[dep].faturamento : 0;
      const qtd = queryMap[dep] ? queryMap[dep].qtd : 0;
      const limite = limits[dep] || info.defaultLimit;
      const folegoRestante = Math.max(0, limite - fat);
      const percentual = limite > 0 ? (fat / limite) * 100 : 0;

      return {
        deposito: dep,
        nome: info.name,
        cnpj: info.cnpj,
        faturamentoMensal: fat,
        qtdNotas: qtd,
        limiteMensal: limite,
        folegoRestante: folegoRestante,
        percentualAtingido: Number(percentual.toFixed(1)),
      };
    });

    const faturamentoTotalGrupo = empresas.reduce((acc, curr) => acc + curr.faturamentoMensal, 0);
    const folegoTotalGrupo = empresas.reduce((acc, curr) => acc + curr.folegoRestante, 0);

    return {
      mesAtual: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      faturamentoTotalGrupo,
      folegoTotalGrupo,
      empresas,
    };
  }

  async getFaturamentoHistorico(period: string = '6m') {
    let dateFilter = "DATEADD(MONTH, -5, DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0))";
    if (period === '12m') {
      dateFilter = "DATEADD(MONTH, -11, DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0))";
    } else if (period === '2026') {
      dateFilter = "'2026-01-01 00:00:00'";
    } else if (period === '2025') {
      dateFilter = "'2025-01-01 00:00:00'";
    } else if (period === '2024') {
      dateFilter = "'2024-01-01 00:00:00'";
    } else if (period === '2023') {
      dateFilter = "'2023-01-01 00:00:00'";
    }

    let yearMaxFilter = "";
    if (period === '2025') yearMaxFilter = " AND DT_Data <= '2025-12-31 23:59:59'";
    if (period === '2024') yearMaxFilter = " AND DT_Data <= '2024-12-31 23:59:59'";
    if (period === '2023') yearMaxFilter = " AND DT_Data <= '2023-12-31 23:59:59'";

    const query = `
      SELECT
        YEAR(DT_Data) as ano,
        MONTH(DT_Data) as mes,
        Deposito,
        COUNT(*) as qtdNotas,
        ISNULL(SUM(ValTotal), 0) as faturamento
      FROM NFSAIDA
      WHERE Situacao = '2'
        AND DT_Data >= ${dateFilter} ${yearMaxFilter}
      GROUP BY YEAR(DT_Data), MONTH(DT_Data), Deposito
      ORDER BY ano, mes, Deposito
    `;

    const result = await this.pool.request().query(query);

    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mapMeses: Record<string, any> = {};

    result.recordset.forEach((r) => {
      const key = `${mesesNomes[r.mes - 1]}/${r.ano}`;
      if (!mapMeses[key]) {
        mapMeses[key] = {
          mesAno: key,
          ano: r.ano,
          mes: r.mes,
          dep_1_fat: 0,
          dep_1_qtd: 0,
          dep_2_fat: 0,
          dep_2_qtd: 0,
          dep_3_fat: 0,
          dep_3_qtd: 0,
          dep_4_fat: 0,
          dep_4_qtd: 0,
          dep_6_fat: 0,
          dep_6_qtd: 0,
        };
      }
      const dep = r.Deposito;
      if ([1, 2, 3, 4, 6].includes(dep)) {
        mapMeses[key][`dep_${dep}_fat`] = Number(r.faturamento || 0);
        mapMeses[key][`dep_${dep}_qtd`] = Number(r.qtdNotas || 0);
      }
    });

    return Object.values(mapMeses);
  }
}
