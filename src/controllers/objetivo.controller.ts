// src/controllers/objetivo.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { calcularObjetivoHidratacion } from '../utils/hydration.utils';

/**
 * Obtiene el objetivo de hidratación para el día actual.
 * Si no existe, lo calcula, lo guarda y lo devuelve.
 * GET /api/objetivo/hoy
 */
export const getDailyObjectiveController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;

    // 1. Obtener el perfil del usuario (necesario para el cálculo)
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 2. Definir el día de hoy (en UTC para consistencia de DB)
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    // 3. Buscar un objetivo existente para hoy
    let objetivo = await prisma.objetivoHidratacion.findFirst({
      where: {
        usuarioId,
        fecha: hoy,
      },
    });

    // 4. Si no existe, lo creamos
    if (!objetivo) {
      // Usamos la función de cálculo
      const cantidadMl = calcularObjetivoHidratacion(usuario);

      objetivo = await prisma.objetivoHidratacion.create({
        data: {
          usuarioId,
          fecha: hoy,
          cantidadMl,
        },
      });
    }
    
    // 5. Devolvemos el objetivo (existente o recién creado)
    res.status(200).json(objetivo);

  } catch (error) {
    console.error('Error al obtener objetivo diario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};