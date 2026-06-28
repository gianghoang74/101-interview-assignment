import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

export enum InvoiceSortBy {
  invoiceDate = 'invoiceDate',
  dueDate = 'dueDate',
  totalAmount = 'totalAmount',
}

export enum SortOrdering {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum InvoiceStatusFilter {
  Draft = 'Draft',
  Pending = 'Pending',
  Paid = 'Paid',
  Overdue = 'Overdue',
}

export class ListInvoicesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @ApiPropertyOptional({
    enum: InvoiceSortBy,
    default: InvoiceSortBy.invoiceDate,
  })
  @IsOptional()
  @IsEnum(InvoiceSortBy)
  sortBy: InvoiceSortBy = InvoiceSortBy.invoiceDate;

  @ApiPropertyOptional({ enum: SortOrdering, default: SortOrdering.DESC })
  @IsOptional()
  @IsEnum(SortOrdering)
  ordering: SortOrdering = SortOrdering.DESC;

  @ApiPropertyOptional({ enum: InvoiceStatusFilter })
  @IsOptional()
  @IsEnum(InvoiceStatusFilter)
  status?: InvoiceStatusFilter;

  @ApiPropertyOptional({
    description:
      'Partial, case-insensitive match on invoice number or customer name',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Invoice date on/after this calendar date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateOnly()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Invoice date on/before this calendar date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateOnly()
  toDate?: string;
}
