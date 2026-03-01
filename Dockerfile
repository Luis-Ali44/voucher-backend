# ─────────────────────────────────────────────────────────────
# Dockerfile — NestJS App (backend-voucher)
# ─────────────────────────────────────────────────────────────

# ── Etapa 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ── Etapa 2: Producción ───────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copiar build y cliente de Prisma generado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Script de entrada que ejecuta migraciones y arranca el server
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
