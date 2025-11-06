// src/controllers/social.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Busca usuarios por nombre o email
 * GET /api/social/buscar
 */
export const findUsuariosController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    const { q } = req.query; // Término de búsqueda

    // Si no hay query 'q', devolvemos un array vacío o usuarios sugeridos
    if (!q || typeof q !== 'string') {
      return res.status(200).json([]);
    }

    const usuarios = await prisma.usuario.findMany({
      where: {
        // Buscamos por nombre O email
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        // Excluimos al propio usuario de los resultados
        NOT: {
          id: usuarioId,
        },
      },
      select: {
        id: true,
        nombre: true,
        email: true, // Útil para el frontend para mostrar
      },
      take: 10, // Limitamos a 10 resultados
    });

    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Seguir a un usuario
 * POST /api/social/seguir/:id
 */
export const followController = async (req: Request, res: Response) => {
  try {
    const seguidorId = req.user?.id!;
    const { id: seguidoId } = req.params; // ID del usuario a seguir

    // 1. No puedes seguirte a ti mismo
    if (seguidorId === seguidoId) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo.' });
    }

    // 2. Verificar que el usuario a seguir exista
    const usuarioASeguir = await prisma.usuario.findUnique({ where: { id: seguidoId }});
    if (!usuarioASeguir) {
        return res.status(404).json({ error: 'Usuario a seguir no encontrado.'});
    }

    // 3. Crear el seguimiento
    // Usamos 'create' con un catch por si ya existe (gracias al @@unique)
    await prisma.follow.create({
      data: {
        seguidorId,
        seguidoId,
      },
    });

    res.status(201).json({ message: `Ahora sigues a ${usuarioASeguir.nombre}.` });

  } catch (error) {
    // Manejo de error si la relación ya existe (violación de índice único)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya sigues a este usuario.' });
    }
    console.error('Error al seguir usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Dejar de seguir a un usuario
 * DELETE /api/social/dejar-de-seguir/:id
 */
export const unfollowController = async (req: Request, res: Response) => {
  try {
    const seguidorId = req.user?.id!;
    const { id: seguidoId } = req.params; // ID del usuario a dejar de seguir

    // Usamos deleteMany para evitar un error si la relación no existe
    const deleteResult = await prisma.follow.deleteMany({
      where: {
        seguidorId,
        seguidoId,
      },
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({ error: 'No estabas siguiendo a este usuario.' });
    }

    res.status(200).json({ message: 'Has dejado de seguir a este usuario.' });

  } catch (error) {
    console.error('Error al dejar de seguir:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Obtener el feed social (actividad de seguidos)
 * GET /api/social/feed?page=1&limit=20
 */
export const getFeedController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    
    // ✅ Convertir explícitamente a número con valores por defecto
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // 1. Calcular paginación
    const skip = (page - 1) * limit;

    // 2. Obtener IDs de los usuarios que sigo
    const seguidos = await prisma.follow.findMany({
      where: { seguidorId: usuarioId },
      select: { seguidoId: true },
    });
    const idsSeguidos = seguidos.map((f) => f.seguidoId);

    // Si no sigo a nadie, devolver respuesta vacía
    if (idsSeguidos.length === 0) {
      return res.status(200).json({
        metadata: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
        data: [],
      });
    }

    // 3. Definir el 'where' para las consultas
    const whereClause = {
      usuarioId: { in: idsSeguidos },
    };

    const [totalItems, feedData] = await prisma.$transaction([
      prisma.registroBebida.count({
        where: whereClause,
      }),
      prisma.registroBebida.findMany({
        where: whereClause,
        include: {
          usuario: { select: { nombre: true } },
          bebida: { select: { nombre: true } },
        },
        orderBy: {
          fechaHora: 'desc',
        },
        take: limit, // ✅ Ahora es número
        skip: skip,  // ✅ Ahora es número
      }),
    ]);

    // 5. Calcular metadata de paginación
    const totalPages = Math.ceil(totalItems / limit);
    
    // 6. Devolver la respuesta paginada
    res.status(200).json({
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
      data: feedData,
    });

  } catch (error) {
    console.error('Error al obtener feed:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Obtener el ranking de hoy (Tú + Seguidos)
 * GET /api/social/ranking
 */
export const getRankingController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;

    // 1. Obtener IDs de los usuarios que sigo
    const seguidos = await prisma.follow.findMany({
      where: { seguidorId: usuarioId },
      select: { seguidoId: true },
    });
    // Creamos una lista de IDs que incluye a mis amigos Y a mí
    const idsParaRanking = [...seguidos.map((f) => f.seguidoId), usuarioId];

    // 2. Definir el rango de "hoy"
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // 3. Agrupar registros por usuario y sumar su aporte hídrico
    const rankingData = await prisma.registroBebida.groupBy({
      by: ['usuarioId'],
      where: {
        usuarioId: { in: idsParaRanking },
        fechaHora: { gte: hoy, lt: manana },
      },
      _sum: {
        aporteHidricoMl: true,
      },
      orderBy: {
        _sum: {
          aporteHidricoMl: 'desc',
        },
      },
    });

    // 4. Obtener los nombres de los usuarios en el ranking
    const idsUsuariosEnRanking = rankingData.map((r) => r.usuarioId);
    const usuarios = await prisma.usuario.findMany({
      where: {
        id: { in: idsUsuariosEnRanking },
      },
      select: { id: true, nombre: true },
    });

    // 5. Combinar los datos del ranking con los nombres
    const rankingFinal = rankingData.map((r) => ({
      usuarioId: r.usuarioId,
      nombre: usuarios.find((u) => u.id === r.usuarioId)?.nombre || 'Usuario',
      totalMl: r._sum.aporteHidricoMl || 0,
      esUsuarioActual: r.usuarioId === usuarioId, // Flag para el frontend
    }));

    res.status(200).json(rankingFinal);
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};