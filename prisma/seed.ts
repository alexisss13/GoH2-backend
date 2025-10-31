// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista de bebidas iniciales basada en el diseño (pantalla 1)
const bebidasIniciales = [
    { nombre: 'Agua', factorHidratacion: 1.0 },
    { nombre: 'Café', factorHidratacion: 0.9 },
    { nombre: 'Té', factorHidratacion: 0.9 },
    { nombre: 'Jugo', factorHidratacion: 0.9 },
    { nombre: 'Yogur', factorHidratacion: 0.8 },
    { nombre: 'Refresco', factorHidratacion: 0.85 },
    { nombre: 'Cerveza', factorHidratacion: 0.6 },
    { nombre: 'Cerveza sin alcohol', factorHidratacion: 0.95 },
    { nombre: 'Alcohol fuerte', factorHidratacion: 0.0 },
];

async function main() {
  console.log('Iniciando el proceso de seed...');

  for (const bebida of bebidasIniciales) {
    // Usamos 'upsert' para evitar duplicados si el seed se corre varias veces
    // Actualizará el factor si existe, o creará la bebida si no existe.
    await prisma.bebida.upsert({
      where: { nombre: bebida.nombre },
      update: {
        factorHidratacion: bebida.factorHidratacion,
      },
      create: {
        nombre: bebida.nombre,
        factorHidratacion: bebida.factorHidratacion,
      },
    });
    console.log(`Bebida procesada (upsert): ${bebida.nombre}`);
  }

  console.log('Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });