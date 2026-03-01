#!/bin/sh
# entrypoint.sh — Ejecuta migraciones de Prisma y arranca el servidor

set -e

echo "Esperando que la base de datos esté lista"
sleep 3

echo "Ejecutando migraciones de Prisma"
npx prisma migrate deploy

echo "Iniciando API"
exec node dist/main
