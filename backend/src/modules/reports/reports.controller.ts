import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reports Export')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('consolidado-faturamento')
  @ApiOperation({ summary: 'Get daily sales consolidation for export' })
  async getConsolidado(
    @Query('dias') dias?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const days = dias ? parseInt(dias, 10) : 30;
    const data = await this.reportsService.getConsolidadoFaturamento(
      days,
      startDate,
      endDate,
    );
    return data;
  }

  @Get('giro-estoque')
  @ApiOperation({ summary: 'Get top products inventory turnover for export' })
  async getGiro(
    @Query('dias') dias?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const days = dias ? parseInt(dias, 10) : 30;
    const data = await this.reportsService.getGiroEstoque(
      days,
      startDate,
      endDate,
    );
    return data;
  }

  @Get('desempenho-equipe')
  @ApiOperation({ summary: 'Get sales team performance for export' })
  async getEquipe(
    @Query('dias') dias?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const days = dias ? parseInt(dias, 10) : 30;
    const data = await this.reportsService.getDesempenhoEquipe(
      days,
      startDate,
      endDate,
    );
    return data;
  }

  @Get('carteira-clientes')
  @ApiOperation({ summary: 'Get active customers portfolio for export' })
  async getClientes(
    @Query('dias') dias?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const days = dias ? parseInt(dias, 10) : 30;
    const data = await this.reportsService.getCarteiraClientes(
      days,
      startDate,
      endDate,
    );
    return data;
  }

  @Get('faturamento-cnpj')
  @ApiOperation({ summary: 'Get monthly sales consolidation per CNPJ/Deposit' })
  async getFaturamentoCnpj() {
    return this.reportsService.getFaturamentoCnpj();
  }

  @Post('faturamento-cnpj/limite')
  @ApiOperation({ summary: 'Update monthly sales cap for a specific CNPJ' })
  async updateLimiteCnpj(@Body() body: { deposito: number; limite: number }) {
    return this.reportsService.saveCnpjLimit(body.deposito, body.limite);
  }

  @Get('faturamento-historico')
  @ApiOperation({ summary: 'Get historical monthly sales per CNPJ/Deposit' })
  async getFaturamentoHistorico(@Query('period') period?: string) {
    return this.reportsService.getFaturamentoHistorico(period);
  }
}
