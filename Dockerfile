# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Stage 2: Build Next.js
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production Server
FROM node:22-alpine AS runner
# FIX 1: Tambahkan libc6-compat di sini karena Prisma sangat membutuhkannya!
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# TAMBAHKAN BARIS INI:
ENV HOSTNAME="0.0.0.0"

# FIX 2: Install tool di direktori lokal (tanpa -g). 
# Kita letakkan ini SEBELUM proses COPY package.json agar tidak memicu instalasi ulang seluruh dependensi Next.js.
RUN npm install prisma@5.22.0 @prisma/client@5.22.0 ts-node typescript

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node server.js"]