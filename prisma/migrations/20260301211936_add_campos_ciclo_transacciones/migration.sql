-- AlterTable
ALTER TABLE "gastos" ADD COLUMN     "canceladoParaElFuturo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user_configs" ADD COLUMN     "pendingConfig" JSONB;

-- CreateTable
CREATE TABLE "transacciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
