// src/routes/objetivo.routes.ts
import { Router } from 'express';
import { getDailyObjectiveController } from '../controllers/objetivo.controller';
import { protectRoute } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de objetivos requieren autenticación
router.use(protectRoute);

// Obtener el objetivo del día (o crearlo si no existe)
router.get(
  '/hoy',
  getDailyObjectiveController,
);

export default router;