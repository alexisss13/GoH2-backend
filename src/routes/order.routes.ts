// src/routes/order.routes.ts
import { Router } from 'express';
import { createOrderController } from '../controllers/order.controller';
import { protectRoute } from '../middleware/auth.middleware';

const router = Router();

// Protegemos la ruta: Solo usuarios logueados pueden comprar
router.post('/', protectRoute, createOrderController);

export default router;