// src/routes/bebida.routes.ts
import { Router } from 'express';
import {
  listBebidasController,
  createBebidaController,
} from '../controllers/bebida.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { createBebidaSchema } from '../validators/bebida.validator';

const router = Router();

// Ruta pública para que la app obtenga la lista de bebidas
router.get(
  '/',
  listBebidasController,
);

// Ruta protegida (requiere JWT) para añadir nuevas bebidas
router.post(
  '/',
  protectRoute,
  validateRequest(createBebidaSchema),
  createBebidaController,
);

export default router;