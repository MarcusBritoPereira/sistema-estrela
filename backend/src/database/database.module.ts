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
    connectTimeout: 30000,
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
        const pool = await sql.connect(sqlConfig);
        console.log('✅ Successfully connected to SQL Server');
        return pool;
      } catch (err) {
        retries--;
        console.error(`❌ DB connection failed. Retries left: ${retries}`, err);
        if (retries === 0) throw err;
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
