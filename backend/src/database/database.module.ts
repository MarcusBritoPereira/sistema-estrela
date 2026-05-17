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
    connectTimeout: 10000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const databaseProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`⏳ Tentando conectar ao SQL Server real em ${sqlConfig.server}:${sqlConfig.port}...`);
        const pool = await sql.connect(sqlConfig);
        console.log('✅ Successfully connected to SQL Server (Dados Reais)');
        return pool;
      } catch (err) {
        retries--;
        console.error(`❌ Falha na conexão com SQL Server. Tentativas restantes: ${retries}`, (err as Error).message);
        if (retries === 0) {
          throw new Error(`CRITICAL: Não foi possível conectar ao banco SQL Server da Distribuidora Estrela (${sqlConfig.server}:${sqlConfig.port}). O sistema está configurado para requerer acesso a dados reais e não aceita dados mockados.`);
        }
        await new Promise((r) => setTimeout(r, 3000));
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
