// src/validators/configuracion.validator.ts
import { z } from 'zod';

export const changePasswordSchema = z.object({
  passwordActual: z
    .string()
    .min(1, 'La contraseña actual es requerida.'),
  passwordNueva: z
    .string()
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
});