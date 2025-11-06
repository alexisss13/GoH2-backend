// src/validators/social.validator.ts
import { z } from 'zod';

// ✅ Elimina el wrapper "query"
export const findUsuariosSchema = z.object({
  q: z
    .string()
    .min(1, 'El término de búsqueda no puede estar vacío.')
    .optional(),
});

export const getFeedSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive('La página debe ser un número positivo.')
    .optional()
    .default(1),
  
  limit: z.coerce
    .number()
    .int()
    .positive('El límite debe ser un número positivo.')
    .max(100, 'El límite máximo es 100.')
    .optional()
    .default(20),
});