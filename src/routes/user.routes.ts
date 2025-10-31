// src/routes/user.routes.ts
import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
} from '../controllers/user.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

// Todas las rutas en este archivo requieren autenticación
router.use(protectRoute);

// Obtener perfil del usuario
router.get(
  '/',
  getProfileController,
);

// Actualizar perfil del usuario
router.put(
  '/',
  validateRequest(updateProfileSchema), // Validamos los datos de entrada
  updateProfileController,
);

export default router;