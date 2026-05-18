import { Roles } from '../../common/decorators/roles.decorator';
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import {
  DiasQueryDto,
  MesesQueryDto,
  PeriodoQueryDto,
  TopProductsQueryDto,
} from '../../common/dto/analytics-query.dto';

@ApiTags('Dashboard')
@Roles('ADMIN', 'DIRETORIA', 'GERENTE')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get main KPIs for dashboard' })
  @ApiQuery({ name: 'periodo', required: false, description: 'Days period' })
  async getKpis(@Query() query: PeriodoQueryDto) {
    return this.dashboardService.getKpis(query.periodo);
  }

  @Get('vendas-dia')
  @ApiOperation({ summary: 'Get daily sales chart data' })
  @ApiQuery({ name: 'dias', required: false })
  async getVendasPorDia(@Query() query: DiasQueryDto) {
    return this.dashboardService.getVendasPorDia(query.dias);
  }

  @Get('vendas-mes')
  @ApiOperation({ summary: 'Get monthly sales chart data' })
  @ApiQuery({ name: 'meses', required: false })
  async getVendasPorMes(@Query() query: MesesQueryDto) {
    return this.dashboardService.getVendasPorMes(query.meses);
  }

  @Get('ranking-vendedores')
  @ApiOperation({ summary: 'Get vendor ranking' })
  @ApiQuery({ name: 'periodo', required: false })
  async getRankingVendedores(@Query() query: PeriodoQueryDto) {
    return this.dashboardService.getRankingVendedores(query.periodo);
  }

  @Get('vendedores/:area')
  @ApiOperation({ summary: 'Get full vendor details including orders and products' })
  @ApiQuery({ name: 'periodo', required: false })
  async getVendorDetails(
    @Param('area') area: string,
    @Query() query: PeriodoQueryDto,
  ) {
    return this.dashboardService.getVendorDetails(area, query.periodo);
  }

  @Get('produtos-mais-vendidos')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'periodo', required: false })
  @ApiQuery({ name: 'top', required: false })
  async getProdutosMaisVendidos(@Query() query: TopProductsQueryDto) {
    return this.dashboardService.getProdutosMaisVendidos(
      query.periodo,
      query.top,
    );
  }

  @Get('produtos-menos-vendidos')
  @ApiOperation({ summary: 'Get bottom selling products' })
  @ApiQuery({ name: 'periodo', required: false })
  @ApiQuery({ name: 'top', required: false })
  async getProdutosMenosVendidos(@Query() query: TopProductsQueryDto) {
    return this.dashboardService.getProdutosMenosVendidos(
      query.periodo,
      query.top,
    );
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get automatic AI-driven insights from real data' })
  async getInsights() {
    return this.dashboardService.getInsightsAutomaticos();
  }

  @Get('daily-decision-cockpit')
  @ApiOperation({
    summary: 'Get daily executive cockpit with decision priorities',
  })
  async getDailyDecisionCockpit() {
    return this.dashboardService.getDailyDecisionCockpit();
  }

  @Get('executive-overview')
  @ApiOperation({ summary: 'Get five-pillar executive intelligence overview' })
  @ApiQuery({ name: 'periodo', required: false })
  async getExecutiveOverview(@Query() query: PeriodoQueryDto) {
    return this.dashboardService.getExecutiveOverview(query.periodo);
  }

  @Get('executive-alerts')
  @ApiOperation({
    summary: 'Get automatic operational, commercial and strategic alerts',
  })
  async getExecutiveAlerts() {
    return this.dashboardService.getExecutiveAlerts();
  }
}
