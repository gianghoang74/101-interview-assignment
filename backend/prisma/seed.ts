import { faker } from '@faker-js/faker';
import { type InvoiceStatus, Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';
import { calculateTotals } from '../src/invoices/invoices.totals';

const prisma = new PrismaClient();

const DEFAULT_USER = {
  email: 'demo@simpleinvoice.test',
  password: 'Password123!',
  fullname: 'Demo User',
};

const CURRENCIES = [
  { code: 'AUD', symbol: 'AU$' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'SGD', symbol: 'S$' },
];

// Overdue is NEVER seeded — it is derived at read time.
const PERSISTED_STATUSES: InvoiceStatus[] = ['Draft', 'Pending', 'Paid'];

const ADDITIONAL_INVOICES = 30;

type CustomerRow = Awaited<ReturnType<typeof prisma.customer.create>>;

const dateOnly = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

async function main(): Promise<void> {
  // Idempotent by default: skip when the database already has data, so re-running
  // (including on every Docker backend restart) preserves existing data.
  // Set SEED_FORCE=true to wipe and re-seed.
  const force = process.env.SEED_FORCE === 'true';
  if (!force && (await prisma.user.count()) > 0) {
    console.log(
      'Database already has data — skipping seed. Set SEED_FORCE=true to re-seed.',
    );
    return;
  }

  faker.seed(101);
  const today = dateOnly(new Date());

  // Reset (invoice delete cascades to items; customers/users have FK restrict).
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // --- Default user (credentials documented in README) ---
  const defaultUser = await prisma.user.create({
    data: {
      email: DEFAULT_USER.email,
      passwordHash: await bcrypt.hash(DEFAULT_USER.password, 10),
      fullname: DEFAULT_USER.fullname,
    },
  });

  // --- Customer pool (sample + fixed + random) ---
  const baseCustomers = [
    { fullname: 'Paul', email: 'paul@example.com', mobileNumber: '947717364111', address: 'Singapore' },
    { fullname: 'Acme Corp', email: 'accounts@acme.example', mobileNumber: '0400000001', address: 'Sydney, AU' },
    { fullname: 'Globex Pty Ltd', email: 'billing@globex.example', mobileNumber: '0400000002', address: 'Melbourne, AU' },
    { fullname: 'Initech', email: 'ap@initech.example', mobileNumber: null as string | null, address: 'London, UK' },
    { fullname: 'Umbrella LLC', email: 'finance@umbrella.example', mobileNumber: '0400000004', address: 'Auckland, NZ' },
  ];
  for (let i = 0; i < 5; i++) {
    baseCustomers.push({
      fullname: faker.company.name(),
      email: `${faker.person.firstName().toLowerCase()}.${faker.string.numeric(4)}.${i}@example.com`,
      mobileNumber: faker.phone.number(),
      address: `${faker.location.city()}, ${faker.location.countryCode()}`,
    });
  }

  const customers: CustomerRow[] = [];
  for (const data of baseCustomers) {
    customers.push(await prisma.customer.create({ data }));
  }
  const paul = customers[0];

  // --- Sample invoice: stored Pending + past due date → derives Overdue ---
  const sampleTotals = calculateTotals({
    quantity: 2,
    rate: 1000,
    taxPercent: 10,
    discount: 20,
    totalPaid: 1451.34,
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'IV1780488206995',
      invoiceReference: '#5721662',
      invoiceDate: dateOnly(addDays(today, -30)),
      dueDate: dateOnly(addDays(today, -5)), // past + non-Paid => Overdue
      currency: 'AUD',
      currencySymbol: 'AU$',
      description: 'Invoice is issued to Kanglee',
      status: 'Pending',
      invoiceSubTotal: sampleTotals.invoiceSubTotal,
      totalTax: sampleTotals.totalTax,
      totalDiscount: sampleTotals.totalDiscount,
      totalAmount: sampleTotals.totalAmount,
      totalPaid: sampleTotals.totalPaid,
      balanceAmount: sampleTotals.balanceAmount,
      createdBy: defaultUser.id,
      customerId: paul.id,
      items: {
        create: [{ name: 'Honda RC150', quantity: 2, rate: new Prisma.Decimal(1000) }],
      },
    },
  });

  // --- Additional invoices with varied data ---
  for (let i = 0; i < ADDITIONAL_INVOICES; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const currency = faker.helpers.arrayElement(CURRENCIES);
    const status = faker.helpers.arrayElement(PERSISTED_STATUSES);

    const quantity = faker.number.int({ min: 1, max: 10 });
    const rate = faker.number.int({ min: 50, max: 5000 });
    const subtotalNum = quantity * rate;
    const taxPercent = faker.helpers.arrayElement([0, 5, 10, 15]);
    const discount = faker.helpers.arrayElement([
      0,
      0,
      0,
      Math.round(subtotalNum * 0.05),
      Math.round(subtotalNum * 0.1),
    ]);

    // Spread dates across past and future so Overdue derivation is exercised.
    const invoiceDate = dateOnly(addDays(today, faker.number.int({ min: -90, max: 10 })));
    const dueDate = dateOnly(addDays(invoiceDate, faker.number.int({ min: 7, max: 45 })));

    const totalAmountNum = calculateTotals({
      quantity,
      rate,
      taxPercent,
      discount,
      totalPaid: 0,
    }).totalAmount.toNumber();
    const totalPaid =
      status === 'Paid'
        ? totalAmountNum
        : faker.helpers.arrayElement([0, 0, Math.round(totalAmountNum * 0.5 * 100) / 100]);

    const totals = calculateTotals({ quantity, rate, taxPercent, discount, totalPaid });

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${faker.string.numeric(8)}-${i}`,
        invoiceReference: faker.datatype.boolean() ? `#${faker.string.numeric(6)}` : null,
        invoiceDate,
        dueDate,
        currency: currency.code,
        currencySymbol: currency.symbol,
        description:
          faker.helpers.maybe(() => faker.commerce.productDescription(), {
            probability: 0.6,
          }) ?? null,
        status,
        invoiceSubTotal: totals.invoiceSubTotal,
        totalTax: totals.totalTax,
        totalDiscount: totals.totalDiscount,
        totalAmount: totals.totalAmount,
        totalPaid: totals.totalPaid,
        balanceAmount: totals.balanceAmount,
        createdBy: defaultUser.id,
        customerId: customer.id,
        items: {
          create: [
            {
              name: faker.commerce.productName(),
              quantity,
              rate: new Prisma.Decimal(rate),
            },
          ],
        },
      },
    });
  }

  const byStatus = await prisma.invoice.groupBy({ by: ['status'], _count: true });
  console.log('✔ Seed complete.');
  console.log(`  Default login: ${DEFAULT_USER.email} / ${DEFAULT_USER.password}`);
  console.log(`  Customers: ${customers.length}`);
  console.log(`  Invoices: ${ADDITIONAL_INVOICES + 1}`);
  console.log(
    '  Stored status:',
    byStatus.map((s) => `${s.status}=${s._count}`).join(', '),
    '(Overdue is derived at read time)',
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
