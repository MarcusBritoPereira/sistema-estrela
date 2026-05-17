import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Obter a lista de Top Clientes' })
  async getTopCustomers(
    @Query('dias') dias?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const d = dias && !isNaN(Number(dias)) ? parseInt(dias, 10) : 30;
    return this.customersService.getTopCustomers(d, search, sortBy || 'faturamento', sortOrder || 'DESC');
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Obter o cabeçalho e os itens de um pedido específico' })
  async getOrderDetails(@Param('id') id: string) {
    const pedidoId = parseInt(id, 10);
    return this.customersService.getOrderDetails(pedidoId);
  }

  @Get(':cgc')
  @ApiOperation({ summary: 'Obter os detalhes completos de um cliente (Ficha, Pedidos e Produtos)' })
  async getCustomerDetails(
    @Param('cgc') cgc: string,
    @Query('dias') dias?: string,
  ) {
    const d = dias && !isNaN(Number(dias)) ? parseInt(dias, 10) : 120;
    return this.customersService.getCustomerDetails(cgc, d);
  }
}
