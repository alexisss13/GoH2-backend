// src/routes/registro.routes.ts
import { Router } from 'express';
import {
  createRegistroController,
  getRegistrosController,
} from '../controllers/registro.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  createRegistroSchema,
  getRegistrosSchema,
} from '../validators/registro.validator';

const router = Router();

// Aplicamos el middleware de protección a todas las rutas de /registros
router.use(protectRoute);

// Crear un nuevo registro
router.post(
  '/',
  validateRequest(createRegistroSchema),
  createRegistroController,
);

// Obtener los registros del día
router.get(
  '/',
  validateRequest(getRegistrosSchema, 'query'),
  getRegistrosController,
);

export default router;