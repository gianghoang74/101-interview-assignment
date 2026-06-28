import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Invoices workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const user = { email: 'e2e@simpleinvoice.test', password: 'E2ePassw0rd!' };
  const customerEmail = 'e2e-customer@example.com';
  const invoiceNumber = `E2E-${Date.now()}`;
  let token = '';

  const payload = (overrides: Record<string, unknown> = {}) => ({
    customer: { fullname: 'E2E Customer', email: customerEmail },
    invoiceNumber,
    invoiceDate: '2026-06-01',
    dueDate: '2026-12-31', // future -> stays Draft
    currency: 'AUD',
    item: { name: 'Test item', quantity: 4, rate: 250 },
    tax: 10,
    discount: 0,
    ...overrides,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        fullname: 'E2E User',
      },
    });
  });

  afterAll(async () => {
    await prisma.invoice.deleteMany({ where: { invoiceNumber } });
    await prisma.customer.deleteMany({ where: { email: customerEmail } });
    await prisma.user.deleteMany({ where: { email: user.email } });
    await app.close();
  });

  it('rejects unauthenticated access to /invoices', async () => {
    await request(app.getHttpServer()).get('/invoices').expect(401);
  });

  it('logs in and returns a JWT access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(user)
      .expect(200);

    const body = res.body as { accessToken: string; user: { email: string } };
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(user.email);
    token = body.accessToken;
  });

  it('creates an invoice (Bearer) and finds it in the list', async () => {
    const created = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send(payload())
      .expect(201);

    const createdBody = created.body as {
      status: string;
      invoiceSubTotal: number;
      totalAmount: number;
    };
    expect(createdBody.status).toBe('Draft');
    expect(createdBody.invoiceSubTotal).toBe(1000);
    expect(createdBody.totalAmount).toBe(1100); // 1000 + 10% - 0

    const list = await request(app.getHttpServer())
      .get(`/invoices?keyword=${invoiceNumber}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const listBody = list.body as {
      data: Array<{ invoiceNumber: string; customer: { fullname: string } }>;
    };
    const found = listBody.data.find((i) => i.invoiceNumber === invoiceNumber);
    expect(found).toBeDefined();
    expect(found?.customer.fullname).toBe('E2E Customer');
  });

  it('rejects a duplicate invoice number with 409', async () => {
    await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send(
        payload({ customer: { fullname: 'Dup', email: 'dup@example.com' } }),
      )
      .expect(409);
  });
});
