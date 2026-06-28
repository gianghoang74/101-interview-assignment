import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsAfterOrEqual } from '../../common/validators/is-after-or-equal.validator';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';
import { SUPPORTED_CURRENCIES } from '../currencies';

// Bounds keep computed money within Decimal(14,2): quantity*rate plus tax must
// stay under 1e12. They surface oversized input as a clean 400 instead of a
// database overflow error.
const MAX_QUANTITY = 100_000;
const MAX_RATE = 1_000_000;
const MAX_TAX_PERCENT = 100;
const MAX_DISCOUNT = 100_000_000_000;

export class CustomerInput {
  @ApiProperty({ example: 'Paul' })
  @IsString()
  @IsNotEmpty()
  fullname!: string;

  @ApiProperty({ example: 'paul@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '947717364111' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({ example: 'Singapore' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class InvoiceItemInput {
  @ApiProperty({ example: 'Honda RC150' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  @Max(MAX_QUANTITY)
  quantity!: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsPositive()
  @Max(MAX_RATE)
  rate!: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ type: CustomerInput })
  @ValidateNested()
  @Type(() => CustomerInput)
  customer!: CustomerInput;

  @ApiProperty({ example: 'IV1780488206995' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @ApiPropertyOptional({ example: '#5721662' })
  @IsOptional()
  @IsString()
  invoiceReference?: string;

  @ApiProperty({
    example: '2026-06-03',
    description: 'Calendar date (YYYY-MM-DD)',
  })
  @IsDateOnly()
  invoiceDate!: string;

  @ApiProperty({
    example: '2026-07-03',
    description: 'Calendar date (YYYY-MM-DD); must be on or after invoiceDate',
  })
  @IsDateOnly()
  @IsAfterOrEqual('invoiceDate')
  dueDate!: string;

  @ApiProperty({ example: 'AUD', enum: SUPPORTED_CURRENCIES })
  @IsIn(SUPPORTED_CURRENCIES)
  currency!: string;

  @ApiPropertyOptional({ example: 'Invoice issued to Kanglee' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: InvoiceItemInput,
    description: 'Exactly one line item per invoice',
  })
  @ValidateNested()
  @Type(() => InvoiceItemInput)
  item!: InvoiceItemInput;

  @ApiPropertyOptional({
    example: 10,
    description: 'Tax percent; 0–100, defaults to 10',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_TAX_PERCENT)
  tax?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Discount amount; non-negative, defaults to 0',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_DISCOUNT)
  discount?: number;
}
