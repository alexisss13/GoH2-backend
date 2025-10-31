// src/routes/user.routes.ts
import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  getProfileStatusController,
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

// Para que la app sepa si mostrar el banner de "completa tu perfil"
router.get(
  '/estado-calculo',
  getProfileStatusController,
);

export default router;