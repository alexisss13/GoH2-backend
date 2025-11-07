// src/utils/mail.util.ts
import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Creamos un "transportador" de email
const createTransporter = async () => {
  // Si no hay variables de entorno, usamos una cuenta de prueba de Ethereal
  if (
    !process.env.MAIL_HOST ||
    process.env.MAIL_HOST === 'smtp.ethereal.email'
  ) {
    const testAccount = await nodemailer.createTestAccount();
    console.log('📬 Cuenta de email de prueba (Ethereal) creada:', testAccount);
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Si hay variables, usamos el transportador de producción (ej. Gmail, SendGrid)
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: parseInt(process.env.MAIL_PORT || '587') === 465, // true para puerto 465
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

/**
 * Envía un email. En desarrollo, loguea la URL de prueba.
 */
export const sendEmail = async (options: MailOptions) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"GoH2 App" <no-reply@goh2.com>',
      ...options,
    });

    console.log('📧 Mensaje enviado: %s', info.messageId);

    // Si usamos Ethereal, logueamos la URL para ver el email
    if (info.messageId.includes('ethereal.email')) {
      console.log(
        '✨ URL de vista previa del email: %s',
        nodemailer.getTestMessageUrl(info),
      );
    }
  } catch (error) {
    console.error('Error al enviar email:', error);
  }
};