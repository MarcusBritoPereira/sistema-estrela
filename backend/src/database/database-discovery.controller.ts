import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseDiscoveryService } from './database-discovery.service';

@ApiTags('Database Discovery')
@Controller('database')
export class DatabaseDiscoveryController {
  constructor(private readonly discoveryService: DatabaseDiscoveryService) {}

  @Get('tables')
  @ApiOperation({ summary: 'List all tables from SQL Server' })
  async listTables() {
    return this.discoveryService.discoverTables();
  }

  @Get('tables/:name/preview')
  @ApiOperation({ summary: 'Preview rows from a specific table' })
  async previewTable(
    @Param('name') name: string,
    @Query('schema') schema = 'dbo',
    @Query('top') top = '10',
  ) {
    return this.discoveryService.previewTable(name, schema, parseInt(top, 10));
  }

  @Get('tables/:name/columns')
  @ApiOperation({ summary: 'Get columns of a specific table' })
  async getColumns(
    @Param('name') name: string,
    @Query('schema') schema = 'dbo',
  ) {
    return this.discoveryService.getColumns(name, schema);
  }
}
