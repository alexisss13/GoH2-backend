// src/controllers/objetivo.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getOrCreateDailyObjective } from '../utils/hydration.utils';

/**
 * Obtiene el objetivo de hidratación para el día actual.
 * Si no existe, lo calcula, lo guarda y lo devuelve.
 * GET /api/objetivo/hoy
 */
export const getDailyObjectiveController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    const objetivo = await getOrCreateDailyObjective(usuarioId);

    res.status(200).json(objetivo);
  } catch (error) {
    console.error('Error al obtener objetivo diario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};