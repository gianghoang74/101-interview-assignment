-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('Draft', 'Pending', 'Paid');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile_number" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_reference" TEXT,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "currency" TEXT NOT NULL,
    "currency_symbol" TEXT NOT NULL,
    "description" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'Draft',
    "invoice_sub_total" DECIMAL(14,2) NOT NULL,
    "total_tax" DECIMAL(14,2) NOT NULL,
    "total_discount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "total_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_amount" DECIMAL(14,2) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_fullname_idx" ON "customers"("fullname");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoices_total_amount_idx" ON "invoices"("total_amount");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;
