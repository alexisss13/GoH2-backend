// src/routes/auth.routes.ts
import { Router } from 'express';
import {
  loginController,
  registerController,
  olvidePasswordController,
  restablecerPasswordController,
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerSchema, olvidePasswordSchema, restablecerPasswordSchema, } from '../validators/auth.validator';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Ruta de Registro
router.post(
  '/registro',
  authLimiter,
  validateRequest(registerSchema),
  registerController,
);

// Ruta de Login
router.post(
  '/login',
  authLimiter,
  validateRequest(loginSchema),
  loginController,
);

// 1. Solicitar reseteo
router.post(
  '/olvide-password',
  authLimiter, // Aplicamos el mismo limitador
  validateRequest(olvidePasswordSchema),
  olvidePasswordController,
);

// 2. Enviar el nuevo password
router.post(
  '/restablecer-password',
  authLimiter, // Aplicamos el mismo limitador
  validateRequest(restablecerPasswordSchema),
  restablecerPasswordController,
);

export default router;