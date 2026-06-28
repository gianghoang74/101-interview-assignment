import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import {
  InvoiceResponseDto,
  PaginatedInvoicesDto,
} from './dto/invoice-response.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices.query';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new invoice (status Draft, totals computed server-side)',
  })
  @ApiCreatedResponse({ type: InvoiceResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Invoice number already exists' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.invoices.create(dto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List invoices with search, filter, sort and pagination',
  })
  @ApiOkResponse({ type: PaginatedInvoicesDto })
  findAll(@Query() query: ListInvoicesQueryDto) {
    return this.invoices.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice by id' })
  @ApiOkResponse({ type: InvoiceResponseDto })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.findOne(id);
  }
}
