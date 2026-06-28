-- pg_trgm is already enabled by an earlier migration; ensure it for safety.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- The @unique btree on invoice_number can't serve a leading-wildcard ILIKE,
-- so add a trigram GIN index for the case-insensitive substring keyword search.
CREATE INDEX "invoices_invoice_number_trgm_idx" ON "invoices" USING GIN ("invoice_number" gin_trgm_ops);
