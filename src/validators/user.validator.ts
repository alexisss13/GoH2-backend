// src/validators/user.validator.ts
import { z } from 'zod';

// Nivel de actividad basado en la pantalla 6 ("Moderado")
const nivelesActividad = z
  .enum(['Sedentario', 'Ligero', 'Moderado', 'Activo', 'MuyActivo'])
  .or(z.string().refine(() => false, { message: "Nivel de actividad inválido." }));


export const updateProfileSchema = z.object({
  body: z.object({
    // La pantalla 6 pide Fecha N.
    fechaNacimiento: z
      .string()
      .datetime({ message: 'La fecha de nacimiento debe ser un string ISO 8601 (Ej: "2005-11-31T00:00:00.000Z")' })
      .optional(),
    
    // La pantalla 6 pide Género
    genero: z.string().min(1, 'El género no puede estar vacío.').optional(),
    
    // La pantalla 6 pide Altura (cm)
    alturaCm: z.number().int().positive('La altura debe ser un número positivo.').optional(),
    
    // La pantalla 6 pide Peso (kg)
    pesoKg: z.number().positive('El peso debe ser un número positivo.').optional(),
    
    // La pantalla 6 pide Nivel de actividad
    nivelActividad: nivelesActividad.optional(),
  }).strict(),// Evita que envíen campos que no esperamos
});