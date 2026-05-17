import { Module, Global, HttpException, HttpStatus } from '@nestjs/common';
import * as sql from 'mssql';
import * as dotenv from 'dotenv';
dotenv.config();
import { DatabaseDiscoveryService } from './database-discovery.service';
import { DatabaseDiscoveryController } from './database-discovery.controller';

export const getSqlConfig = (): sql.config => ({
  user: process.env.DB_USER || 'bi_user',
  password: process.env.DB_PASSWORD || 'Marcu$2603',
  server: process.env.DB_SERVER || '100.76.189.43',
  database: process.env.DB_NAME || 'DistribuidoraEstrela',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 5000,
    requestTimeout: 15000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
});

const databaseProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async () => {
    const config = getSqlConfig();
    let retries = 2;
    while (retries > 0) {
      try {
        console.log(
          `⏳ Tentando conectar ao SQL Server real em ${config.server}:${config.port}...`,
        );
        const pool = await sql.connect(config);
        console.log('✅ Successfully connected to SQL Server (Dados Reais)');
        return pool;
      } catch (err) {
        retries--;
        console.error(
          `❌ Falha na conexão com SQL Server. Tentativas restantes: ${retries}`,
          (err as Error).message,
        );
        if (retries === 0) {
          console.warn(
            '⚠️ Banco SQL Server inalcançável. Iniciando backend em modo de proteção. Requer conexão com a VPN/Rede.',
          );
          return {
            request: () => {
              const req = {
                input: function (): unknown {
                  return req;
                },
                query: () => {
                  return Promise.reject(
                    new HttpException(
                      `Banco de dados SQL Server real (${config.server}:${config.port}) está inacessível. Verifique sua conexão com a VPN ou rede local da Distribuidora Estrela.`,
                      HttpStatus.SERVICE_UNAVAILABLE,
                    ),
                  );
                },
              };
              return req;
            },
          };
        }
        await new Promise((r) => setTimeout(r, 2000));
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
