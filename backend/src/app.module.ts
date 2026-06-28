import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { InvoicesModule } from './invoices/invoices.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Loads .env and exposes config globally.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [
    // Authenticate every route by default; opt out per-route with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
