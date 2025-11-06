// src/routes/configuracion.routes.ts
import { Router } from 'express';
import { changePasswordController } from '../controllers/configuracion.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { changePasswordSchema } from '../validators/configuracion.validator';

const router = Router();
router.use(protectRoute);

// Ruta para cambiar la contraseña
router.post(
  '/cambiar-password',
  validateRequest(changePasswordSchema),
  changePasswordController,
);

export default router;