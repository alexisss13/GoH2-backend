// src/middleware/rateLimiter.ts
import { rateLimit } from 'express-rate-limit';

// Limitador estricto para rutas de autenticación
// Permite 10 intentos (login, registro) cada 15 minutos por IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite de 10 peticiones por IP
  message: {
    error: 'Demasiados intentos de autenticación desde esta IP. Inténtalo de nuevo en 15 minutos.',
  },
  standardHeaders: true, // Devuelve info del límite en cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*`
});

// Limitador general para el resto de la API
// Permite 100 peticiones cada 15 minutos por IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // Límite de 100 peticiones
  message: {
    error: 'Demasiadas peticiones desde esta IP. Inténtalo de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});