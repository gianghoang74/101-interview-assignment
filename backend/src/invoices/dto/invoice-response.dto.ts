import { ApiProperty } from '@nestjs/swagger';

export class InvoiceItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Honda RC150' })
  name!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 1000 })
  rate!: number;
}

export class CustomerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Paul' })
  fullname!: string;

  @ApiProperty({ example: 'paul@example.com' })
  email!: string;

  @ApiProperty({ nullable: true, example: '947717364111' })
  mobileNumber!: string | null;

  @ApiProperty({ nullable: true, example: 'Singapore' })
  address!: string | null;
}

export class InvoiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  invoiceId!: string;

  @ApiProperty({ example: 'IV1780488206995' })
  invoiceNumber!: string;

  @ApiProperty({ nullable: true, example: '#5721662' })
  invoiceReference!: string | null;

  @ApiProperty({ example: '2026-06-03' })
  invoiceDate!: string;

  @ApiProperty({ example: '2026-07-03' })
  dueDate!: string;

  @ApiProperty({ example: 'AUD' })
  currency!: string;

  @ApiProperty({ example: 'AU$' })
  currencySymbol!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({
    enum: ['Draft', 'Pending', 'Paid', 'Overdue'],
    example: 'Overdue',
  })
  status!: string;

  @ApiProperty({ example: 2000 })
  invoiceSubTotal!: number;

  @ApiProperty({ example: 200 })
  totalTax!: number;

  @ApiProperty({ example: 20 })
  totalDiscount!: number;

  @ApiProperty({ example: 2180 })
  totalAmount!: number;

  @ApiProperty({ example: 1451.34 })
  totalPaid!: number;

  @ApiProperty({ example: 728.66 })
  balanceAmount!: number;

  @ApiProperty({ type: CustomerResponseDto })
  customer!: CustomerResponseDto;

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  items!: InvoiceItemResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ format: 'uuid' })
  createdBy!: string;
}

export class PagingDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  pageSize!: number;

  @ApiProperty({ example: 100 })
  total!: number;
}

export class PaginatedInvoicesDto {
  @ApiProperty({ type: [InvoiceResponseDto] })
  data!: InvoiceResponseDto[];

  @ApiProperty({ type: PagingDto })
  paging!: PagingDto;
}
