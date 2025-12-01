// src/controllers/registro.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Crea un nuevo registro de bebida
 * POST /api/registros
 */
export const createRegistroController = async (req: Request, res: Response) => {
  try {
    const { bebidaId, cantidadConsumidaMl, tipoRegistro, fechaHora } = req.body;
    const usuarioId = req.user?.id!; // Sabemos que user.id existe por el middleware 'protectRoute'

    // 1. Buscar la bebida para obtener su factor de hidratación
    const bebida = await prisma.bebida.findUnique({
      where: { id: bebidaId },
    });

    if (!bebida) {
      return res.status(404).json({ error: 'Bebida no encontrada.' });
    }

    // 2. Calcular el aporte hídrico real
    // (Ej: 100ml de Cerveza (0.6) = 60ml de aporte)
    const aporteHidricoMl = Math.round(
      cantidadConsumidaMl * bebida.factorHidratacion,
    );

    // 3. Crear el registro en la base de datos
    const nuevoRegistro = await prisma.registroBebida.create({
      data: {
        usuarioId,
        bebidaId,
        cantidadConsumidaMl,
        aporteHidricoMl,
        tipoRegistro,
        fechaHora: fechaHora ? new Date(fechaHora) : new Date(), // Usa la fecha provista o la actual
      },
      // Devolvemos el registro con el nombre de la bebida incluida
      include: {
        bebida: {
          select: {
            nombre: true,
          },
        },
      },
    });

    res.status(201).json(nuevoRegistro);
  } catch (error) {
    console.error('Error al crear registro:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Endpoint especial para dispositivos IoT (sin autenticación JWT)
 * POST /api/registros/iot
 * Acepta: { usuarioId, cantidadConsumidaMl }
 * Busca automáticamente la bebida "Agua" y crea registro tipo DIGITAL
 */
export const createRegistroIoTController = async (req: Request, res: Response) => {
  try {
    const { usuarioId, cantidadConsumidaMl } = req.body;

    // Validar datos básicos
    if (!usuarioId || !cantidadConsumidaMl) {
      return res.status(400).json({ error: 'usuarioId y cantidadConsumidaMl son requeridos.' });
    }

    if (typeof cantidadConsumidaMl !== 'number' || cantidadConsumidaMl <= 0) {
      return res.status(400).json({ error: 'cantidadConsumidaMl debe ser un número positivo.' });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Buscar la bebida "Agua" (case-insensitive)
    const bebida = await prisma.bebida.findFirst({
      where: {
        nombre: {
          equals: 'Agua',
          mode: 'insensitive',
        },
      },
    });

    if (!bebida) {
      return res.status(404).json({ error: 'Bebida "Agua" no encontrada en el sistema.' });
    }

    // Calcular el aporte hídrico real
    const aporteHidricoMl = Math.round(
      cantidadConsumidaMl * bebida.factorHidratacion,
    );

    // Crear el registro en la base de datos
    const nuevoRegistro = await prisma.registroBebida.create({
      data: {
        usuarioId,
        bebidaId: bebida.id,
        cantidadConsumidaMl: Math.round(cantidadConsumidaMl),
        aporteHidricoMl,
        tipoRegistro: 'DIGITAL',
        fechaHora: new Date(),
      },
      include: {
        bebida: {
          select: {
            nombre: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Registro creado exitosamente.',
      registro: nuevoRegistro,
    });
  } catch (error) {
    console.error('Error al crear registro IoT:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene los registros de bebida del día actual
 * GET /api/registros
 */
export const getRegistrosController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
const { fecha } = req.query; // (Ej: "2025-10-30")

    // --- LÓGICA DE FECHA MODIFICADA ---
    
    // 1. Determinar la fecha a buscar.
    // Si se provee una fecha, la usamos. Si no, usamos "hoy".
    const fechaBuscada = fecha ? new Date(fecha as string) : new Date();
    
    // Ajuste para asegurar que tomamos la fecha en la zona horaria local del servidor
    // y no nos confundimos con UTC (para el filtro YYYY-MM-DD)
    if (fecha) {
        // Corrección: new Date("2025-10-30") puede interpretarse como UTC.
        // Nos aseguramos de construir la fecha correctamente.
        const [year, month, day] = (fecha as string).split('-').map(Number);
        fechaBuscada.setFullYear(year, month - 1, day);
    }
    
    // 2. Definir el rango de fechas (el día completo)
    const inicioDia = new Date(fechaBuscada);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(inicioDia);
    finDia.setDate(finDia.getDate() + 1);
    // --- FIN DE LÓGICA MODIFICADA ---

    // 2. Buscar todos los registros del usuario dentro de ese rango
    const registros = await prisma.registroBebida.findMany({
      where: {
        usuarioId,
        fechaHora: {
          gte: inicioDia, // Mayor o igual al inicio de hoy
          lt: finDia, // Menor que el inicio de mañana
        },
      },
      include: {
        bebida: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaHora: 'desc', // El más reciente primero
      },
    });

    // 3. Calcular el total de aporte hídrico (como se ve en la pantalla 9 )
    const totalAporteDia = registros.reduce(
      (sum, registro) => sum + registro.aporteHidricoMl,
      0,
    );

    res.status(200).json({
      totalAporteDia,
      registros,
    });
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};