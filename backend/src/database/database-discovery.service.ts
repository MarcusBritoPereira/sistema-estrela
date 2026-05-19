/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Injectable, Inject } from '@nestjs/common';
import * as sql from 'mssql';
import { assertSqlIdentifier, clampInteger } from '../common/sql/sql-safety';

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
  constructor(
    @Inject('DATABASE_CONNECTION') private pool: sql.ConnectionPool,
  ) {}

  async discoverTables(): Promise<TableInfo[]> {
    try {
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
        const schema = assertSqlIdentifier(row.schema, 'Schema');
        const tableName = assertSqlIdentifier(row.tableName, 'Tabela');
        const columns = await this.getColumns(tableName, schema);
        let rowCount = 0;
        try {
          const countRes = await this.pool
            .request()
            .query(`SELECT COUNT(1) AS cnt FROM [${schema}].[${tableName}]`);
          rowCount = countRes.recordset[0].cnt;
        } catch {
          rowCount = -1;
        }

        tables.push({ tableName, schema, rowCount, columns });
      }

      return tables;
    } catch (err) {
      console.warn('[Contingência] Banco offline em discoverTables:', err);
      return [];
    }
  }

  async getColumns(tableName: string, schema = 'dbo'): Promise<ColumnInfo[]> {
    try {
      const safeTable = assertSqlIdentifier(tableName, 'Tabela');
      const safeSchema = assertSqlIdentifier(schema, 'Schema');
      const result = await this.pool
        .request()
        .input('tableName', sql.NVarChar, safeTable)
        .input('schema', sql.NVarChar, safeSchema).query(`
        SELECT 
          COLUMN_NAME as columnName,
          DATA_TYPE as dataType,
          IS_NULLABLE as isNullable,
          CHARACTER_MAXIMUM_LENGTH as maxLength
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tableName
          AND TABLE_SCHEMA = @schema
        ORDER BY ORDINAL_POSITION
      `);

      return result.recordset.map((col) => ({
        columnName: col.columnName,
        dataType: col.dataType,
        isNullable: col.isNullable === 'YES',
        maxLength: col.maxLength,
      }));
    } catch (err) {
      console.warn('[Contingência] Banco offline em getColumns:', err);
      return [];
    }
  }

  async previewTable(tableName: string, schema = 'dbo', top = 10) {
    try {
      const safeTable = assertSqlIdentifier(tableName, 'Tabela');
      const safeSchema = assertSqlIdentifier(schema, 'Schema');
      const safeTop = clampInteger(top, 1, 100);
      const result = await this.pool
        .request()
        .input('top', sql.Int, safeTop)
        .query(`SELECT TOP (@top) * FROM [${safeSchema}].[${safeTable}]`);
      return result.recordset;
    } catch (err) {
      console.warn('[Contingência] Banco offline em previewTable:', err);
      return [];
    }
  }
}
