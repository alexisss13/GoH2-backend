// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { comparePassword, generateJwt, hashPassword } from '../utils/auth.utils';
import { sendEmail } from '../utils/mail.util';

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

/**
 * Solicita un reseteo de contraseña
 * POST /api/auth/olvide-password
 */
export const olvidePasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // 1. Encontrar al usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    // ¡Importante! Por seguridad, no revelamos si el usuario existe o no.
    // Siempre respondemos 200 OK.
    if (!usuario) {
      console.log(`Solicitud de reseteo para email no existente: ${email}`);
      return res.status(200).json({
        message: 'Si tu correo está registrado, recibirás un enlace de restablecimiento.',
      });
    }

    // 2. Generar un token seguro (NO un JWT)
    const resetToken = crypto.randomBytes(32).toString('hex');
    // 3. Hashear el token antes de guardarlo en la BD
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // 4. Setear expiración (ej: 15 minutos)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 5. Guardar el token hasheado en la BD
    // Borramos tokens viejos de este usuario primero
    await prisma.passwordResetToken.deleteMany({
        where: { usuarioId: usuario.id }
    });
    await prisma.passwordResetToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash,
        expiresAt,
      },
    });

    // 6. Crear la URL de reseteo (esto apunta al frontend)
    // El frontend recibirá el token y hará la llamada a /restablecer-password
    const resetUrl = `${process.env.FRONTEND_URL}/restablecer-password?token=${resetToken}`;

    // 7. Enviar el email (simulado)
    await sendEmail({
      to: usuario.email,
      subject: 'Restablece tu contraseña de GoH2',
      text: `Recibiste esto porque solicitaste un restablecimiento de contraseña. Por favor, haz clic en este enlace para continuar: ${resetUrl}\n\nSi no solicitaste esto, ignora este email.`,
      html: `<p>Recibiste esto porque solicitaste un restablecimiento de contraseña. Por favor, haz clic en este enlace para continuar:</p><a href="${resetUrl}">${resetUrl}</a><p>Si no solicitaste esto, ignora este email.</p>`,
    });

    res.status(200).json({
      message: 'Si tu correo está registrado, recibirás un enlace de restablecimiento.',
    });
    
  } catch (error) {
    console.error('Error en olvide-password:', error);
    // No enviar 500 al cliente, es un flujo de seguridad
    res.status(200).json({
      message: 'Si tu correo está registrado, recibirás un enlace de restablecimiento.',
    });
  }
};


/**
 * Restablece la contraseña usando un token
 * POST /api/auth/restablecer-password
 */
export const restablecerPasswordController = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // 1. Hashear el token recibido del cliente
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 2. Buscar el token hasheado en la BD
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    // 3. Validar el token
    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido.' });
    }

    // 4. Validar expiración
    if (new Date() > resetToken.expiresAt) {
      // Borrar token expirado
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id }});
      return res.status(400).json({ error: 'Token expirado. Solicita uno nuevo.' });
    }
    
    // 5. Hashear el nuevo password
    const passwordHash = await hashPassword(password);

    // 6. Actualizar el password del usuario
    await prisma.usuario.update({
      where: { id: resetToken.usuarioId },
      data: { passwordHash },
    });

    // 7. Borrar el token (¡Importante! Es de un solo uso)
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    res.status(200).json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });

  } catch (error) {
    console.error('Error en restablecer-password:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};