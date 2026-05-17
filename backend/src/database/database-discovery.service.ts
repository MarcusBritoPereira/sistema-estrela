import { Injectable, Inject } from '@nestjs/common';
import * as sql from 'mssql';

export interface TableInfo {
  tableName: string;
  schema: string;
  rowCount: number;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  maxLength: number | null;
}

@Injectable()
export class DatabaseDiscoveryService {
  constructor(@Inject('DATABASE_CONNECTION') private pool: sql.ConnectionPool) {}

  async discoverTables(): Promise<TableInfo[]> {
    const result = await this.pool.request().query(`
      SELECT 
        t.TABLE_SCHEMA as [schema],
        t.TABLE_NAME as tableName
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY t.TABLE_NAME
    `);

    const tables: TableInfo[] = [];

    for (const row of result.recordset) {
      const columns = await this.getColumns(row.tableName, row.schema);
      let rowCount = 0;
      try {
        const countRes = await this.pool
          .request()
          .query(`SELECT COUNT(1) AS cnt FROM [${row.schema}].[${row.tableName}]`);
        rowCount = countRes.recordset[0].cnt;
      } catch {
        rowCount = -1;
      }

      tables.push({
        tableName: row.tableName,
        schema: row.schema,
        rowCount,
        columns,
      });
    }

    return tables;
  }

  async getColumns(tableName: string, schema = 'dbo'): Promise<ColumnInfo[]> {
    const result = await this.pool.request().query(`
      SELECT 
        COLUMN_NAME as columnName,
        DATA_TYPE as dataType,
        IS_NULLABLE as isNullable,
        CHARACTER_MAXIMUM_LENGTH as maxLength
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
        AND TABLE_SCHEMA = '${schema}'
      ORDER BY ORDINAL_POSITION
    `);

    return result.recordset.map((col) => ({
      columnName: col.columnName,
      dataType: col.dataType,
      isNullable: col.isNullable === 'YES',
      maxLength: col.maxLength,
    }));
  }

  async previewTable(tableName: string, schema = 'dbo', top = 10) {
    const result = await this.pool
      .request()
      .query(`SELECT TOP ${top} * FROM [${schema}].[${tableName}]`);
    return result.recordset;
  }

  async runQuery(query: string) {
    const result = await this.pool.request().query(query);
    return result.recordset;
  }
}
