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
          _count: {
            select: { likes: true, comentarios: true },
          },
          likes: {
            where: {
              usuarioId: usuarioId, // Solo búsca mis likes
            },
            select: {
              id: true, // Para saber si ya le di like
            },
          },
        },
        orderBy: {
          fechaHora: 'desc',
        },
        take: limit,
        skip: skip,
      }),
    ]);

    // Procesamos la data para que sea más fácil para el frontend
    const formatedData = feedData.map(registro => {
      const { _count, likes, ...restoDelRegistro } = registro;
      return {
        ...restoDelRegistro,
        conteoDeLikes: _count.likes,
        conteoDeComentarios: _count.comentarios,
        // 'leDiLike' será true si encontramos un like nuestro
        leDiLike: likes.length > 0, 
      };
    });

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
      data: formatedData,
    });

  } catch (error) {
    console.error('Error al obtener feed:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Obtener el ranking (Diario, Semanal, Mensual)
 * GET /api/social/ranking?periodo=dia|semana|mes
 */
export const getRankingController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    // El 'periodo' ya está validado y tiene un default gracias al middleware
    const { periodo } = req.query as { periodo: 'dia' | 'semana' | 'mes' };

    // 1. Obtener IDs de los usuarios que sigo
    const seguidos = await prisma.follow.findMany({
      where: { seguidorId: usuarioId },
      select: { seguidoId: true },
    });
    const idsParaRanking = [...seguidos.map((f) => f.seguidoId), usuarioId];

    // Definir el rango de fechas basado en el periodo
    const finPeriodo = new Date(); // El final del rango es siempre "ahora"
    const inicioPeriodo = new Date(); // El inicio del rango cambiará

    if (periodo === 'mes') {
      // Setea al primer día del mes actual, a las 00:00:00
      inicioPeriodo.setDate(1);
      inicioPeriodo.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      // Setea al inicio de los últimos 7 días (incluyendo hoy)
      inicioPeriodo.setDate(inicioPeriodo.getDate() - 6); // 6 días atrás + hoy = 7 días
      inicioPeriodo.setHours(0, 0, 0, 0);
    } else {
      // 'dia' (default)
      // Setea al inicio del día de hoy
      inicioPeriodo.setHours(0, 0, 0, 0);
    }

    // 3. Agrupar registros por usuario y sumar su aporte hídrico
    const rankingData = await prisma.registroBebida.groupBy({
      by: ['usuarioId'],
      where: {
        usuarioId: { in: idsParaRanking },
        fechaHora: {
          gte: inicioPeriodo, // Desde el inicio del periodo
          lt: finPeriodo,     // Hasta ahora
        },
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
    
    // Optimización: No buscar en la DB si el ranking está vacío
    let usuarios: { id: string; nombre: string }[] = [];
;
    if (idsUsuariosEnRanking.length > 0) {
      usuarios = await prisma.usuario.findMany({
        where: {
          id: { in: idsUsuariosEnRanking },
        },
        select: { id: true, nombre: true },
      });
    }

    // 5. Combinar los datos del ranking con los nombres
    const rankingFinal = rankingData.map((r) => ({
      usuarioId: r.usuarioId,
      nombre: usuarios.find((u) => u.id === r.usuarioId)?.nombre || 'Usuario',
      totalMl: r._sum.aporteHidricoMl || 0,
      esUsuarioActual: r.usuarioId === usuarioId,
    }));

    res.status(200).json(rankingFinal);
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Dar like a un registro
 * POST /api/social/registros/:id/like
 */
export const likeRegistroController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    const { id: registroId } = req.params;

    // Usamos 'upsert' para crear el like. Si ya existe (por el @@unique),
    // no hace nada, previniendo duplicados de forma segura.
    await prisma.like.upsert({
      where: {
        usuarioId_registroId: {
          usuarioId,
          registroId,
        },
      },
      create: {
        usuarioId,
        registroId,
      },
      update: {}, // No hacemos nada si ya existe
    });
    
    res.status(201).json({ message: 'Like añadido.' });
  } catch (error) {
    // Manejo de error si el registro no existe (violación de Foreign Key)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(404).json({ error: 'El registro de bebida no existe.' });
    }
    console.error('Error al dar like:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Quitar like a un registro
 * DELETE /api/social/registros/:id/like
 */
export const unlikeRegistroController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    const { id: registroId } = req.params;

    // Usamos deleteMany por si el like no existía, para no fallar
    await prisma.like.deleteMany({
      where: {
        usuarioId,
        registroId,
      },
    });

    res.status(200).json({ message: 'Like eliminado.' });
  } catch (error) {
    console.error('Error al quitar like:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Comentar en un registro
 * POST /api/social/registros/:id/comentar
 */
export const comentarRegistroController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    const { id: registroId } = req.params;
    const { texto } = req.body;

    const nuevoComentario = await prisma.comentario.create({
      data: {
        texto,
        usuarioId,
        registroId,
      },
      include: {
        usuario: { select: { nombre: true, id: true }}
      }
    });

    res.status(201).json(nuevoComentario);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(404).json({ error: 'El registro de bebida no existe.' });
    }
    console.error('Error al comentar:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Obtener comentarios de un registro
 * GET /api/social/registros/:id/comentarios
 */
export const getComentariosController = async (req: Request, res: Response) => {
  try {
    const { id: registroId } = req.params;

    const comentarios = await prisma.comentario.findMany({
      where: { registroId },
      include: {
        usuario: { select: { nombre: true, id: true } }, // Devolvemos el nombre y ID
      },
      orderBy: {
        createdAt: 'asc', // El más antiguo primero
      },
    });

    res.status(200).json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Borrar un comentario
 * DELETE /api/social/comentarios/:id
 */
export const deleteComentarioController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    const { id: comentarioId } = req.params;

    // 1. Buscar el comentario
    const comentario = await prisma.comentario.findUnique({
      where: { id: comentarioId },
    });

    if (!comentario) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }

    // 2. Verificar que el usuario es el dueño del comentario
    if (comentario.usuarioId !== usuarioId) {
      return res.status(403).json({ error: 'No autorizado para borrar este comentario.' });
    }

    // 3. Borrar el comentario
    await prisma.comentario.delete({
      where: { id: comentarioId },
    });

    res.status(200).json({ message: 'Comentario eliminado.' });
  } catch (error) {
    console.error('Error al borrar comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};