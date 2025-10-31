// src/controllers/resumen.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getOrCreateDailyObjective } from '../utils/hydration.utils';

/**
 * Obtiene el resumen del día para la pantalla "Home" (Dashboard).
 * Combina el total consumido y el objetivo del día.
 * GET /api/resumen/hoy
 */
export const getDailySummaryController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;

    // 1. Definir el rango de fechas para "hoy"
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // 2. Obtener el objetivo (usando la función reutilizable)
    const objetivo = await getOrCreateDailyObjective(usuarioId);

    // 3. Obtener los registros de hoy y calcular el total
    // (Usamos findMany y reduce, es más eficiente que aggregate + findMany)
    const registrosHoy = await prisma.registroBebida.findMany({
      where: {
        usuarioId,
        fechaHora: {
          gte: hoy,
          lt: manana,
        },
      },
      select: {
        aporteHidricoMl: true, // Solo necesitamos esto para el total
      },
    });

    const totalAporteHoy = registrosHoy.reduce(
      (sum, registro) => sum + registro.aporteHidricoMl,
      0,
    );
    
    // 4. Devolver la respuesta combinada
    res.status(200).json({
      consumidoMl: totalAporteHoy,
      objetivoMl: objetivo.cantidadMl,
    });
    
  } catch (error) {
    console.error('Error al obtener resumen diario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};