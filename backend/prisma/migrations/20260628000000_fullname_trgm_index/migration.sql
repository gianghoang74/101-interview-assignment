-- Enable trigram matching so customer-name search (ILIKE '%...%') can be indexed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- The plain btree index on customers.fullname cannot serve a leading-wildcard
-- ILIKE, so replace it with a trigram GIN index that can.
DROP INDEX IF EXISTS "customers_fullname_idx";
CREATE INDEX "customers_fullname_trgm_idx" ON "customers" USING GIN ("fullname" gin_trgm_ops);
