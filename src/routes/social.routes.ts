// src/routes/social.routes.ts
import { Router } from 'express';
import {
  findUsuariosController,
  followController,
  unfollowController,
  getFeedController,
  getRankingController,
  likeRegistroController,    
  unlikeRegistroController,  
  comentarRegistroController,
  getComentariosController,  
  deleteComentarioController,
} from '../controllers/social.controller';
import { protectRoute } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { findUsuariosSchema, getFeedSchema, getRankingSchema, comentarioSchema,} from '../validators/social.validator';

const router = Router();
router.use(protectRoute);

// --- Rutas de Seguimiento y Búsqueda ---
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

// --- Rutas de Feed y Ranking ---
// Obtener el feed de actividad
router.get(
  '/feed',
  validateRequest(getFeedSchema, 'query'),
  getFeedController,
);
// Obtener el ranking
router.get(
  '/ranking',
  validateRequest(getRankingSchema, 'query'),
  getRankingController,
);

// -- Likes --
// Dar like a un registro (id del registro)
router.post(
  '/registros/:id/like',
  likeRegistroController,
);
// Quitar like a un registro (id del registro)
router.delete(
  '/registros/:id/like',
  unlikeRegistroController,
);

// -- Comentarios --
// Comentar en un registro (id del registro)
router.post(
  '/registros/:id/comentar',
  validateRequest(comentarioSchema),
  comentarRegistroController,
);
// Obtener comentarios de un registro (id del registro)
router.get(
  '/registros/:id/comentarios',
  getComentariosController,
);
// Borrar un comentario (id del comentario)
router.delete(
  '/comentarios/:id',
  deleteComentarioController,
);


export default router;