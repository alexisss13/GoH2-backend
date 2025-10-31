// src/routes/resumen.routes.ts
import { Router } from 'express';
import { getDailySummaryController } from '../controllers/resumen.controller';
import { protectRoute } from '../middleware/auth.middleware';

const router = Router();

router.use(protectRoute);

// Ruta para el dashboard principal
router.get(
  '/hoy',
  getDailySummaryController,
);

export default router;