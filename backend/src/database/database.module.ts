import { Module, Global, HttpException, HttpStatus } from '@nestjs/common';
import * as sql from 'mssql';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

dotenv.config();
import { DatabaseDiscoveryService } from './database-discovery.service';
import { DatabaseDiscoveryController } from './database-discovery.controller';

const CACHE_DIR = path.join(process.cwd(), 'database_cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCacheFilePath(key: string): string {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return path.join(CACHE_DIR, `${hash}.json`);
}

function saveToCache(key: string, data: any) {
  try {
    const filePath = getCacheFilePath(key);
    // Só salva no cache se o dado for real e tiver estrutura correta
    if (data && (data.recordset || data.recordsets)) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('⚠️ [Query Cache] Erro ao gravar cache da query:', err);
  }
}

function getFromCache(key: string): any | null {
  try {
    const filePath = getCacheFilePath(key);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('⚠️ [Query Cache] Erro ao ler cache da query:', err);
  }
  return null;
}

class WrappedRequest {
  private inputs: Array<{ name: string; type: any; value: any }> = [];

  constructor(private realRequest: any) {}

  input(name: string, type: any, value?: any) {
    if (value === undefined) {
      value = type;
      type = undefined;
    }
    this.inputs.push({ name, type, value });
    this.realRequest.input(name, type, value);
    return this;
  }

  async query(command: string) {
    const cacheKey = JSON.stringify({
      command,
      inputs: this.inputs.map(i => ({ name: i.name, value: i.value }))
    });

    try {
      const result = await this.realRequest.query(command);
      // Salva dados de produção válidos no cache
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      // Falha na conexão ou banco offline: tenta puxar o último cache de dados reais
      const cachedResult = getFromCache(cacheKey);
      if (cachedResult) {
        console.log('✅ [Query Cache] Banco offline/instável. Dados reais recuperados do cache local!');
        return cachedResult;
      }
      throw err;
    }
  }
}

class WrappedConnectionPool {
  constructor(private realPool: any) {}

  request() {
    const realRequest = this.realPool.request();
    return new WrappedRequest(realRequest);
  }

  async query(command: string) {
    const cacheKey = JSON.stringify({ command, inputs: [] });
    try {
      const result = await this.realPool.query(command);
      saveToCache(cacheKey, result);
      return result;
    } catch (err) {
      const cachedResult = getFromCache(cacheKey);
      if (cachedResult) {
        console.log('✅ [Query Cache] Banco offline/instável. Dados reais recuperados do cache local (Direct query)!');
        return cachedResult;
      }
      throw err;
    }
  }
}

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
    let pool: any;
    if (process.env.FORCE_MOCK === 'true') {
      console.log(
        '⚠️ FORCE_MOCK ativado. Iniciando pool de conexão simulado em modo contingência instantâneo.',
      );
      pool = createMockPool(config);
    } else {
      let retries = 2;
      let connected = false;
      while (retries > 0 && !connected) {
        try {
          console.log(
            `⏳ Tentando conectar ao SQL Server real em ${config.server}:${config.port}...`,
          );
          pool = await sql.connect(config);
          console.log('✅ Successfully connected to SQL Server (Dados Reais)');
          connected = true;
        } catch (err) {
          retries--;
          console.error(
            `❌ Falha na conexão com SQL Server. Tentativas restantes: ${retries}`,
            (err as Error).message,
          );
          if (retries === 0) {
            pool = createMockPool(config);
          } else {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }
    }
    return new WrappedConnectionPool(pool) as unknown as sql.ConnectionPool;
  },
};

@Global()
@Module({
  controllers: [DatabaseDiscoveryController],
  providers: [databaseProvider, DatabaseDiscoveryService],
  exports: [databaseProvider, DatabaseDiscoveryService],
})
export class DatabaseModule {}
