// src/validators/configuracion.validator.ts
import { z } from 'zod';

export const changePasswordSchema = z.object({
  body: z.object({
    passwordActual: z
      .string()
      .nonempty('La contraseña actual es requerida.'),

    passwordNueva: z
      .string()
      .min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
  }),
});
