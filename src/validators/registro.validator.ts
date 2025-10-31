// src/validators/registro.validator.ts
import { z } from 'zod';
import { TipoRegistro } from '@prisma/client';

// Requerimos que el enum venga de Prisma para asegurar consistencia
const tipoRegistroEnum = z.nativeEnum(TipoRegistro)
  .refine(
    (val) => val === 'MANUAL' || val === 'DIGITAL',
    "Tipo de registro inválido. Debe ser 'MANUAL' o 'DIGITAL'."
  );

export const createRegistroSchema = z.object({
  body: z.object({
    // ID de la bebida seleccionada
    bebidaId: z
      .string()
      .uuid('El ID de la bebida debe ser un UUID válido.'),
    
    // Cantidad en ml que el usuario consumió (Ej: 100ml)
    cantidadConsumidaMl: z
      .number()
      .int()
      .positive('La cantidad consumida debe ser un número positivo.'),
    
    // 'MANUAL' o 'DIGITAL' (simulado)
    tipoRegistro: tipoRegistroEnum,
    
    // Opcional: permite al usuario registrar una bebida en el pasado
    fechaHora: z
      .string()
      .datetime({ message: 'La fecha y hora debe ser un string ISO 8601.' })
      .optional(),
  }),
});

// --- NUEVO ESQUEMA ---
// Valida los query params para GET /api/registros
export const getRegistrosSchema = z.object({
  query: z.object({
    // La fecha debe estar en formato YYYY-MM-DD
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "El formato de fecha debe ser YYYY-MM-DD."
    }).optional(),
  }),
});