import { Roles } from '../../common/decorators/roles.decorator';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CustomerDetailsQueryDto,
  CustomersQueryDto,
} from '../../common/dto/analytics-query.dto';

@ApiTags('Customers')
@Roles('ADMIN', 'DIRETORIA', 'GERENTE', 'VENDEDOR')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Obter a lista de Top Clientes' })
  async getTopCustomers(@Query() query: CustomersQueryDto) {
    return this.customersService.getTopCustomers(
      query.dias,
      query.search,
      query.sortBy,
      query.sortOrder,
    );
  }

  @Get('orders/:id')
  @ApiOperation({
    summary: 'Obter o cabeçalho e os itens de um pedido específico',
  })
  async getOrderDetails(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.getOrderDetails(id);
  }

  @Get(':cgc')
  @ApiOperation({
    summary:
      'Obter os detalhes completos de um cliente (Ficha, Pedidos e Produtos)',
  })
  async getCustomerDetails(
    @Param('cgc') cgc: string,
    @Query() query: CustomerDetailsQueryDto,
  ) {
    return this.customersService.getCustomerDetails(cgc, query.dias);
  }
}
