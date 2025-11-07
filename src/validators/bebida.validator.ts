// src/validators/bebida.validator.ts
import { z } from 'zod';

export const createBebidaSchema = z.object({
    nombre: z
      .string()
      .min(1, 'El nombre es requerido y no puede estar vacío.'),
    
    // El factor de hidratación es opcional, si no se provee, por defecto es 1.0
    factorHidratacion: z
      .number()
      .positive('El factor debe ser un número positivo.')
      .optional()
      .default(1.0),
});