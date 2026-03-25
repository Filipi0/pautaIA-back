/*
  Warnings:

  - You are about to drop the `Pauta` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Pauta";

-- CreateTable
CREATE TABLE "Redacao" (
    "id" SERIAL NOT NULL,
    "tema" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "totalLinhas" INTEGER NOT NULL DEFAULT 0,
    "totalPalavras" INTEGER NOT NULL DEFAULT 0,
    "totalCaracteres" INTEGER NOT NULL DEFAULT 0,
    "marcacoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redacao_pkey" PRIMARY KEY ("id")
);
