// src/routes/social.routes.ts
import { Router } from 'express';
import {
  findUsuariosController,
  followController,
  unfollowController,
  getFeedController,
  getRankingController,
} from '../controllers/social.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { findUsuariosSchema, getFeedSchema,} from '../validators/social.validator';

const router = Router();
router.use(protectRoute); // Todas las rutas sociales son protegidas

// Buscar usuarios
router.get(
  '/buscar',
  validateRequest(findUsuariosSchema, 'query'),
  findUsuariosController,
);

// Seguir a un usuario
router.post(
  '/seguir/:id',
  followController,
);

// Dejar de seguir a un usuario
router.delete(
  '/dejar-de-seguir/:id',
  unfollowController,
);

// Obtener el feed de actividad
router.get(
  '/feed',
  validateRequest(getFeedSchema, 'query'),
  getFeedController,
);

// Obtener el ranking de hoy
router.get(
  '/ranking',
  getRankingController,
);

export default router;