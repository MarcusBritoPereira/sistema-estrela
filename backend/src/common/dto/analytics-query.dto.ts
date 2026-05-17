import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class PeriodoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(730)
  periodo = 30;
}

export class DiasQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(730)
  dias = 30;
}

export class MesesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  meses = 12;
}

export class TopProductsQueryDto extends PeriodoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  top = 10;
}

export class ReportRangeQueryDto extends DiasQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}

export class CustomersQueryDto extends DiasQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['faturamento', 'pedidos', 'ultimaCompra', 'nome'])
  sortBy = 'faturamento';

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder = 'DESC';
}

export class CustomerDetailsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(730)
  dias = 120;
}

export class BillingLimitDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deposito: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  limite: number;
}

export class BillingHistoryQueryDto {
  @IsOptional()
  @IsIn(['6m', '12m', '2026', '2025', '2024', '2023'])
  period = '6m';
}
