import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin wrapper around PrismaClient that ties the DB connection lifecycle to
 * the Nest module lifecycle.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
