// src/routes/auth.routes.ts
import { Router } from 'express';
import {
  loginController,
  registerController,
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

// Ruta de Registro
router.post(
  '/registro',
  validateRequest(registerSchema), // Primero valida
  registerController, // Luego ejecuta el controlador
);

// Ruta de Login
router.post(
  '/login',
  validateRequest(loginSchema), // Primero valida
  loginController, // Luego ejecuta el controlador
);

export default router;