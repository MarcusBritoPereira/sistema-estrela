import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import * as sql from 'mssql';

const SITUACAO_FATURADO = 2;

@Injectable()
export class CustomersService {
  constructor(
    @Inject('DATABASE_CONNECTION') private pool: sql.ConnectionPool,
  ) {}

  private toNumber(val: unknown): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return 0;
  }

  async getTopCustomers(
    dias: number = 30,
    search?: string,
    sortBy: string = 'faturamento',
    sortOrder: string = 'DESC',
  ) {
    const validSortColumns: Record<string, string> = {
      faturamento: 'faturamento',
      pedidos: 'qtdPedidos',
      ultimaCompra: 'ultimaCompra',
      nome: 'nomeCliente',
    };
    const sortCol = validSortColumns[sortBy] || 'faturamento';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const req = this.pool.request();
    req.input('dias', sql.Int, dias);

    let searchWhere = '';
    if (search && search.trim() !== '') {
      req.input('search', sql.VarChar, `%${search.trim()}%`);
      searchWhere = `AND (c.NOME LIKE @search OR c.FANTASIA LIKE @search OR CAST(p.CGCCPF AS VARCHAR) LIKE @search)`;
    }

    const query = `
      SELECT TOP 100
        CAST(p.CGCCPF AS VARCHAR) AS cgc,
        ISNULL(NULLIF(MAX(c.NOME), ''), ISNULL(CAST(p.CGCCPF AS VARCHAR), 'BALCÃO / CONSUMIDOR FINAL')) AS nomeCliente,
        ISNULL(MAX(c.FANTASIA), '') AS nomeFantasia,
        ISNULL(MAX(c.CIDADE), '') AS cidade,
        ISNULL(MAX(c.ESTADO), '') AS estado,
        COUNT(DISTINCT p.Pedido) AS qtdPedidos,
        ISNULL(SUM(p.ValTotal), 0) AS faturamento,
        MAX(p.DT_Data) AS ultimaCompra
      FROM Pedido p
      LEFT JOIN cadcli c ON c.CGC2 = p.CGCCPF
      WHERE p.DT_Data >= DATEADD(DAY, -@dias, GETDATE())
        AND p.Situacao = ${SITUACAO_FATURADO}
        AND p.ValTotal > 0
        ${searchWhere}
      GROUP BY p.CGCCPF
      ORDER BY ${sortCol} ${orderDir}
    `;

    try {
      const result = await req.query(query);
      return result.recordset.map((item) => {
        const fat = this.toNumber(item.faturamento);
        const qtd = this.toNumber(item.qtdPedidos);
        const ticket = qtd > 0 ? fat / qtd : 0;
        
        // Calcular risco simples com base na última compra
        let status = 'Ativo';
        const diasSemComprar = item.ultimaCompra 
          ? Math.floor((Date.now() - new Date(item.ultimaCompra).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (diasSemComprar > 60) status = 'Inativo';
        else if (diasSemComprar > 30) status = 'Em Risco';

        return {
          cgc: item.cgc,
          nomeCliente: item.nomeCliente,
          nomeFantasia: item.nomeFantasia,
          cidade: item.cidade,
          estado: item.estado,
          qtdPedidos: qtd,
          faturamento: fat,
          ticketMedio: ticket,
          ultimaCompra: item.ultimaCompra,
          status,
          diasSemComprar,
        };
      });
    } catch (err) {
      console.error('Erro ao buscar top customers:', err);
      throw new HttpException('Erro ao consultar clientes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCustomerDetails(cgc: string, dias: number = 120) {
    const req = this.pool.request();
    req.input('cgc', sql.VarChar, cgc);
    req.input('dias', sql.Int, dias);

    try {
      // 1. Dados Cadastrais
      const cadQuery = `
        SELECT TOP 1
          ID_CAD AS idCad,
          CAST(CGC2 AS VARCHAR) AS cgc,
          ISNULL(NOME, '') AS nomeCliente,
          ISNULL(FANTASIA, '') AS nomeFantasia,
          ISNULL(ENDERECO, '') AS endereco,
          ISNULL(Numero, '') AS numero,
          ISNULL(BAIRRO, '') AS bairro,
          ISNULL(CIDADE, '') AS cidade,
          ISNULL(ESTADO, '') AS estado,
          ISNULL(TELEFONE, '') AS telefone,
          ISNULL(CondPag, '') AS condPag,
          ISNULL(PRAZO, '') AS prazo
        FROM cadcli
        WHERE CAST(CGC2 AS VARCHAR) = @cgc
      `;
      const cadRes = await req.query(cadQuery);
      let cadastro = cadRes.recordset[0];
      if (!cadastro) {
        cadastro = {
          cgc,
          nomeCliente: cgc === '0' || cgc === 'BALCÃO' ? 'BALCÃO / CONSUMIDOR FINAL' : `Cliente ${cgc}`,
          nomeFantasia: '',
          endereco: '--',
          numero: '',
          bairro: '--',
          cidade: '--',
          estado: '--',
          telefone: '--',
          condPag: '--',
          prazo: '--',
        };
      }

      // 2. KPIs e Resumo Comercial Global (Geral ou últimos dias)
      const kpiQuery = `
        SELECT
          COUNT(DISTINCT Pedido) AS qtdPedidos,
          ISNULL(SUM(ValTotal), 0) AS faturamentoTotal,
          MAX(DT_Data) AS ultimaCompra,
          DATEDIFF(DAY, MAX(DT_Data), GETDATE()) AS diasSemComprar
        FROM Pedido
        WHERE CAST(CGCCPF AS VARCHAR) = @cgc
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
      `;
      const kpiRes = await req.query(kpiQuery);
      const kpiData = kpiRes.recordset[0] || { qtdPedidos: 0, faturamentoTotal: 0, ultimaCompra: null, diasSemComprar: 999 };

      const fatTotal = this.toNumber(kpiData.faturamentoTotal);
      const qtdTotal = this.toNumber(kpiData.qtdPedidos);
      const ticketMedio = qtdTotal > 0 ? fatTotal / qtdTotal : 0;
      let status = 'Ativo';
      const diasSem = kpiData.diasSemComprar ?? 999;
      if (diasSem > 90) status = 'Inativo';
      else if (diasSem > 45) status = 'Em Risco';

      // 3. Últimos 20 Pedidos
      const pedidosQuery = `
        SELECT TOP 20
          Pedido AS pedido,
          DT_Data AS data,
          ValTotal AS valorTotal,
          ISNULL(UsuCad, 'SISTEMA') AS vendedor
        FROM Pedido
        WHERE CAST(CGCCPF AS VARCHAR) = @cgc
          AND Situacao = ${SITUACAO_FATURADO}
          AND ValTotal > 0
        ORDER BY DT_Data DESC
      `;
      const pedidosRes = await req.query(pedidosQuery);
      const pedidos = pedidosRes.recordset.map((p) => ({
        pedido: p.pedido,
        data: p.data,
        valorTotal: this.toNumber(p.valorTotal),
        vendedor: p.vendedor,
      }));

      // 4. Top 15 Produtos Mais Comprados pelo Cliente
      const produtosQuery = `
        SELECT TOP 15
          i.CodRed AS codProduto,
          ISNULL(MAX(pr.Descricao), CAST(i.CodRed AS VARCHAR)) AS nomeProduto,
          SUM(i.Quantidade) AS quantidade,
          SUM(i.ValorNegTot) AS valorTotal
        FROM Itens i
        INNER JOIN Pedido p ON p.Pedido = i.Pedido
        LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
        WHERE CAST(p.CGCCPF AS VARCHAR) = @cgc
          AND p.Situacao = ${SITUACAO_FATURADO}
          AND p.ValTotal > 0
        GROUP BY i.CodRed
        ORDER BY valorTotal DESC
      `;
      const produtosRes = await req.query(produtosQuery);
      const topProdutos = produtosRes.recordset.map((item) => ({
        codProduto: item.codProduto,
        nomeProduto: item.nomeProduto,
        quantidade: this.toNumber(item.quantidade),
        valorTotal: this.toNumber(item.valorTotal),
        precoMedio: this.toNumber(item.quantidade) > 0 ? this.toNumber(item.valorTotal) / this.toNumber(item.quantidade) : 0,
      }));

      return {
        cadastro,
        kpis: {
          faturamentoTotal: fatTotal,
          qtdPedidos: qtdTotal,
          ticketMedio,
          ultimaCompra: kpiData.ultimaCompra,
          diasSemComprar: diasSem,
          status,
        },
        pedidos,
        topProdutos,
      };
    } catch (err) {
      console.error(`Erro ao buscar detalhes do cliente ${cgc}:`, err);
      throw new HttpException('Erro ao consultar detalhes do cliente', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getOrderDetails(pedidoId: number) {
    const req = this.pool.request();
    req.input('pedidoId', sql.Int, pedidoId);

    try {
      // 1. Cabeçalho do Pedido
      const pedidoQuery = `
        SELECT TOP 1
          p.Pedido AS pedido,
          p.DT_Data AS data,
          p.Situacao AS situacao,
          p.ValTotal AS valorTotal,
          ISNULL(p.UsuCad, 'SISTEMA') AS vendedor,
          CAST(p.CGCCPF AS VARCHAR) AS cgc,
          ISNULL(c.NOME, CAST(p.CGCCPF AS VARCHAR)) AS nomeCliente,
          ISNULL(c.CondPag, 'À VISTA') AS condPag,
          ISNULL(c.PRAZO, '0') AS prazo
        FROM Pedido p
        LEFT JOIN cadcli c ON c.CGC2 = p.CGCCPF
        WHERE p.Pedido = @pedidoId
      `;
      const pedidoRes = await req.query(pedidoQuery);
      const pedido = pedidoRes.recordset[0];

      if (!pedido) {
        throw new HttpException(`Pedido #${pedidoId} não encontrado.`, HttpStatus.NOT_FOUND);
      }

      // 2. Itens do Pedido
      const itensQuery = `
        SELECT
          ROW_NUMBER() OVER(ORDER BY i.ValorNegTot DESC) AS item,
          i.CodRed AS codProduto,
          ISNULL(pr.Descricao, CAST(i.CodRed AS VARCHAR)) AS nomeProduto,
          ISNULL(f.Descricao, 'Geral') AS familia,
          i.Quantidade AS quantidade,
          i.ValorNegUni AS precoUnitario,
          i.ValorNegTot AS valorTotal
        FROM Itens i
        LEFT JOIN Produto pr ON pr.CodSim = i.CodRed
        LEFT JOIN Familia f ON f.Codigo = pr.Familia
        WHERE i.Pedido = @pedidoId
        ORDER BY valorTotal DESC
      `;
      const itensRes = await req.query(itensQuery);
      const itens = itensRes.recordset.map((item) => ({
        item: Number(item.item),
        codProduto: item.codProduto,
        nomeProduto: item.nomeProduto,
        familia: item.familia,
        quantidade: this.toNumber(item.quantidade),
        precoUnitario: this.toNumber(item.precoUnitario),
        valorTotal: this.toNumber(item.valorTotal),
      }));

      return {
        pedido: {
          ...pedido,
          valorTotal: this.toNumber(pedido.valorTotal),
        },
        itens,
      };
    } catch (err) {
      console.error(`Erro ao buscar pedido completo #${pedidoId}:`, err);
      if (err instanceof HttpException) throw err;
      throw new HttpException('Erro ao consultar detalhes do pedido', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

