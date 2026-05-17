import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  BillingHistoryQueryDto,
  BillingLimitDto,
  ReportRangeQueryDto,
} from '../../common/dto/analytics-query.dto';

@ApiTags('Reports Export')
@Roles('ADMIN', 'DIRETORIA', 'GERENTE', 'FINANCEIRO')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('consolidado-faturamento')
  @ApiOperation({ summary: 'Get daily sales consolidation for export' })
  async getConsolidado(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.getConsolidadoFaturamento(
      query.dias,
      query.startDate,
      query.endDate,
    );
  }

  @Get('giro-estoque')
  @ApiOperation({ summary: 'Get top products inventory turnover for export' })
  async getGiro(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.getGiroEstoque(
      query.dias,
      query.startDate,
      query.endDate,
    );
  }

  @Get('desempenho-equipe')
  @ApiOperation({ summary: 'Get sales team performance for export' })
  async getEquipe(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.getDesempenhoEquipe(
      query.dias,
      query.startDate,
      query.endDate,
    );
  }

  @Get('carteira-clientes')
  @ApiOperation({ summary: 'Get active customers portfolio for export' })
  async getClientes(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.getCarteiraClientes(
      query.dias,
      query.startDate,
      query.endDate,
    );
  }

  @Get('faturamento-cnpj')
  @ApiOperation({ summary: 'Get monthly sales consolidation per CNPJ/Deposit' })
  async getFaturamentoCnpj() {
    return this.reportsService.getFaturamentoCnpj();
  }

  @Roles('ADMIN', 'FINANCEIRO')
  @Post('faturamento-cnpj/limite')
  @ApiOperation({ summary: 'Update monthly sales cap for a specific CNPJ' })
  async updateLimiteCnpj(@Body() body: BillingLimitDto) {
    return this.reportsService.saveCnpjLimit(body.deposito, body.limite);
  }

  @Get('faturamento-historico')
  @ApiOperation({ summary: 'Get historical monthly sales per CNPJ/Deposit' })
  async getFaturamentoHistorico(@Query() query: BillingHistoryQueryDto) {
    return this.reportsService.getFaturamentoHistorico(query.period);
  }
}
