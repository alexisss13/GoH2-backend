// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { comparePassword, generateJwt, hashPassword } from '../utils/auth.utils';

/**
 * Registra un nuevo usuario
 * POST /api/auth/registro
 */
export const registerController = async (req: Request, res: Response) => {
  try {
    const { email, nombre, password } = req.body;

    // 1. Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Respondemos como en la pantalla 18
      return res.status(409).json({
        error: 'Lo sentimos, este correo ya ha sido registrado.',
      });
    }

    // 2. Hashear la contraseña
    const passwordHash = await hashPassword(password);

    // 3. Crear el nuevo usuario
    await prisma.usuario.create({
      data: {
        email,
        nombre,
        passwordHash,
      },
    });

    // 4. Responder (como en la pantalla 17)
    return res.status(201).json({
      message: 'Usuario registrado correctamente.',
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * Inicia sesión de un usuario
 * POST /api/auth/login
 */
export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Encontrar al usuario
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // 2. Comparar contraseñas
    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // 3. Generar JWT
    const token = generateJwt(user.id, user.email);

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
    });
  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};