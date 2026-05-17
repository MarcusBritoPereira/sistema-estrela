import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get main KPIs for dashboard' })
  @ApiQuery({
    name: 'periodo',
    required: false,
    description: 'Days period (default: 30)',
  })
  async getKpis(@Query('periodo') periodo = '30') {
    return this.dashboardService.getKpis(periodo);
  }

  @Get('vendas-dia')
  @ApiOperation({ summary: 'Get daily sales chart data' })
  @ApiQuery({ name: 'dias', required: false })
  async getVendasPorDia(@Query('dias') dias = '30') {
    return this.dashboardService.getVendasPorDia(parseInt(dias, 10));
  }

  @Get('vendas-mes')
  @ApiOperation({ summary: 'Get monthly sales chart data' })
  @ApiQuery({ name: 'meses', required: false })
  async getVendasPorMes(@Query('meses') meses = '12') {
    return this.dashboardService.getVendasPorMes(parseInt(meses, 10));
  }

  @Get('ranking-vendedores')
  @ApiOperation({ summary: 'Get vendor ranking' })
  @ApiQuery({ name: 'periodo', required: false })
  async getRankingVendedores(@Query('periodo') periodo = '30') {
    return this.dashboardService.getRankingVendedores(parseInt(periodo, 10));
  }

  @Get('produtos-mais-vendidos')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'periodo', required: false })
  @ApiQuery({ name: 'top', required: false })
  async getProdutosMaisVendidos(
    @Query('periodo') periodo = '30',
    @Query('top') top = '10',
  ) {
    return this.dashboardService.getProdutosMaisVendidos(
      parseInt(periodo, 10),
      parseInt(top, 10),
    );
  }

  @Get('produtos-menos-vendidos')
  @ApiOperation({ summary: 'Get bottom selling products' })
  @ApiQuery({ name: 'periodo', required: false })
  @ApiQuery({ name: 'top', required: false })
  async getProdutosMenosVendidos(
    @Query('periodo') periodo = '30',
    @Query('top') top = '10',
  ) {
    return this.dashboardService.getProdutosMenosVendidos(
      parseInt(periodo, 10),
      parseInt(top, 10),
    );
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get automatic AI-driven insights from real data' })
  async getInsights() {
    return this.dashboardService.getInsightsAutomaticos();
  }

  @Get('executive-overview')
  @ApiOperation({ summary: 'Get five-pillar executive intelligence overview' })
  @ApiQuery({ name: 'periodo', required: false })
  async getExecutiveOverview(@Query('periodo') periodo = '30') {
    return this.dashboardService.getExecutiveOverview(parseInt(periodo, 10));
  }

  @Get('executive-alerts')
  @ApiOperation({
    summary: 'Get automatic operational, commercial and strategic alerts',
  })
  async getExecutiveAlerts() {
    return this.dashboardService.getExecutiveAlerts();
  }
}
