import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { InvoiceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { startOfTodayUtc } from '../src/invoices/invoices.mapper';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Exercises the list endpoint's derivation-aware status filter, customer-name
 * search, inclusive date-range filter, and the create-time validation guards —
 * the service logic that the happy-path e2e doesn't cover.
 */
describe('Invoices filtering & validation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const TAG = Date.now();
  const user = {
    email: `filter-e2e-${TAG}@simpleinvoice.test`,
    password: 'FilterPassw0rd!',
  };
  // Unique customer name so a keyword scopes results to exactly this suite's rows.
  const CUSTOMER_NAME = `ZzFilterTest${TAG}Co`;
  const CUSTOMER_EMAIL = `zzfilter${TAG}@example.com`;
  const KEYWORD = `ZzFilterTest${TAG}`;
  const num = (s: string) => `ZZF-${TAG}-${s}`;

  let token = '';
  let userId = '';
  let customerId = '';

  const today = startOfTodayUtc();
  const addDaysUtc = (d: Date, n: number) =>
    new Date(d.getTime() + n * 86_400_000);
  const dateOnly = (y: number, m: number, d: number) =>
    new Date(Date.UTC(y, m - 1, d));

  const seedInvoice = (opts: {
    number: string;
    status: InvoiceStatus;
    invoiceDate: Date;
    dueDate: Date;
  }) =>
    prisma.invoice.create({
      data: {
        invoiceNumber: opts.number,
        invoiceDate: opts.invoiceDate,
        dueDate: opts.dueDate,
        currency: 'AUD',
        currencySymbol: 'AU$',
        status: opts.status,
        invoiceSubTotal: 100,
        totalTax: 10,
        totalDiscount: 0,
        totalAmount: 110,
        totalPaid: opts.status === 'Paid' ? 110 : 0,
        balanceAmount: opts.status === 'Paid' ? 0 : 110,
        createdBy: userId,
        customerId,
        items: { create: [{ name: 'Item', quantity: 1, rate: 100 }] },
      },
    });

  const basePayload = (overrides: Record<string, unknown> = {}) => ({
    customer: { fullname: 'Post Test', email: `post-${TAG}@example.com` },
    invoiceNumber: num('POST'),
    invoiceDate: '2026-06-01',
    dueDate: '2026-07-01',
    currency: 'AUD',
    item: { name: 'Widget', quantity: 1, rate: 100 },
    tax: 10,
    discount: 0,
    ...overrides,
  });

  const list = (qs: string) =>
    request(app.getHttpServer())
      .get(`/invoices?pageSize=100&${qs}`)
      .set('Authorization', `Bearer ${token}`);

  const numbersFrom = (body: { data: Array<{ invoiceNumber: string }> }) =>
    body.data.map((i) => i.invoiceNumber).sort();

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

    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        fullname: 'Filter E2E User',
      },
    });
    userId = created.id;

    const customer = await prisma.customer.create({
      data: { fullname: CUSTOMER_NAME, email: CUSTOMER_EMAIL },
    });
    customerId = customer.id;

    // Four invoices under one customer; status is derived from stored status + dueDate.
    await seedInvoice({
      number: num('A'),
      status: 'Pending',
      invoiceDate: dateOnly(2026, 3, 1),
      dueDate: addDaysUtc(today, -5), // past + not Paid => Overdue
    });
    await seedInvoice({
      number: num('B'),
      status: 'Pending',
      invoiceDate: dateOnly(2026, 3, 15),
      dueDate: addDaysUtc(today, 5), // future => stays Pending
    });
    await seedInvoice({
      number: num('C'),
      status: 'Paid',
      invoiceDate: dateOnly(2026, 3, 31),
      dueDate: addDaysUtc(today, -10), // Paid is never Overdue
    });
    await seedInvoice({
      number: num('D'),
      status: 'Draft',
      invoiceDate: dateOnly(2026, 3, 20),
      dueDate: addDaysUtc(today, -3), // past + not Paid => Overdue
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(user)
      .expect(200);
    token = (res.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await prisma.invoice.deleteMany({
      where: { invoiceNumber: { startsWith: `ZZF-${TAG}-` } },
    });
    await prisma.customer.deleteMany({
      where: { email: { in: [CUSTOMER_EMAIL, `post-${TAG}@example.com`] } },
    });
    await prisma.user.deleteMany({ where: { email: user.email } });
    await app.close();
  });

  describe('derivation-aware status filter', () => {
    it('status=Overdue returns non-Paid invoices past their due date', async () => {
      const res = await list(`keyword=${KEYWORD}&status=Overdue`).expect(200);
      expect(numbersFrom(res.body)).toEqual([num('A'), num('D')]);
    });

    it('status=Pending excludes past-due (now Overdue) invoices', async () => {
      const res = await list(`keyword=${KEYWORD}&status=Pending`).expect(200);
      expect(numbersFrom(res.body)).toEqual([num('B')]);
    });

    it('status=Paid returns Paid invoices regardless of due date', async () => {
      const res = await list(`keyword=${KEYWORD}&status=Paid`).expect(200);
      expect(numbersFrom(res.body)).toEqual([num('C')]);
    });

    it('status=Draft excludes a past-due Draft (it derives to Overdue)', async () => {
      const res = await list(`keyword=${KEYWORD}&status=Draft`).expect(200);
      expect(numbersFrom(res.body)).toEqual([]);
    });
  });

  describe('search', () => {
    it('matches the customer name case-insensitively (partial)', async () => {
      const res = await list(`keyword=${KEYWORD.toLowerCase()}`).expect(200);
      expect(numbersFrom(res.body)).toEqual(
        [num('A'), num('B'), num('C'), num('D')].sort(),
      );
    });
  });

  describe('date-range filter (on invoice date, inclusive)', () => {
    it('includes rows dated exactly on fromDate and toDate', async () => {
      // B = 2026-03-15 (lower bound), D = 2026-03-20 (upper bound).
      const res = await list(
        `keyword=${KEYWORD}&fromDate=2026-03-15&toDate=2026-03-20`,
      ).expect(200);
      expect(numbersFrom(res.body)).toEqual([num('B'), num('D')].sort());
    });
  });

  describe('create-time validation guards', () => {
    it('rejects a discount greater than subtotal + tax with 400', async () => {
      await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${token}`)
        .send(basePayload({ discount: 100_000 }))
        .expect(400);
    });

    it('rejects a datetime in a date-only field with 400', async () => {
      await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${token}`)
        .send(basePayload({ invoiceDate: '2026-06-01T08:00:00Z' }))
        .expect(400);
    });

    it('rejects an impossible calendar date with 400', async () => {
      await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${token}`)
        .send(basePayload({ dueDate: '2026-02-31' }))
        .expect(400);
    });

    it('rejects an unsupported currency with 400', async () => {
      await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${token}`)
        .send(basePayload({ currency: 'ZZZ' }))
        .expect(400);
    });
  });
});
