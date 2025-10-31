// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { calcularObjetivoHidratacion } from '../utils/hydration.utils';

/**
 * Obtiene el perfil del usuario autenticado
 * GET /api/perfil
 */
export const getProfileController = async (req: Request, res: Response) => {
  try {
    // req.user.id es añadido por el middleware 'protectRoute'
    const userId = req.user?.id;

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      // Excluimos explícitamente el hash de la contraseña de la respuesta
      select: {
        id: true,
        email: true,
        nombre: true,
        fechaNacimiento: true,
        genero: true,
        alturaCm: true,
        pesoKg: true,
        nivelActividad: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Actualiza el perfil del usuario autenticado
 * PUT /api/perfil
 */
export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    const dataToUpdate = req.body;

    // Convertimos la fecha de nacimiento si viene como string
    if (dataToUpdate.fechaNacimiento) {
      dataToUpdate.fechaNacimiento = new Date(dataToUpdate.fechaNacimiento);
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: dataToUpdate,
      // Excluimos el hash de la contraseña de la respuesta actualizada
      select: {
        id: true,
        email: true,
        nombre: true,
        fechaNacimiento: true,
        genero: true,
        alturaCm: true,
        pesoKg: true,
        nivelActividad: true,
        createdAt: true,
      },
    });

    // Obtenemos el usuario completo actualizado para el cálculo
    const fullUpdatedUser = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!fullUpdatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado después de actualizar."});
    }

  // --- ¡NUEVA LÓGICA DE RECÁLCULO! ---
    // 2. Verificamos si los datos actualizados afectan el cálculo
    if (dataToUpdate.pesoKg || dataToUpdate.nivelActividad) {
      
      console.log('Detectado cambio de perfil, recalculando objetivo...');
      
      // 3. Calculamos el nuevo objetivo
      const nuevoObjetivoMl = calcularObjetivoHidratacion(fullUpdatedUser);
      
      // 4. Definimos hoy (UTC)
      const hoy = new Date();
      hoy.setUTCHours(0, 0, 0, 0);

      // 5. Actualizamos (o creamos) el objetivo de HOY con el nuevo valor
      await prisma.objetivoHidratacion.upsert({
        where: {
          // Busca por el índice único (usuarioId y fecha)
          usuarioId_fecha: {
            usuarioId: userId,
            fecha: hoy,
          }
        },
        // Si no existe, lo crea
        create: {
          usuarioId: userId,
          fecha: hoy,
          cantidadMl: nuevoObjetivoMl,
        },
        // Si existe, lo actualiza
        update: {
          cantidadMl: nuevoObjetivoMl,
        },
      });
    }
    // --- FIN DE LA NUEVA LÓGICA ---

    // Excluimos el password hash de la respuesta final
    const { passwordHash, ...userResponse } = fullUpdatedUser;

    res.status(200).json({
      message: 'Perfil actualizado correctamente.',
      usuario: updatedUser,
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Verifica si el perfil está completo para el cálculo avanzado.
 * GET /api/perfil/estado-calculo
 */
export const getProfileStatusController = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id!;
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        pesoKg: true,
        alturaCm: true,
        fechaNacimiento: true,
        genero: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Verificamos los campos necesarios para la fórmula Mifflin-St Jeor
    const isComplete =
      usuario.pesoKg &&
      usuario.pesoKg > 0 &&
      usuario.alturaCm &&
      usuario.alturaCm > 0 &&
      usuario.fechaNacimiento &&
      (usuario.genero === 'Masculino' || usuario.genero === 'Femenino');
    
    if (isComplete) {
      return res.status(200).json({
        isComplete: true,
        message: 'Tu perfil está completo. Usando cálculo de precisión.',
      });
    }

    return res.status(200).json({
      isComplete: false,
      message: 'Completa tu perfil para un cálculo de hidratación más preciso.',
    });
  } catch (error) {
    console.error('Error al verificar estado de perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};