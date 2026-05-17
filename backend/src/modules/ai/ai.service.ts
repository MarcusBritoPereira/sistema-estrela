import { Injectable, Inject } from '@nestjs/common';
import * as sql from 'mssql';

const SITUACAO_FATURADO = "'2'";

@Injectable()
export class AiService {
  constructor(@Inject('DATABASE_CONNECTION') private pool: sql.ConnectionPool) {}

  async processNaturalLanguageQuery(question: string): Promise<string> {
    const q = question.toLowerCase();

    // 1. Perguntas sobre Vendedores / Equipe Comercial
    if (q.includes('vendedor') || q.includes('quem vendeu') || q.includes('operador') || q.includes('equipe') || q.includes('ranking')) {
      const result = await this.pool.request().query(`
        SELECT TOP 5
          UsuCad AS nome,
          COUNT(DISTINCT Pedido) AS pedidos,
          ISNULL(SUM(ValTotal), 0) AS faturamento,
          ISNULL(AVG(ValTotal), 0) AS ticket
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -30, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
          AND UsuCad IS NOT NULL AND UsuCad != ''
        GROUP BY UsuCad
        ORDER BY faturamento DESC
      `);

      if (result.recordset.length === 0) return 'Nenhuma movimentação de vendedores faturada encontrada nos últimos 30 dias.';

      const top = result.recordset[0];
      let res = `📊 **Análise da Equipe Comercial (Últimos 30 Dias)**\n\nO operador destaque é **${top.nome}**, liderando com um faturamento total de **R$ ${Number(top.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** em ${top.pedidos} pedidos (Ticket médio de R$ ${Number(top.ticket).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).\n\n**Top 5 Operadores no Período:**\n`;
      result.recordset.forEach((v, idx) => {
        res += `${idx + 1}. **${v.nome}**: R$ ${Number(v.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${v.pedidos} pedidos)\n`;
      });
      return res;
    }

    // 2. Perguntas sobre Produtos / Itens mais vendidos
    if (q.includes('produto') || q.includes('item') || q.includes('mais vendido') || q.includes('estoque')) {
      const result = await this.pool.request().query(`
        SELECT TOP 5
          i.CodRed AS cod,
          ISNULL(pr.Descricao, CAST(i.CodRed AS VARCHAR)) AS nome,
          ISNULL(f.Descricao, 'Geral') AS familia,
          SUM(i.Quantidade) AS qtd,
          ISNULL(SUM(i.ValorNegTot), 0) AS faturamento
        FROM Itens i
        INNER JOIN Pedido p ON p.Pedido = i.Pedido
        LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
        LEFT JOIN Familia f ON f.Codigo = pr.Familia
        WHERE p.DT_Data >= DATEADD(DAY, -30, GETDATE())
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND i.Quantidade > 0
        GROUP BY i.CodRed, pr.Descricao, f.Descricao
        ORDER BY faturamento DESC
      `);

      let res = `📦 **Curva A: Produtos de Maior Faturamento (Últimos 30 Dias)**\n\nOs produtos que mais geraram receita para a Distribuidora Estrela foram:\n\n`;
      result.recordset.forEach((p, idx) => {
        res += `${idx + 1}. **${p.nome}** (${p.familia})\n   Faturamento: **R$ ${Number(p.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** | Volume: **${p.qtd.toLocaleString('pt-BR')} unidades**\n\n`;
      });
      res += `💡 *Insight da IA:* Concentre esforços de reposição e campanhas comerciais nas linhas do Top 3 para maximizar a margem operacional.`;
      return res;
    }

    // 3. Perguntas sobre Faturamento / Mês / Vendas Totais
    if (q.includes('faturamento') || q.includes('mês') || q.includes('total') || q.includes('vendas') || q.includes('kpi') || q.includes('receita')) {
      const kpisResult = await this.pool.request().query(`
        SELECT
          COUNT(DISTINCT Pedido) AS totalPedidos,
          ISNULL(SUM(ValTotal), 0) AS faturamentoTotal,
          ISNULL(AVG(ValTotal), 0) AS ticketMedio
        FROM Pedido
        WHERE MONTH(DT_Data) = MONTH(GETDATE())
          AND YEAR(DT_Data) = YEAR(GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
      `);

      const mesAntResult = await this.pool.request().query(`
        SELECT ISNULL(SUM(ValTotal), 0) AS faturamentoMesAnterior
        FROM Pedido
        WHERE MONTH(DT_Data) = MONTH(DATEADD(MONTH, -1, GETDATE()))
          AND YEAR(DT_Data) = YEAR(DATEADD(MONTH, -1, GETDATE()))
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
      `);

      const kpis = kpisResult.recordset[0];
      const mesAnt = mesAntResult.recordset[0];

      let comp = '';
      if (mesAnt.faturamentoMesAnterior > 0) {
        const diff = ((kpis.faturamentoTotal - mesAnt.faturamentoMesAnterior) / mesAnt.faturamentoMesAnterior) * 100;
        const dir = diff >= 0 ? 'acima 📈' : 'abaixo 📉';
        comp = `Este resultado está **${Math.abs(diff).toFixed(1)}% ${dir}** em relação ao faturamento total do mês anterior (R$ ${Number(mesAnt.faturamentoMesAnterior).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`;
      }

      return `💰 **Resumo Financeiro e Comercial (Mês Atual)**\n\n- **Faturamento Acumulado no Mês:** R$ ${Number(kpis.faturamentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n- **Volume de Pedidos Faturados:** ${kpis.totalPedidos} pedidos\n- **Ticket Médio Geral:** R$ ${Number(kpis.ticketMedio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n${comp}`;
    }

    // 4. Perguntas sobre Clientes
    if (q.includes('cliente') || q.includes('atendido') || q.includes('carteira')) {
      const clientesResult = await this.pool.request().query(`
        SELECT COUNT(DISTINCT CGCCPF) AS totalClientes
        FROM Pedido
        WHERE DT_Data >= DATEADD(DAY, -30, GETDATE())
          AND Situacao = ${SITUACAO_FATURADO}
          AND CGCCPF IS NOT NULL
      `);
      const cnt = clientesResult.recordset[0].totalClientes;
      return `🤝 **Análise da Carteira de Clientes**\n\nNos últimos 30 dias, a Distribuidora Estrela faturou pedidos para **${cnt} clientes (CNPJs distintos)**. A ativação constante da base demonstra ótima capilaridade no atendimento das rotas.`;
    }

    // Default / Geral
    const kpisResult = await this.pool.request().query(`
      SELECT
        COUNT(DISTINCT Pedido) AS totalPedidos,
        ISNULL(SUM(ValTotal), 0) AS faturamentoTotal
      FROM Pedido
      WHERE DT_Data >= DATEADD(DAY, -30, GETDATE())
        AND Situacao = ${SITUACAO_FATURADO}
        AND ValTotal > 0
    `);
    const tot = kpisResult.recordset[0];
    return `🤖 **Assistente Analítico Estrela BI**\n\nConsultei a base transacional do SQL Server em tempo real. Nos últimos 30 dias, registramos **R$ ${Number(tot.faturamentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** em ${tot.totalPedidos} pedidos faturados.\n\nVocê pode me perguntar especificamente sobre:\n- *"Quem foi o vendedor destaque?"*\n- *"Quais os produtos de maior faturamento?"*\n- *"Qual a receita acumulada no mês?"*`;
  }
}
