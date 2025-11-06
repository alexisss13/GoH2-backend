// src/controllers/configuracion.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { comparePassword, hashPassword } from '../utils/auth.utils';

/**
 * Cambia la contraseña del usuario autenticado
 * POST /api/configuracion/cambiar-password
 */
export const changePasswordController = async (req: Request, res: Response) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const usuarioId = req.user?.id!;

    // 1. Obtener el usuario (incluyendo su hash de password)
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 2. Verificar la contraseña actual
    const isMatch = await comparePassword(passwordActual, usuario.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    // 3. Hashear la nueva contraseña
    const nuevaPasswordHash = await hashPassword(passwordNueva);

    // 4. Actualizar la contraseña en la BD
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        passwordHash: nuevaPasswordHash,
      },
    });

    res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};