import { Roles } from '../common/decorators/roles.decorator';
import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseDiscoveryService } from './database-discovery.service';

@ApiTags('Database Discovery')
@Roles('ADMIN')
@Controller('database')
export class DatabaseDiscoveryController {
  constructor(private readonly discoveryService: DatabaseDiscoveryService) {}

  private assertDiscoveryEnabled() {
    if (process.env.DATABASE_DISCOVERY_ENABLED !== 'true') {
      throw new ForbiddenException(
        'Database discovery endpoints are disabled. Set DATABASE_DISCOVERY_ENABLED=true only in controlled admin environments.',
      );
    }
  }

  @Get('tables')
  @ApiOperation({ summary: 'List all tables from SQL Server' })
  async listTables() {
    this.assertDiscoveryEnabled();
    return this.discoveryService.discoverTables();
  }

  @Get('tables/:name/preview')
  @ApiOperation({ summary: 'Preview rows from a specific table' })
  async previewTable(
    @Param('name') name: string,
    @Query('schema') schema = 'dbo',
    @Query('top') top = '10',
  ) {
    this.assertDiscoveryEnabled();
    return this.discoveryService.previewTable(name, schema, parseInt(top, 10));
  }

  @Get('tables/:name/columns')
  @ApiOperation({ summary: 'Get columns of a specific table' })
  async getColumns(
    @Param('name') name: string,
    @Query('schema') schema = 'dbo',
  ) {
    this.assertDiscoveryEnabled();
    return this.discoveryService.getColumns(name, schema);
  }
}
