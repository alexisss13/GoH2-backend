// src/routes/webhook.routes.ts
import { Router } from 'express';
import { receiveWebhook } from '../controllers/webhook.controller';

const router = Router();

// Mercado Pago envía POST
router.post('/', receiveWebhook);

export default router;