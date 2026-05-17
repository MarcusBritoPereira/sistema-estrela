import { Module, Global } from '@nestjs/common';
import * as sql from 'mssql';
import { DatabaseDiscoveryService } from './database-discovery.service';
import { DatabaseDiscoveryController } from './database-discovery.controller';

export const sqlConfig: sql.config = {
  user: process.env.DB_USER || 'bi_user',
  password: process.env.DB_PASSWORD || 'Marcu$2603',
  server: process.env.DB_SERVER || '192.168.3.64',
  database: process.env.DB_NAME || 'DistribuidoraEstrela',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 5000,
    requestTimeout: 10000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const mockPool = {
  request: () => {
    const req = {
      input: () => req,
      query: async (sqlStr: string) => {
        const s = sqlStr.toLowerCase();
        if (s.includes('from information_schema.tables')) {
          return {
            recordset: [
              { schema: 'dbo', tableName: 'Pedido' },
              { schema: 'dbo', tableName: 'Itens' },
              { schema: 'dbo', tableName: 'Produto' },
              { schema: 'dbo', tableName: 'Familia' },
            ],
          };
        }
        if (s.includes('from information_schema.columns')) {
          return {
            recordset: [
              { columnName: 'Pedido', dataType: 'int', isNullable: 'NO', maxLength: null },
              { columnName: 'DT_Data', dataType: 'datetime', isNullable: 'YES', maxLength: null },
              { columnName: 'ValTotal', dataType: 'float', isNullable: 'YES', maxLength: null },
              { columnName: 'Situacao', dataType: 'varchar', isNullable: 'YES', maxLength: 10 },
            ],
          };
        }
        if (s.includes('group by cast(dt_data as date)')) {
          return {
            recordset: [
              { data: '2026-05-10', qtdPedidos: 12, faturamento: 45200.5, ticketMedio: 3766.7 },
              { data: '2026-05-11', qtdPedidos: 15, faturamento: 52100.0, ticketMedio: 3473.3 },
              { data: '2026-05-12', qtdPedidos: 18, faturamento: 61400.2, ticketMedio: 3411.1 },
              { data: '2026-05-13', qtdPedidos: 14, faturamento: 49800.0, ticketMedio: 3557.1 },
              { data: '2026-05-14', qtdPedidos: 20, faturamento: 71200.0, ticketMedio: 3560.0 },
              { data: '2026-05-15', qtdPedidos: 22, faturamento: 84500.0, ticketMedio: 3840.9 },
              { data: '2026-05-16', qtdPedidos: 19, faturamento: 65300.0, ticketMedio: 3436.8 },
            ],
          };
        }
        if (s.includes('group by year(dt_data), month(dt_data)')) {
          return {
            recordset: [
              { ano: 2025, mes: 12, label: 'Dez/25', qtdPedidos: 380, faturamento: 1150000.0, lucro: 310000.0 },
              { ano: 2026, mes: 1, label: 'Jan/26', qtdPedidos: 410, faturamento: 1210000.0, lucro: 325000.0 },
              { ano: 2026, mes: 2, label: 'Fev/26', qtdPedidos: 390, faturamento: 1180000.0, lucro: 318000.0 },
              { ano: 2026, mes: 3, label: 'Mar/26', qtdPedidos: 450, faturamento: 1350000.0, lucro: 360000.0 },
              { ano: 2026, mes: 4, label: 'Abr/26', qtdPedidos: 420, faturamento: 1280000.0, lucro: 340000.0 },
              { ano: 2026, mes: 5, label: 'Mai/26', qtdPedidos: 280, faturamento: 890000.0, lucro: 245000.0 },
            ],
          };
        }
        if (s.includes('usucad') || s.includes('rankingvendedores') || s.includes('desempenhoequipe')) {
          return {
            recordset: [
              { nomeVendedor: 'Carlos Silva', nome: 'Carlos Silva', qtdPedidos: 85, faturamento: 245000.0, ticketMedio: 2882.3, lucro: 73500.0 },
              { nomeVendedor: 'Ana Souza', nome: 'Ana Souza', qtdPedidos: 92, faturamento: 238000.0, ticketMedio: 2586.9, lucro: 71400.0 },
              { nomeVendedor: 'Roberto Alves', nome: 'Roberto Alves', qtdPedidos: 74, faturamento: 198000.0, ticketMedio: 2675.6, lucro: 59400.0 },
              { nomeVendedor: 'Mariana Costa', nome: 'Mariana Costa', qtdPedidos: 81, faturamento: 185000.0, ticketMedio: 2283.9, lucro: 55500.0 },
              { nomeVendedor: 'Fernando Lima', nome: 'Fernando Lima', qtdPedidos: 65, faturamento: 162000.0, ticketMedio: 2492.3, lucro: 48600.0 },
            ],
          };
        }
        if (s.includes('produtosmaisvendidos') || s.includes('giroestoque') || s.includes('itens')) {
          return {
            recordset: [
              { codProduto: '789101', nomeProduto: 'Bebida Energética 250ml lata', nome: 'Bebida Energética 250ml lata', familia: 'Bebidas', qtdVendida: 4500, qtd: 4500, faturamento: 31500.0, precoMedio: 7.0 },
              { codProduto: '789102', nomeProduto: 'Refrigerante Cola 2L pet', nome: 'Refrigerante Cola 2L pet', familia: 'Bebidas', qtdVendida: 3800, qtd: 3800, faturamento: 26600.0, precoMedio: 7.0 },
              { codProduto: '789103', nomeProduto: 'Biscoito Recheado Chocolate 140g', nome: 'Biscoito Recheado Chocolate 140g', familia: 'Alimentos', qtdVendida: 3200, qtd: 3200, faturamento: 11200.0, precoMedio: 3.5 },
              { codProduto: '789104', nomeProduto: 'Suco Natural Uva 1L caixa', nome: 'Suco Natural Uva 1L caixa', familia: 'Bebidas', qtdVendida: 2900, qtd: 2900, faturamento: 20300.0, precoMedio: 7.0 },
              { codProduto: '789105', nomeProduto: 'Leite Condensado Tradicional 395g', nome: 'Leite Condensado Tradicional 395g', familia: 'Alimentos', qtdVendida: 2500, qtd: 2500, faturamento: 15000.0, precoMedio: 6.0 },
            ],
          };
        }
        if (s.includes('cgccpf') || s.includes('carteiraclientes')) {
          return {
            recordset: [
              { totalClientes: 385, documentoCliente: '12.345.678/0001-90 - Supermercado Central', qtdPedidos: 18, faturamentoTotal: 84500.0, dataUltimaCompra: '2026-05-16' },
              { totalClientes: 385, documentoCliente: '98.765.432/0001-10 - Padaria Pão Quente', qtdPedidos: 14, faturamentoTotal: 45200.0, dataUltimaCompra: '2026-05-15' },
              { totalClientes: 385, documentoCliente: '45.678.901/0001-23 - Mercadinho da Esquina', qtdPedidos: 12, faturamentoTotal: 38100.0, dataUltimaCompra: '2026-05-16' },
              { totalClientes: 385, documentoCliente: '33.222.111/0001-55 - Minimercado Bom Preço', qtdPedidos: 10, faturamentoTotal: 29400.0, dataUltimaCompra: '2026-05-14' },
            ],
          };
        }
        return {
          recordset: [
            {
              faturamentoTotal: 1284500.0,
              totalPedidos: 1450,
              ticketMedio: 885.86,
              lucroTotal: 385350.0,
              faturamentoHoje: 45200.0,
              pedidosHoje: 52,
              totalClientes: 385,
              faturamentoMes: 350400.0,
              pedidosMes: 410,
              faturamentoMesAnterior: 310200.0,
              crescimentoMensal: '12.9',
              semanaAtual: 85000,
              semanaAnterior: 78000,
              mesAtual: 350400,
              mesAnterior: 310200,
              totalPedidosMes: 410,
              nome: 'Carlos Silva',
              faturamento: 245000.0,
              qtdPedidos: 85,
              qtd: 4500,
            },
          ],
        };
      },
    };
    return req;
  },
};

const databaseProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async () => {
    let retries = 1;
    while (retries > 0) {
      try {
        const pool = await sql.connect(sqlConfig);
        console.log('✅ Successfully connected to SQL Server');
        return pool;
      } catch (err) {
        retries--;
        console.error(`❌ DB connection failed: ${(err as Error).message}`);
        if (retries === 0) {
          console.warn('⚠️ SQL Server is unreachable. Starting backend in offline/mock mode.');
          return mockPool;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  },
};

@Global()
@Module({
  controllers: [DatabaseDiscoveryController],
  providers: [databaseProvider, DatabaseDiscoveryService],
  exports: [databaseProvider, DatabaseDiscoveryService],
})
export class DatabaseModule {}
