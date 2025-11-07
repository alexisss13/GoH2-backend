// src/validators/registro.validator.ts
import { z } from 'zod';
import { TipoRegistro } from '@prisma/client';

const tipoRegistroEnum = z.nativeEnum(TipoRegistro)
  .refine(
    (val) => val === 'MANUAL' || val === 'DIGITAL',
    "Tipo de registro inválido. Debe ser 'MANUAL' o 'DIGITAL'."
  );

// ✅ Elimina el wrapper "body"
export const createRegistroSchema = z.object({
  bebidaId: z
    .string()
    .uuid('El ID de la bebida debe ser un UUID válido.'),
  
  cantidadConsumidaMl: z
    .number()
    .int()
    .positive('La cantidad consumida debe ser un número positivo.'),
  
  tipoRegistro: tipoRegistroEnum,
  
  fechaHora: z
    .string()
    .datetime({ message: 'La fecha y hora debe ser un string ISO 8601.' })
    .optional(),
});

export const getRegistrosSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "El formato de fecha debe ser YYYY-MM-DD."
  }).optional(),
});