import { z } from 'zod';

// Registro
export const registerSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido.'),
  email: z
    .string()
    .email('El correo electrónico no es válido.')
    .min(1, 'El correo electrónico es requerido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

// Login
export const loginSchema = z.object({
  email: z
    .string()
    .email('El correo electrónico no es válido.')
    .min(1, 'El correo electrónico es requerido.'),
  password: z
    .string()
    .min(1, 'La contraseña no puede estar vacía.'),
});

export const olvidePasswordSchema = z.object({
  email: z
    .string()
    .email('El correo no es válido.')
    .min(1, 'El correo es requerido.'),
});

export const restablecerPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'El token no puede estar vacío.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});
