// src/routes/user.routes.ts
import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  getProfileStatusController,
  deleteProfileController,
} from '../controllers/user.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateProfileSchema, deleteProfileSchema, } from '../validators/user.validator';

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

// DELETE /api/perfil
router.delete(
  '/',
  validateRequest(deleteProfileSchema), // Valida que venga el password
  deleteProfileController,
);

// Para que la app sepa si mostrar el banner de "completa tu perfil"
router.get(
  '/estado-calculo',
  getProfileStatusController,
);

export default router;