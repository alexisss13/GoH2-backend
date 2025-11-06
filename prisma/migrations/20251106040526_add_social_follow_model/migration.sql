-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('ML', 'OZ');

-- DropForeignKey
ALTER TABLE "public"."ObjetivoHidratacion" DROP CONSTRAINT "ObjetivoHidratacion_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RegistroBebida" DROP CONSTRAINT "RegistroBebida_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "unidadMedida" "UnidadMedida" NOT NULL DEFAULT 'ML';

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seguidorId" TEXT NOT NULL,
    "seguidoId" TEXT NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Follow_seguidorId_idx" ON "Follow"("seguidorId");

-- CreateIndex
CREATE INDEX "Follow_seguidoId_idx" ON "Follow"("seguidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_seguidorId_seguidoId_key" ON "Follow"("seguidorId", "seguidoId");

-- AddForeignKey
ALTER TABLE "RegistroBebida" ADD CONSTRAINT "RegistroBebida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjetivoHidratacion" ADD CONSTRAINT "ObjetivoHidratacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_seguidorId_fkey" FOREIGN KEY ("seguidorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_seguidoId_fkey" FOREIGN KEY ("seguidoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
