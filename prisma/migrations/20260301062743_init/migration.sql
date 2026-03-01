-- CreateEnum
CREATE TYPE "Frecuencia" AS ENUM ('Semanal', 'Quincenal', 'Mensual');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('Vital', 'Recurrente');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_configs" (
    "id" TEXT NOT NULL,
    "salario" DOUBLE PRECISION NOT NULL,
    "frecuencia" "Frecuencia" NOT NULL,
    "diaInicio" INTEGER NOT NULL,
    "saldoActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ahorroHistorico" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "frecuencia" "Frecuencia" NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresos_extra" (
    "id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "origen" TEXT,
    "reservado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ingresos_extra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_configs_userId_key" ON "user_configs"("userId");

-- AddForeignKey
ALTER TABLE "user_configs" ADD CONSTRAINT "user_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos_extra" ADD CONSTRAINT "ingresos_extra_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
