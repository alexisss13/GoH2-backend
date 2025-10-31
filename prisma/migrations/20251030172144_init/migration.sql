-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('MANUAL', 'DIGITAL');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "genero" TEXT,
    "alturaCm" INTEGER,
    "pesoKg" DOUBLE PRECISION,
    "nivelActividad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bebida" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "factorHidratacion" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Bebida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroBebida" (
    "id" TEXT NOT NULL,
    "cantidadConsumidaMl" INTEGER NOT NULL,
    "aporteHidricoMl" INTEGER NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoRegistro" "TipoRegistro" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "bebidaId" TEXT NOT NULL,

    CONSTRAINT "RegistroBebida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjetivoHidratacion" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "cantidadMl" INTEGER NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "ObjetivoHidratacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Bebida_nombre_key" ON "Bebida"("nombre");

-- CreateIndex
CREATE INDEX "RegistroBebida_usuarioId_fechaHora_idx" ON "RegistroBebida"("usuarioId", "fechaHora");

-- CreateIndex
CREATE UNIQUE INDEX "ObjetivoHidratacion_usuarioId_fecha_key" ON "ObjetivoHidratacion"("usuarioId", "fecha");

-- AddForeignKey
ALTER TABLE "RegistroBebida" ADD CONSTRAINT "RegistroBebida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroBebida" ADD CONSTRAINT "RegistroBebida_bebidaId_fkey" FOREIGN KEY ("bebidaId") REFERENCES "Bebida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjetivoHidratacion" ADD CONSTRAINT "ObjetivoHidratacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
