import { Module, Global, HttpException, HttpStatus } from '@nestjs/common';
import * as sql from 'mssql';
import * as dotenv from 'dotenv';
dotenv.config();
import { DatabaseDiscoveryService } from './database-discovery.service';
import { DatabaseDiscoveryController } from './database-discovery.controller';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const getSqlConfig = (): sql.config => ({
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASSWORD'),
  server: getRequiredEnv('DB_SERVER'),
  database: getRequiredEnv('DB_NAME'),
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

function createMockPool(config: sql.config) {
  console.warn(
    '⚠️ Modo de Proteção / Contingência Instantâneo Ativado. O SQL Server real está inacessível ou FORCE_MOCK=true.',
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
              `Banco de dados SQL Server real (${config.server}:${config.port}) está inacessível. O sistema está operando no modo de contingência instantâneo com dados espelhados.`,
              HttpStatus.SERVICE_UNAVAILABLE,
            ),
          );
        },
      };
      return req;
    },
  } as unknown as sql.ConnectionPool;
}

const databaseProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async () => {
    const config = getSqlConfig();
    if (process.env.FORCE_MOCK === 'true') {
      console.log(
        '⚠️ FORCE_MOCK ativado. Iniciando pool de conexão simulado em modo contingência instantâneo.',
      );
      return createMockPool(config);
    }
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
          return createMockPool(config);
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
