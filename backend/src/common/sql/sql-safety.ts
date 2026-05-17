import { BadRequestException } from '@nestjs/common';

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function assertSqlIdentifier(value: string, label: string): string {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new BadRequestException(`${label} inválido.`);
  }
  return value;
}

export function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new BadRequestException(
      `Valor numérico fora do intervalo permitido (${min}-${max}).`,
    );
  }
  return value;
}
