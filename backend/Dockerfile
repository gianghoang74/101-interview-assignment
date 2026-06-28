# SimpleInvoice backend — NestJS + Prisma
FROM node:20-alpine

# Prisma needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies (incl. dev deps: Prisma CLI, tsx for seeding, Nest build).
COPY package*.json ./
RUN npm ci

# Generate the Prisma client.
COPY prisma ./prisma
RUN npx prisma generate

# Build the application.
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

EXPOSE 3001

# Apply migrations, seed sample data (idempotent — skipped if already populated),
# then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/main"]
